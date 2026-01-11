from fastapi import FastAPI, APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import json
import asyncio
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'xiangqi-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Stripe Config
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()


from fastapi.middleware.cors import CORSMiddleware
import os

def parse_origins(value: str):
    return [o.strip() for o in (value or "").split(",") if o.strip()]

origins = parse_origins(os.getenv("CORS_ORIGINS")) or [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,  # JWT header -> không cần cookie
    allow_methods=["*"],
    allow_headers=["*"],
)


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class PieceType(str, Enum):
    GENERAL = "general"  # Tướng/Soái
    ADVISOR = "advisor"  # Sĩ
    ELEPHANT = "elephant"  # Tượng
    HORSE = "horse"  # Mã
    CHARIOT = "chariot"  # Xe
    CANNON = "cannon"  # Pháo
    SOLDIER = "soldier"  # Tốt/Binh

class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    elo: int = 1200
    coins: int = 0
    games_played: int = 0
    wins: int = 0
    losses: int = 0
    draws: int = 0
    created_at: str

class RoomCreate(BaseModel):
    name: str
    time_control: int = 600  # seconds
    is_ranked: bool = True

class RoomResponse(BaseModel):
    id: str
    name: str
    host_id: str
    host_username: str
    host_elo: int
    guest_id: Optional[str] = None
    guest_username: Optional[str] = None
    guest_elo: Optional[int] = None
    time_control: int
    is_ranked: bool
    status: str  # waiting, playing, finished
    created_at: str

class MoveRequest(BaseModel):
    game_id: str
    from_pos: List[int]  # [row, col]
    to_pos: List[int]  # [row, col]

class GameResponse(BaseModel):
    id: str
    room_id: str
    red_player_id: str
    red_player_username: str
    black_player_id: str
    black_player_username: str
    board: List[List[Optional[Dict]]]
    current_turn: str  # red or black
    red_time: int
    black_time: int
    moves: List[Dict]
    status: str  # playing, red_won, black_won, draw
    winner_id: Optional[str] = None
    created_at: str

class ChatMessage(BaseModel):
    game_id: str
    message: str

class ShopPackage(BaseModel):
    id: str
    name: str
    coins: int
    price: float
    description: str

class CheckoutRequest(BaseModel):
    package_id: str
    origin_url: str

# ==================== XIANGQI GAME LOGIC ====================

def create_initial_board():
    """Create the initial Xiangqi board setup"""
    board = [[None for _ in range(9)] for _ in range(10)]
    
    # Black pieces (top - rows 0-4)
    board[0][0] = {"type": "chariot", "color": "black"}
    board[0][1] = {"type": "horse", "color": "black"}
    board[0][2] = {"type": "elephant", "color": "black"}
    board[0][3] = {"type": "advisor", "color": "black"}
    board[0][4] = {"type": "general", "color": "black"}
    board[0][5] = {"type": "advisor", "color": "black"}
    board[0][6] = {"type": "elephant", "color": "black"}
    board[0][7] = {"type": "horse", "color": "black"}
    board[0][8] = {"type": "chariot", "color": "black"}
    board[2][1] = {"type": "cannon", "color": "black"}
    board[2][7] = {"type": "cannon", "color": "black"}
    board[3][0] = {"type": "soldier", "color": "black"}
    board[3][2] = {"type": "soldier", "color": "black"}
    board[3][4] = {"type": "soldier", "color": "black"}
    board[3][6] = {"type": "soldier", "color": "black"}
    board[3][8] = {"type": "soldier", "color": "black"}
    
    # Red pieces (bottom - rows 5-9)
    board[9][0] = {"type": "chariot", "color": "red"}
    board[9][1] = {"type": "horse", "color": "red"}
    board[9][2] = {"type": "elephant", "color": "red"}
    board[9][3] = {"type": "advisor", "color": "red"}
    board[9][4] = {"type": "general", "color": "red"}
    board[9][5] = {"type": "advisor", "color": "red"}
    board[9][6] = {"type": "elephant", "color": "red"}
    board[9][7] = {"type": "horse", "color": "red"}
    board[9][8] = {"type": "chariot", "color": "red"}
    board[7][1] = {"type": "cannon", "color": "red"}
    board[7][7] = {"type": "cannon", "color": "red"}
    board[6][0] = {"type": "soldier", "color": "red"}
    board[6][2] = {"type": "soldier", "color": "red"}
    board[6][4] = {"type": "soldier", "color": "red"}
    board[6][6] = {"type": "soldier", "color": "red"}
    board[6][8] = {"type": "soldier", "color": "red"}
    
    return board

def is_valid_move(board, from_pos, to_pos, color):
    """Validate if a move is legal in Xiangqi"""
    from_row, from_col = from_pos
    to_row, to_col = to_pos
    
    # Basic bounds check
    if not (0 <= to_row < 10 and 0 <= to_col < 9):
        return False
    
    piece = board[from_row][from_col]
    if not piece or piece["color"] != color:
        return False
    
    target = board[to_row][to_col]
    if target and target["color"] == color:
        return False  # Can't capture own piece
    
    piece_type = piece["type"]
    
    # Movement rules for each piece type
    if piece_type == "general":
        return is_valid_general_move(board, from_pos, to_pos, color)
    elif piece_type == "advisor":
        return is_valid_advisor_move(from_pos, to_pos, color)
    elif piece_type == "elephant":
        return is_valid_elephant_move(board, from_pos, to_pos, color)
    elif piece_type == "horse":
        return is_valid_horse_move(board, from_pos, to_pos)
    elif piece_type == "chariot":
        return is_valid_chariot_move(board, from_pos, to_pos)
    elif piece_type == "cannon":
        return is_valid_cannon_move(board, from_pos, to_pos)
    elif piece_type == "soldier":
        return is_valid_soldier_move(from_pos, to_pos, color)
    
    return False

