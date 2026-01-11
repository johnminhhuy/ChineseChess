# Cờ Tướng Online - Product Requirements Document

## Overview
Chinese Chess (Xiangqi/Cờ Tướng) online multiplayer game with Vietnamese interface and traditional Chinese Imperial aesthetic.

## Updates (2026-01-10 - Iteration 2)
### New Features Added:
- [x] Beautiful background graphics (Great Wall of China)
- [x] Guest play mode without login
- [x] Back button on Login/Register pages
- [x] Fixed font (Noto Serif SC, Noto Sans SC, Ma Shan Zheng)
- [x] Improved chessboard with proper lines, palace diagonals, river text
- [x] Language toggle (Vietnamese/English)
- [x] Tournament page with mock tournaments
- [x] Profile customization (avatar, age, gender)
- [x] Challenge player feature in lobby
- [x] Ad banners for sponsors
- [x] AI difficulty levels (Easy/Medium/Hard)
- [x] Increased font sizes for readability
- [x] Removed meaningless chess pieces from landing page

## User Personas
1. **Casual Players** - Want quick games against AI or friends
2. **Competitive Players** - Want ranked matches with ELO rating
3. **Learners** - Use AI to practice and improve

## Core Requirements (Static)
- User authentication (JWT)
- Real-time multiplayer via WebSocket
- AI opponent (minimax algorithm)
- Game lobby/rooms system
- ELO rating system
- In-game chat
- Game history
- Shop with Stripe payment

## What's Been Implemented (2026-01-10)
### Backend (FastAPI + MongoDB)
- [x] User auth (register/login/profile) with JWT
- [x] Room management (create/list/join/delete)
- [x] Game logic with full Xiangqi rules
- [x] Valid move validation for all 7 piece types
- [x] AI opponent with minimax algorithm
- [x] WebSocket for real-time updates
- [x] Chat system for games
- [x] ELO calculation after games
- [x] Shop with 4 coin packages
- [x] Stripe checkout integration
- [x] Leaderboard API
- [x] Game history API

### Frontend (React + Shadcn UI)
- [x] Landing page with Imperial theme
- [x] Login/Register pages
- [x] Lobby with room list and create room dialog
- [x] Game page with chessboard, chat, timers
- [x] AI game page
- [x] Profile page with stats and game history
- [x] Leaderboard page
- [x] Shop page with coin packages
- [x] Shop success/payment confirmation page

### Design
- [x] Imperial Chinese theme (dark brown, gold, red)
- [x] Wood texture board
- [x] Chinese characters for pieces (Ma Shan Zheng font)
- [x] Traditional color scheme (red vs black pieces)

## Prioritized Backlog
### P0 (Critical) - DONE
- User auth ✅
- AI game ✅
- Multiplayer game ✅
- Valid move validation ✅

### P1 (High)
- [ ] Time control countdown (currently shows time but doesn't decrement)
- [ ] Improved AI difficulty levels
- [ ] Game replay/analysis feature

### P2 (Medium)
- [ ] Tournament system
- [ ] Friend system
- [ ] Spectator mode
- [ ] Sound effects

### P3 (Low)
- [ ] Custom avatars
- [ ] Themes/skins for board
- [ ] Mobile responsiveness improvements

## Tech Stack
- Backend: FastAPI, MongoDB, WebSocket
- Frontend: React, Tailwind CSS, Shadcn UI
- Payment: Stripe (via emergentintegrations)
- Auth: JWT with bcrypt

## API Endpoints
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/profile
- GET /api/rooms
- POST /api/rooms
- POST /api/rooms/{id}/join
- GET /api/games/{id}
- POST /api/games/{id}/move
- POST /api/games/{id}/surrender
- POST /api/games/{id}/draw-request
- POST /api/games/{id}/draw-accept
- POST /api/games/ai/create
- POST /api/games/ai/{id}/move
- GET /api/leaderboard
- GET /api/shop/packages
- POST /api/shop/checkout
- GET /api/shop/checkout/status/{id}