def is_valid_general_move(board, from_pos, to_pos, color):
    """General can only move within the palace, one step orthogonally"""
    from_row, from_col = from_pos
    to_row, to_col = to_pos
    
    # Palace bounds
    if color == "red":
        if not (7 <= to_row <= 9 and 3 <= to_col <= 5):
            return False
    else:
        if not (0 <= to_row <= 2 and 3 <= to_col <= 5):
            return False
    
    # One step orthogonally
    if abs(from_row - to_row) + abs(from_col - to_col) != 1:
        return False
    
    # Check flying general rule (generals can't face each other)
    return True

def is_valid_advisor_move(from_pos, to_pos, color):
    """Advisor moves diagonally within the palace"""
    from_row, from_col = from_pos
    to_row, to_col = to_pos
    
    # Palace bounds
    if color == "red":
        if not (7 <= to_row <= 9 and 3 <= to_col <= 5):
            return False
    else:
        if not (0 <= to_row <= 2 and 3 <= to_col <= 5):
            return False
    
    # One step diagonally
    return abs(from_row - to_row) == 1 and abs(from_col - to_col) == 1

def is_valid_elephant_move(board, from_pos, to_pos, color):
    """Elephant moves exactly 2 points diagonally, can't cross river"""
    from_row, from_col = from_pos
    to_row, to_col = to_pos
    
    # Can't cross river
    if color == "red":
        if to_row < 5:
            return False
    else:
        if to_row > 4:
            return False
    
    # Must move exactly 2 diagonally
    if abs(from_row - to_row) != 2 or abs(from_col - to_col) != 2:
        return False
    
    # Check blocking piece at the center
    mid_row = (from_row + to_row) // 2
    mid_col = (from_col + to_col) // 2
    if board[mid_row][mid_col]:
        return False
    
    return True

def is_valid_horse_move(board, from_pos, to_pos):
    """Horse moves in L-shape, can be blocked"""
    from_row, from_col = from_pos
    to_row, to_col = to_pos
    
    row_diff = abs(from_row - to_row)
    col_diff = abs(from_col - to_col)
    
    if not ((row_diff == 2 and col_diff == 1) or (row_diff == 1 and col_diff == 2)):
        return False
    
    # Check for blocking piece
    if row_diff == 2:
        block_row = from_row + (1 if to_row > from_row else -1)
        if board[block_row][from_col]:
            return False
    else:
        block_col = from_col + (1 if to_col > from_col else -1)
        if board[from_row][block_col]:
            return False
    
    return True

def is_valid_chariot_move(board, from_pos, to_pos):
    """Chariot moves any distance orthogonally, can't jump"""
    from_row, from_col = from_pos
    to_row, to_col = to_pos
    
    if from_row != to_row and from_col != to_col:
        return False
    
    # Check for pieces in path
    if from_row == to_row:
        start, end = min(from_col, to_col) + 1, max(from_col, to_col)
        for col in range(start, end):
            if board[from_row][col]:
                return False
    else:
        start, end = min(from_row, to_row) + 1, max(from_row, to_row)
        for row in range(start, end):
            if board[row][from_col]:
                return False
    
    return True

def is_valid_cannon_move(board, from_pos, to_pos):
    """Cannon moves like chariot but must jump exactly one piece to capture"""
    from_row, from_col = from_pos
    to_row, to_col = to_pos
    
    if from_row != to_row and from_col != to_col:
        return False
    
    target = board[to_row][to_col]
    pieces_between = 0
    
    if from_row == to_row:
        start, end = min(from_col, to_col) + 1, max(from_col, to_col)
        for col in range(start, end):
            if board[from_row][col]:
                pieces_between += 1
    else:
        start, end = min(from_row, to_row) + 1, max(from_row, to_row)
        for row in range(start, end):
            if board[row][from_col]:
                pieces_between += 1
    
    if target:  # Capturing
        return pieces_between == 1
    else:  # Moving
        return pieces_between == 0

def is_valid_soldier_move(from_pos, to_pos, color):
    """Soldier moves forward, after crossing river can also move sideways"""
    from_row, from_col = from_pos
    to_row, to_col = to_pos
    
    if color == "red":
        # Before crossing river (rows 5-9), can only move up
        if from_row > 4:
            return to_row == from_row - 1 and to_col == from_col
        else:
            # After crossing river, can move up or sideways
            if to_row == from_row - 1 and to_col == from_col:
                return True
            if to_row == from_row and abs(to_col - from_col) == 1:
                return True
    else:
        # Black moves down
        if from_row < 5:
            return to_row == from_row + 1 and to_col == from_col
        else:
            if to_row == from_row + 1 and to_col == from_col:
                return True
            if to_row == from_row and abs(to_col - from_col) == 1:
                return True
    
    return False

def find_general(board, color):
    """Find the position of the general"""
    for row in range(10):
        for col in range(9):
            piece = board[row][col]
            if piece and piece["type"] == "general" and piece["color"] == color:
                return [row, col]
    return None

def is_in_check(board, color):
    """Check if the general of given color is in check"""
    general_pos = find_general(board, color)
    if not general_pos:
        return True  # General captured (shouldn't happen)
    
    opponent = "black" if color == "red" else "red"
    
    # Check if any opponent piece can capture the general
    for row in range(10):
        for col in range(9):
            piece = board[row][col]
            if piece and piece["color"] == opponent:
                if is_valid_move(board, [row, col], general_pos, opponent):
                    return True
    
    return False

def is_checkmate(board, color):
    """Check if the given color is in checkmate"""
    if not is_in_check(board, color):
        return False
    
    # Try all possible moves for the player
    for from_row in range(10):
        for from_col in range(9):
            piece = board[from_row][from_col]
            if piece and piece["color"] == color:
                for to_row in range(10):
                    for to_col in range(9):
                        if is_valid_move(board, [from_row, from_col], [to_row, to_col], color):
                            # Try the move
                            temp_board = [row[:] for row in board]
                            temp_board[to_row][to_col] = temp_board[from_row][from_col]
                            temp_board[from_row][from_col] = None
                            if not is_in_check(temp_board, color):
                                return False  # Found a legal move
    
    return True

# ==================== SIMPLE AI ====================

def evaluate_board(board):
    """Simple evaluation function for AI"""
    piece_values = {
        "general": 10000,
        "chariot": 90,
        "cannon": 45,
        "horse": 40,
        "elephant": 20,
        "advisor": 20,
        "soldier": 10
    }
    
    score = 0
    for row in range(10):
        for col in range(9):
            piece = board[row][col]
            if piece:
                value = piece_values.get(piece["type"], 0)
                if piece["color"] == "black":
                    score += value
                else:
                    score -= value
    
    return score

def get_all_moves(board, color):
    """Get all valid moves for a color"""
    moves = []
    for from_row in range(10):
        for from_col in range(9):
            piece = board[from_row][from_col]
            if piece and piece["color"] == color:
                for to_row in range(10):
                    for to_col in range(9):
                        if is_valid_move(board, [from_row, from_col], [to_row, to_col], color):
                            moves.append(([from_row, from_col], [to_row, to_col]))
    return moves

def ai_make_move(board, color, depth=2):
    """Simple minimax AI to select a move"""
    import random
    
    def minimax(board, depth, is_maximizing, alpha, beta):
        if depth == 0:
            return evaluate_board(board), None
        
        current_color = "black" if is_maximizing else "red"
        moves = get_all_moves(board, current_color)
        
        if not moves:
            if is_in_check(board, current_color):
                return (-10000 if is_maximizing else 10000), None
            return 0, None  # Stalemate
        
        best_move = None
        if is_maximizing:
            max_eval = float('-inf')
            for from_pos, to_pos in moves:
                temp_board = [row[:] for row in board]
                temp_board[to_pos[0]][to_pos[1]] = temp_board[from_pos[0]][from_pos[1]]
                temp_board[from_pos[0]][from_pos[1]] = None
                
                eval_score, _ = minimax(temp_board, depth - 1, False, alpha, beta)
                if eval_score > max_eval:
                    max_eval = eval_score
                    best_move = (from_pos, to_pos)
                alpha = max(alpha, eval_score)
                if beta <= alpha:
                    break
            return max_eval, best_move
        else:
            min_eval = float('inf')
            for from_pos, to_pos in moves:
                temp_board = [row[:] for row in board]
                temp_board[to_pos[0]][to_pos[1]] = temp_board[from_pos[0]][from_pos[1]]
                temp_board[from_pos[0]][from_pos[1]] = None
                
                eval_score, _ = minimax(temp_board, depth - 1, True, alpha, beta)
                if eval_score < min_eval:
                    min_eval = eval_score
                    best_move = (from_pos, to_pos)
                beta = min(beta, eval_score)
                if beta <= alpha:
                    break
            return min_eval, best_move
    
    is_max = color == "black"
    _, best_move = minimax(board, depth, is_max, float('-inf'), float('inf'))
    
    if not best_move:
        moves = get_all_moves(board, color)
        if moves:
            best_move = random.choice(moves)
    
    return best_move

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== WEBSOCKET MANAGER ====================

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}  # game_id -> {user_id: ws}
        self.user_to_game: Dict[str, str] = {}  # user_id -> game_id
    
    async def connect(self, websocket: WebSocket, game_id: str, user_id: str):
        await websocket.accept()
        if game_id not in self.active_connections:
            self.active_connections[game_id] = {}
        self.active_connections[game_id][user_id] = websocket
        self.user_to_game[user_id] = game_id

        # Track who actually opened the game (used to avoid "ghost joined" UI)
        try:
            await db.games.update_one(
                {"id": game_id},
                {"$addToSet": {"connected_user_ids": user_id}}
            )
        except Exception:
            pass

    
        def disconnect(self, game_id: str, user_id: str):
            if game_id in self.active_connections:
                self.active_connections[game_id].pop(user_id, None)
                if not self.active_connections[game_id]:
                    del self.active_connections[game_id]
            self.user_to_game.pop(user_id, None)

        # Best-effort cleanup; game may have ended or been deleted
        async def _cleanup():
            try:
                await db.games.update_one(
                    {"id": game_id},
                    {"$pull": {"connected_user_ids": user_id}}
                )
            except Exception:
                pass
        try:
            asyncio.create_task(_cleanup())
        except Exception:
            pass

    
    async def broadcast_to_game(self, game_id: str, message: dict):
        if game_id in self.active_connections:
            for ws in self.active_connections[game_id].values():
                try:
                    await ws.send_json(message)
                except:
                    pass

manager = ConnectionManager()

# ==================== SHOP PACKAGES ====================

SHOP_PACKAGES = [
    {"id": "small", "name": "Gói Nhỏ", "coins": 100, "price": 1.00, "description": "100 xu vàng"},
    {"id": "medium", "name": "Gói Vừa", "coins": 500, "price": 4.00, "description": "500 xu vàng + Bonus 50"},
    {"id": "large", "name": "Gói Lớn", "coins": 1200, "price": 9.00, "description": "1200 xu vàng + Bonus 200"},
    {"id": "premium", "name": "Gói VIP", "coins": 3000, "price": 19.00, "description": "3000 xu vàng + Avatar VIP"},
]

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(data: UserRegister):
    # Check if user exists
    existing = await db.users.find_one({"$or": [{"email": data.email}, {"username": data.username}]})
    if existing:
        raise HTTPException(status_code=400, detail="Email hoặc tên người dùng đã tồn tại")
    
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "username": data.username,
        "email": data.email,
        "password": hash_password(data.password),
        "elo": 1200,
        "coins": 100,  # Bonus starting coins
        "games_played": 0,
        "wins": 0,
        "losses": 0,
        "draws": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "connected_user_ids": [],
        "connected_user_ids": []
    }
    
    await db.users.insert_one(user)
    token = create_token(user_id)
    
    return {
        "token": token,
        "user": {k: v for k, v in user.items() if k not in ["password", "_id"]}
    }

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")
    
    token = create_token(user["id"])
    return {
        "token": token,
        "user": {k: v for k, v in user.items() if k not in ["password", "_id"]}
    }

@api_router.get("/auth/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    return user

# ==================== USER PROFILE UPDATE ====================

class ProfileUpdate(BaseModel):
    username: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    avatar_url: Optional[str] = None

@api_router.put("/users/profile")
async def update_profile(data: ProfileUpdate, user: dict = Depends(get_current_user)):
    update_data = {}
    if data.username:
        # Check if username is taken
        existing = await db.users.find_one({"username": data.username, "id": {"$ne": user["id"]}})
        if existing:
            raise HTTPException(status_code=400, detail="Tên người dùng đã được sử dụng")
        update_data["username"] = data.username
    if data.age is not None:
        update_data["age"] = data.age
    if data.gender:
        update_data["gender"] = data.gender
    if data.avatar_url:
        update_data["avatar_url"] = data.avatar_url
    
    if update_data:
        await db.users.update_one({"id": user["id"]}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password": 0})
    return updated_user

# ==================== ROOM ROUTES ====================

@api_router.post("/rooms", response_model=RoomResponse)
async def create_room(data: RoomCreate, user: dict = Depends(get_current_user)):
    room_id = str(uuid.uuid4())
    room = {
        "id": room_id,
        "name": data.name,
        "host_id": user["id"],
        "host_username": user["username"],
        "host_elo": user["elo"],
        "guest_id": None,
        "guest_username": None,
        "guest_elo": None,
        "time_control": data.time_control,
        "is_ranked": data.is_ranked,
        "status": "waiting",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "connected_user_ids": [],
        "connected_user_ids": []
    }
    
    await db.rooms.insert_one(room)
    room.pop("_id", None)
    return room

@api_router.get("/rooms", response_model=List[RoomResponse])
async def get_rooms():
    rooms = await db.rooms.find({"status": "waiting"}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return rooms

@api_router.post("/rooms/{room_id}/join")
async def join_room(room_id: str, user: dict = Depends(get_current_user)):
    room = await db.rooms.find_one({"id": room_id}, {"_id": 0})
    if not room:
        raise HTTPException(status_code=404, detail="Phòng không tồn tại")
    
    if room["status"] != "waiting":
        raise HTTPException(status_code=400, detail="Phòng đã bắt đầu hoặc đã kết thúc")
    
    if room["host_id"] == user["id"]:
        raise HTTPException(status_code=400, detail="Bạn không thể vào phòng của chính mình")
    
    # Update room
    await db.rooms.update_one(
        {"id": room_id},
        {"$set": {
            "guest_id": user["id"],
            "guest_username": user["username"],
            "guest_elo": user["elo"],
            "status": "playing"
        }}
    )
    
    # Create game
    game_id = str(uuid.uuid4())
    import random
    if random.random() < 0.5:
        red_player, black_player = room["host_id"], user["id"]
        red_username, black_username = room["host_username"], user["username"]
    else:
        red_player, black_player = user["id"], room["host_id"]
        red_username, black_username = user["username"], room["host_username"]
    
    game = {
        "id": game_id,
        "room_id": room_id,
        "red_player_id": red_player,
        "red_player_username": red_username,
        "black_player_id": black_player,
        "black_player_username": black_username,
        "board": create_initial_board(),
        "current_turn": "red",
        "red_time": room["time_control"],
        "black_time": room["time_control"],
        "moves": [],
        "status": "playing",
        "winner_id": None,
        "is_ranked": room["is_ranked"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "connected_user_ids": [],
        "connected_user_ids": []
    }
    
    await db.games.insert_one(game)
    game.pop("_id", None)
    
    return {"game_id": game_id, "room": room}

@api_router.delete("/rooms/{room_id}")
async def delete_room(room_id: str, user: dict = Depends(get_current_user)):
    room = await db.rooms.find_one({"id": room_id})
    if not room:
        raise HTTPException(status_code=404, detail="Phòng không tồn tại")
    
    if room["host_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xóa phòng này")
    
    await db.rooms.delete_one({"id": room_id})
    return {"message": "Đã xóa phòng"}

# Check if host's room has a game started (for auto-redirect)
@api_router.get("/rooms/my-active")
async def get_my_active_room(user: dict = Depends(get_current_user)):
    # Find a room where user is host and status is playing
    room = await db.rooms.find_one({
        "host_id": user["id"],
        "status": "playing"
    }, {"_id": 0})

    if not room:
        raise HTTPException(status_code=404, detail="Không có phòng đang hoạt động")

    # Always return the game_id if a game exists for the room
    game = await db.games.find_one({"room_id": room["id"]}, {"_id": 0})
    return {"room": room, "game_id": game["id"] if game else None}



# ==================== GAME ROUTES ====================

@api_router.get("/games/{game_id}")
async def get_game(game_id: str):
    game = await db.games.find_one({"id": game_id}, {"_id": 0})
    if not game:
        raise HTTPException(status_code=404, detail="Ván cờ không tồn tại")
    return game

@api_router.post("/games/{game_id}/move")
async def make_move(game_id: str, move: MoveRequest, user: dict = Depends(get_current_user)):
    game = await db.games.find_one({"id": game_id})
    if not game:
        raise HTTPException(status_code=404, detail="Ván cờ không tồn tại")
    
    if game["status"] != "playing":
        raise HTTPException(status_code=400, detail="Ván cờ đã kết thúc")
    
    # Check if it's the player's turn
    current_color = game["current_turn"]
    if current_color == "red" and game["red_player_id"] != user["id"]:
        raise HTTPException(status_code=400, detail="Không phải lượt của bạn")
    if current_color == "black" and game["black_player_id"] != user["id"]:
        raise HTTPException(status_code=400, detail="Không phải lượt của bạn")
    
    board = game["board"]
    from_pos = move.from_pos
    to_pos = move.to_pos
    
    # Validate move
    if not is_valid_move(board, from_pos, to_pos, current_color):
        raise HTTPException(status_code=400, detail="Nước đi không hợp lệ")
    
    # Make the move
    captured_piece = board[to_pos[0]][to_pos[1]]
    board[to_pos[0]][to_pos[1]] = board[from_pos[0]][from_pos[1]]
    board[from_pos[0]][from_pos[1]] = None
    
    # Check if move puts own king in check (illegal)
    if is_in_check(board, current_color):
        raise HTTPException(status_code=400, detail="Nước đi này để Tướng bị chiếu")
    
    # Record move
    move_record = {
        "from": from_pos,
        "to": to_pos,
        "piece": board[to_pos[0]][to_pos[1]],
        "captured": captured_piece,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    # Switch turn
    next_turn = "black" if current_color == "red" else "red"
    
    # Check for checkmate
    game_status = "playing"
    winner_id = None
    if is_checkmate(board, next_turn):
        game_status = f"finished"
        winner_id = user["id"]
    
    # Update game
    await db.games.update_one(
        {"id": game_id},
        {"$set": {
            "board": board,
            "current_turn": next_turn,
            "status": game_status,
            "winner_id": winner_id
        }, "$push": {"moves": move_record}}
    )
    
    # Update ELO if game ended
    if game_status != "playing" and game.get("is_ranked"):
        await update_elo_after_game(game, winner_id)
    
    # Broadcast update
    await manager.broadcast_to_game(game_id, {
        "type": "move",
        "move": move_record,
        "board": board,
        "current_turn": next_turn,
        "status": game_status,
        "winner_id": winner_id
    })

    # If game ended, mark room finished so host won't be auto-redirected forever
    if game_status != "playing":
        await db.rooms.update_one(
            {"id": game["room_id"]},
            {"$set": {"status": "finished"}}
        )
    
    return {
        "board": board,
        "current_turn": next_turn,
        "status": game_status,
        "move": move_record
    }

@api_router.post("/games/{game_id}/surrender")
async def surrender(game_id: str, user: dict = Depends(get_current_user)):
    game = await db.games.find_one({"id": game_id})
    if not game:
        raise HTTPException(status_code=404, detail="Ván cờ không tồn tại")
    
    if game["status"] != "playing":
        raise HTTPException(status_code=400, detail="Ván cờ đã kết thúc")
    
    # Determine winner
    if game["red_player_id"] == user["id"]:
        winner_id = game["black_player_id"]
        status = "black_won"
    elif game["black_player_id"] == user["id"]:
        winner_id = game["red_player_id"]
        status = "red_won"
    else:
        raise HTTPException(status_code=400, detail="Bạn không trong ván cờ này")
    
    await db.games.update_one(
        {"id": game_id},
        {"$set": {"status": status, "winner_id": winner_id}}
    )
    
    if game.get("is_ranked"):
        await update_elo_after_game(game, winner_id)
    
    await manager.broadcast_to_game(game_id, {
        "type": "game_end",
        "status": status,
        "winner_id": winner_id,
        "reason": "surrender"
    })

    if game.get("room_id"):
        await db.rooms.delete_one({"id": game["room_id"]})

    await db.rooms.update_one(
        {"id": game["room_id"]},
        {"$set": {"status": "finished"}}
    )


    
    return {"status": status, "winner_id": winner_id}

@api_router.post("/games/{game_id}/draw-request")
async def request_draw(game_id: str, user: dict = Depends(get_current_user)):
    game = await db.games.find_one({"id": game_id})
    if not game:
        raise HTTPException(status_code=404, detail="Ván cờ không tồn tại")
    
    await manager.broadcast_to_game(game_id, {
        "type": "draw_request",
        "from_user_id": user["id"],
        "from_username": user["username"]
    })

    await db.rooms.update_one(
        {"id": game["room_id"]},
        {"$set": {"status": "finished"}}
    )

    
    return {"message": "Đã gửi yêu cầu hòa"}

@api_router.post("/games/{game_id}/draw-accept")
async def accept_draw(game_id: str, user: dict = Depends(get_current_user)):
    game = await db.games.find_one({"id": game_id})
    if not game:
        raise HTTPException(status_code=404, detail="Ván cờ không tồn tại")
    
    await db.games.update_one(
        {"id": game_id},
        {"$set": {"status": "draw", "winner_id": None}}
    )
    
    # Update stats for draw
    await db.users.update_one({"id": game["red_player_id"]}, {"$inc": {"games_played": 1, "draws": 1}})
    await db.users.update_one({"id": game["black_player_id"]}, {"$inc": {"games_played": 1, "draws": 1}})
    
    await manager.broadcast_to_game(game_id, {
        "type": "game_end",
        "status": "draw",
        "winner_id": None,
        "reason": "agreement"
    })

    await db.rooms.update_one(
        {"id": game["room_id"]},
        {"$set": {"status": "finished"}}
    )

    
    return {"status": "draw"}

# ==================== AI GAME ROUTES ====================

@api_router.post("/games/ai/create")
async def create_ai_game(user: dict = Depends(get_current_user)):
    game_id = str(uuid.uuid4())
    import random
    player_color = "red" if random.random() < 0.5 else "black"
    
    game = {
        "id": game_id,
        "room_id": None,
        "red_player_id": user["id"] if player_color == "red" else "AI",
        "red_player_username": user["username"] if player_color == "red" else "Máy",
        "black_player_id": user["id"] if player_color == "black" else "AI",
        "black_player_username": user["username"] if player_color == "black" else "Máy",
        "board": create_initial_board(),
        "current_turn": "red",
        "red_time": 600,
        "black_time": 600,
        "moves": [],
        "status": "playing",
        "winner_id": None,
        "is_ai_game": True,
        "player_color": player_color,
        "is_ranked": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "connected_user_ids": [],
        "connected_user_ids": []
    }
    
    await db.games.insert_one(game)
    game.pop("_id", None)
    
    # If AI goes first (player is black), make AI move
    if player_color == "black":
        ai_move = ai_make_move(game["board"], "red")
        if ai_move:
            from_pos, to_pos = ai_move
            game["board"][to_pos[0]][to_pos[1]] = game["board"][from_pos[0]][from_pos[1]]
            game["board"][from_pos[0]][from_pos[1]] = None
            game["current_turn"] = "black"
            game["moves"].append({
                "from": from_pos,
                "to": to_pos,
                "piece": game["board"][to_pos[0]][to_pos[1]],
                "captured": None,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            await db.games.update_one({"id": game_id}, {"$set": {
                "board": game["board"],
                "current_turn": "black",
                "moves": game["moves"]
            }})
    
    return game

@api_router.post("/games/ai/{game_id}/move")
async def make_ai_game_move(game_id: str, move: MoveRequest, user: dict = Depends(get_current_user)):
    game = await db.games.find_one({"id": game_id})
    if not game:
        raise HTTPException(status_code=404, detail="Ván cờ không tồn tại")
    
    if not game.get("is_ai_game"):
        raise HTTPException(status_code=400, detail="Đây không phải ván cờ với máy")
    
    if game["status"] != "playing":
        raise HTTPException(status_code=400, detail="Ván cờ đã kết thúc")
    
    player_color = game["player_color"]
    if game["current_turn"] != player_color:
        raise HTTPException(status_code=400, detail="Không phải lượt của bạn")
    
    board = game["board"]
    from_pos = move.from_pos
    to_pos = move.to_pos
    
    if not is_valid_move(board, from_pos, to_pos, player_color):
        raise HTTPException(status_code=400, detail="Nước đi không hợp lệ")
    
    # Make player move
    captured = board[to_pos[0]][to_pos[1]]
    board[to_pos[0]][to_pos[1]] = board[from_pos[0]][from_pos[1]]
    board[from_pos[0]][from_pos[1]] = None
    
    if is_in_check(board, player_color):
        raise HTTPException(status_code=400, detail="Nước đi này để Tướng bị chiếu")
    
    moves = game["moves"]
    moves.append({
        "from": from_pos,
        "to": to_pos,
        "piece": board[to_pos[0]][to_pos[1]],
        "captured": captured,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    ai_color = "black" if player_color == "red" else "red"
    game_status = "playing"
    winner_id = None
    
    # Check if AI is checkmated
    if is_checkmate(board, ai_color):
        game_status = f"finished"
        winner_id = user["id"]
    else:
        # AI makes a move
        ai_move = ai_make_move(board, ai_color)
        if ai_move:
            ai_from, ai_to = ai_move
            ai_captured = board[ai_to[0]][ai_to[1]]
            board[ai_to[0]][ai_to[1]] = board[ai_from[0]][ai_from[1]]
            board[ai_from[0]][ai_from[1]] = None
            moves.append({
                "from": ai_from,
                "to": ai_to,
                "piece": board[ai_to[0]][ai_to[1]],
                "captured": ai_captured,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            
            # Check if player is checkmated after AI move
            if is_checkmate(board, player_color):
                game_status = f"finished"
                winner_id = "AI"
    
    if game_status != "playing":
        await db.rooms.update_one(
            {"id": game["room_id"]},
            {"$set": {"status": "finished"}}
        )
    
    return {
        "board": board,
        "current_turn": player_color,
        "status": game_status,
        "moves": moves[-2:] if len(moves) >= 2 else moves  # Return last 2 moves (player + AI)
    }

# ==================== LEADERBOARD ====================

@api_router.get("/leaderboard")
async def get_leaderboard(limit: int = 50):
    # Get all users sorted by ELO (not just those with games played)
    users = await db.users.find(
        {},
        {"_id": 0, "password": 0}
    ).sort("elo", -1).limit(limit).to_list(limit)
    
    return users

# ==================== ALL USERS (for search/challenge) ====================

@api_router.get("/users/search")
async def search_users(q: str = "", limit: int = 20):
    query = {}
    if q:
        query["username"] = {"$regex": q, "$options": "i"}
    
    users = await db.users.find(
        query,
        {"_id": 0, "password": 0}
    ).sort("elo", -1).limit(limit).to_list(limit)
    
    return users

# ==================== ONGOING GAMES ====================

@api_router.get("/games/ongoing")
async def get_ongoing_games(limit: int = 20):
    games = await db.games.find(
        {"status": "playing", "is_ai_game": {"$ne": True}},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return games

# ==================== FRIEND SYSTEM ====================

class FriendRequest(BaseModel):
    target_user_id: str

@api_router.post("/friends/request")
async def send_friend_request(data: FriendRequest, user: dict = Depends(get_current_user)):
    if data.target_user_id == user["id"]:
        raise HTTPException(status_code=400, detail="Không thể kết bạn với chính mình")
    
    # Check if already friends
    existing = await db.friends.find_one({
        "$or": [
            {"user_id": user["id"], "friend_id": data.target_user_id},
            {"user_id": data.target_user_id, "friend_id": user["id"]}
        ]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Đã là bạn bè hoặc đang chờ xác nhận")
    
    # Check if request already exists
    existing_request = await db.friend_requests.find_one({
        "from_user_id": user["id"],
        "to_user_id": data.target_user_id,
        "status": "pending"
    })
    if existing_request:
        raise HTTPException(status_code=400, detail="Đã gửi lời mời kết bạn")
    
    request = {
        "id": str(uuid.uuid4()),
        "from_user_id": user["id"],
        "from_username": user["username"],
        "to_user_id": data.target_user_id,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "connected_user_ids": [],
        "connected_user_ids": []
    }
    
    await db.friend_requests.insert_one(request)
    return {"message": "Đã gửi lời mời kết bạn", "request_id": request["id"]}

@api_router.get("/friends/requests")
async def get_friend_requests(user: dict = Depends(get_current_user)):
    requests = await db.friend_requests.find(
        {"to_user_id": user["id"], "status": "pending"},
        {"_id": 0}
    ).to_list(50)
    
    return requests

@api_router.post("/friends/accept/{request_id}")
async def accept_friend_request(request_id: str, user: dict = Depends(get_current_user)):
    request = await db.friend_requests.find_one({"id": request_id, "to_user_id": user["id"]})
    if not request:
        raise HTTPException(status_code=404, detail="Không tìm thấy lời mời")
    
    # Create friendship
    friendship = {
        "id": str(uuid.uuid4()),
        "user_id": request["from_user_id"],
        "friend_id": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "connected_user_ids": [],
        "connected_user_ids": []
    }
    await db.friends.insert_one(friendship)
    
    # Update request status
    await db.friend_requests.update_one({"id": request_id}, {"$set": {"status": "accepted"}})
    
    return {"message": "Đã chấp nhận lời mời kết bạn"}

@api_router.post("/friends/decline/{request_id}")
async def decline_friend_request(request_id: str, user: dict = Depends(get_current_user)):
    await db.friend_requests.update_one(
        {"id": request_id, "to_user_id": user["id"]},
        {"$set": {"status": "declined"}}
    )
    return {"message": "Đã từ chối lời mời kết bạn"}

@api_router.get("/friends")
async def get_friends(user: dict = Depends(get_current_user)):
    friendships = await db.friends.find({
        "$or": [{"user_id": user["id"]}, {"friend_id": user["id"]}]
    }, {"_id": 0}).to_list(100)
    
    friend_ids = []
    for f in friendships:
        if f["user_id"] == user["id"]:
            friend_ids.append(f["friend_id"])
        else:
            friend_ids.append(f["user_id"])
    
    if not friend_ids:
        return []
    
    friends = await db.users.find(
        {"id": {"$in": friend_ids}},
        {"_id": 0, "password": 0}
    ).to_list(100)
    
    return friends

@api_router.delete("/friends/{friend_id}")
async def remove_friend(friend_id: str, user: dict = Depends(get_current_user)):
    await db.friends.delete_one({
        "$or": [
            {"user_id": user["id"], "friend_id": friend_id},
            {"user_id": friend_id, "friend_id": user["id"]}
        ]
    })
    return {"message": "Đã hủy kết bạn"}

# ==================== GAME HISTORY ====================

@api_router.get("/users/{user_id}/games")
async def get_user_games(user_id: str, limit: int = 20):
    games = await db.games.find(
        {"$or": [{"red_player_id": user_id}, {"black_player_id": user_id}]},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return games

# ==================== SHOP ROUTES ====================

@api_router.get("/shop/packages")
async def get_shop_packages():
    return SHOP_PACKAGES

@api_router.post("/shop/checkout")
async def create_checkout(data: CheckoutRequest, user: dict = Depends(get_current_user)):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
    
    # Find package
    package = next((p for p in SHOP_PACKAGES if p["id"] == data.package_id), None)
    if not package:
        raise HTTPException(status_code=404, detail="Gói không tồn tại")
    
    # Create checkout session
    webhook_url = f"{data.origin_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    success_url = f"{data.origin_url}/shop/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{data.origin_url}/shop"
    
    checkout_request = CheckoutSessionRequest(
        amount=package["price"],
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user["id"],
            "package_id": package["id"],
            "coins": str(package["coins"])
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create transaction record
    transaction = {
        "id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "user_id": user["id"],
        "package_id": package["id"],
        "amount": package["price"],
        "currency": "usd",
        "coins": package["coins"],
        "status": "pending",
        "payment_status": "initiated",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "connected_user_ids": [],
        "connected_user_ids": []
    }
    await db.payment_transactions.insert_one(transaction)
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/shop/checkout/status/{session_id}")
async def get_checkout_status(session_id: str, user: dict = Depends(get_current_user)):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction if paid
    if status.payment_status == "paid":
        transaction = await db.payment_transactions.find_one({"session_id": session_id})
        if transaction and transaction["payment_status"] != "paid":
            # Update transaction
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"status": "complete", "payment_status": "paid"}}
            )
            # Add coins to user
            await db.users.update_one(
                {"id": transaction["user_id"]},
                {"$inc": {"coins": transaction["coins"]}}
            )
    
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
    
    try:
        event = await stripe_checkout.handle_webhook(body, signature)
        
        if event.payment_status == "paid":
            transaction = await db.payment_transactions.find_one({"session_id": event.session_id})
            if transaction and transaction["payment_status"] != "paid":
                await db.payment_transactions.update_one(
                    {"session_id": event.session_id},
                    {"$set": {"status": "complete", "payment_status": "paid"}}
                )
                await db.users.update_one(
                    {"id": transaction["user_id"]},
                    {"$inc": {"coins": transaction["coins"]}}
                )
        
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error"}

# ==================== ELO HELPERS ====================

async def update_elo_after_game(game: dict, winner_id: str):
    K = 32  # ELO K-factor
    
    red_user = await db.users.find_one({"id": game["red_player_id"]})
    black_user = await db.users.find_one({"id": game["black_player_id"]})
    
    if not red_user or not black_user:
        return
    
    red_elo = red_user["elo"]
    black_elo = black_user["elo"]
    
    # Expected scores
    expected_red = 1 / (1 + 10 ** ((black_elo - red_elo) / 400))
    expected_black = 1 - expected_red
    
    # Actual scores
    if winner_id == game["red_player_id"]:
        actual_red, actual_black = 1, 0
        red_result, black_result = "wins", "losses"
    elif winner_id == game["black_player_id"]:
        actual_red, actual_black = 0, 1
        red_result, black_result = "losses", "wins"
    else:
        actual_red, actual_black = 0.5, 0.5
        red_result, black_result = "draws", "draws"
    
    # New ELO
    new_red_elo = round(red_elo + K * (actual_red - expected_red))
    new_black_elo = round(black_elo + K * (actual_black - expected_black))
    
    await db.users.update_one(
        {"id": game["red_player_id"]},
        {"$set": {"elo": new_red_elo}, "$inc": {"games_played": 1, red_result: 1}}
    )
    await db.users.update_one(
        {"id": game["black_player_id"]},
        {"$set": {"elo": new_black_elo}, "$inc": {"games_played": 1, black_result: 1}}
    )

# ==================== CHAT ROUTES ====================

@api_router.get("/games/{game_id}/chat")
async def get_chat_messages(game_id: str):
    messages = await db.chat_messages.find(
        {"game_id": game_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    return messages

@api_router.post("/games/{game_id}/chat")
async def send_chat_message(game_id: str, data: ChatMessage, user: dict = Depends(get_current_user)):
    message = {
        "id": str(uuid.uuid4()),
        "game_id": game_id,
        "user_id": user["id"],
        "username": user["username"],
        "message": data.message,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "connected_user_ids": [],
        "connected_user_ids": []
    }
    
    await db.chat_messages.insert_one(message)
    message.pop("_id", None)
    
    await manager.broadcast_to_game(game_id, {
        "type": "chat",
        "message": message
    })
    
    return message

# ==================== WEBSOCKET ====================

@app.websocket("/ws/{game_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, game_id: str, user_id: str):
    await manager.connect(websocket, game_id, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle ping/pong
            if data == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        manager.disconnect(game_id, user_id)

# ==================== HEALTH CHECK ====================

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include router and middleware
app.include_router(api_router)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
