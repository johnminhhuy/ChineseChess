import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

const translations = {
  vi: {
    // Navbar
    playNow: 'Chơi Ngay',
    leaderboard: 'Xếp Hạng',
    shop: 'Cửa Hàng',
    tournament: 'Giải Đấu',
    login: 'Đăng Nhập',
    register: 'Đăng Ký',
    logout: 'Đăng Xuất',
    profile: 'Hồ Sơ',
    
    // Landing
    heroTitle: 'THIÊN HẠ ĐỔ KỲ',
    heroSubtitle: 'SO TÀI CỜ TƯỚNG ĐỈNH CAO!',
    heroDesc: 'Tham gia cộng đồng kỳ thủ hàng đầu Việt Nam. Đấu trí, nâng cao ELO và trở thành Kỳ Vương!',
    playNowBtn: 'CHƠI NGAY',
    registerBtn: 'ĐĂNG KÝ NGAY',
    playAsGuest: 'Chơi không cần đăng nhập',
    onlinePlayers: 'Kỳ Thủ Trực Tuyến',
    vsPlayer: 'Đấu Người',
    vsPlayerDesc: 'Thách đấu với kỳ thủ khắp nơi',
    vsAI: 'Đấu Máy',
    vsAIDesc: 'Luyện tập với AI thông minh',
    topPlayers: 'BẢNG XẾP HẠNG CAO THỦ',
    viewAll: 'Xem tất cả',
    noRankData: 'Chưa có dữ liệu xếp hạng',
    
    // Auth
    welcomeBack: 'Chào mừng trở lại, Kỳ Thủ!',
    joinCommunity: 'Tham gia cộng đồng Kỳ Thủ ngay hôm nay!',
    email: 'Email',
    password: 'Mật khẩu',
    confirmPassword: 'Xác nhận mật khẩu',
    displayName: 'Tên hiển thị',
    noAccount: 'Chưa có tài khoản?',
    hasAccount: 'Đã có tài khoản?',
    loginNow: 'Đăng nhập',
    registerNow: 'Đăng ký ngay',
    back: 'Quay lại',
    
    // Lobby
    lobby: 'Sảnh Chờ',
    lobbyDesc: 'Chọn phòng hoặc tạo ván đấu mới',
    createRoom: 'Tạo Phòng',
    refresh: 'Làm mới',
    roomName: 'Tên phòng',
    timeControl: 'Thời gian',
    rankedGame: 'Ván xếp hạng (tính ELO)',
    noRooms: 'Chưa có phòng nào',
    beFirst: 'Hãy là người đầu tiên tạo phòng!',
    createFirstRoom: 'Tạo Phòng Đầu Tiên',
    joinRoom: 'Vào Phòng',
    yourRoom: 'Phòng của bạn',
    minutes: 'phút',
    ranked: 'Xếp hạng',
    
    // Game
    backToLobby: 'Quay lại sảnh',
    surrender: 'Đầu Hàng',
    offerDraw: 'Cầu Hòa',
    yourTurn: 'Lượt của bạn',
    waitOpponent: 'Đợi đối thủ...',
    chat: 'Trò Chuyện',
    noMessages: 'Chưa có tin nhắn nào',
    typeMessage: 'Nhập nội dung...',
    
    // AI Game
    aiChess: 'AI Cờ Tướng',
    aiThinking: 'Đang suy nghĩ...',
    aiTurn: 'Lượt của AI',
    waitYou: 'Chờ bạn đi',
    newGame: 'Ván Mới',
    moveHistory: 'Lịch Sử Nước Đi',
    aiDifficulty: 'Độ khó AI',
    easy: 'Dễ',
    medium: 'Trung bình',
    hard: 'Khó',
    
    // Profile
    editProfile: 'Chỉnh sửa hồ sơ',
    games: 'Ván đấu',
    wins: 'Thắng',
    losses: 'Thua',
    draws: 'Hòa',
    winRate: 'Tỉ lệ thắng',
    coins: 'Xu vàng',
    addCoins: 'Nạp thêm',
    gameHistory: 'Lịch Sử Đấu',
    noGames: 'Bạn chưa có ván đấu nào',
    startPlaying: 'Bắt đầu đấu ngay',
    won: 'Thắng',
    lost: 'Thua',
    draw: 'Hòa',
    red: 'Đỏ',
    black: 'Đen',
    age: 'Tuổi',
    gender: 'Giới tính',
    male: 'Nam',
    female: 'Nữ',
    other: 'Khác',
    saveProfile: 'Lưu hồ sơ',
    uploadAvatar: 'Tải ảnh lên',
    
    // Leaderboard
    leaderboardTitle: 'BẢNG XẾP HẠNG',
    topPlayersDesc: 'Những kỳ thủ xuất sắc nhất',
    allPlayers: 'Tất Cả Kỳ Thủ',
    noPlayersYet: 'Chưa có kỳ thủ nào trong bảng xếp hạng',
    
    // Shop
    shopTitle: 'CỬA HÀNG',
    shopDesc: 'Nạp xu vàng để sử dụng các tính năng cao cấp',
    balance: 'Số dư',
    buyNow: 'MUA NGAY',
    mostPopular: 'PHỔ BIẾN NHẤT',
    whatCoinsFor: 'Xu Vàng Dùng Để Làm Gì?',
    unlockAvatars: 'Mở khóa avatar cao cấp',
    joinTournaments: 'Tham gia giải đấu đặc biệt',
    advancedAnalysis: 'Phân tích ván cờ nâng cao',
    supportDev: 'Hỗ trợ phát triển game',
    paymentSecure: 'Thanh toán an toàn qua Stripe',
    
    // Tournament
    tournamentTitle: 'GIẢI ĐẤU',
    tournamentDesc: 'Tham gia các giải đấu để giành giải thưởng',
    upcomingTournaments: 'Giải đấu sắp tới',
    ongoingTournaments: 'Đang diễn ra',
    prize: 'Giải thưởng',
    participants: 'Người tham gia',
    startTime: 'Bắt đầu',
    joinTournament: 'Tham gia',
    entryFee: 'Phí vào',
    free: 'Miễn phí',
    
    // Challenge
    challenge: 'Thách Đấu',
    challengePlayer: 'Thách đấu người chơi',
    searchPlayer: 'Tìm kiếm người chơi...',
    sendChallenge: 'Gửi thách đấu',
    challengeSent: 'Đã gửi thách đấu!',
    challengeReceived: 'Bạn nhận được thách đấu',
    acceptChallenge: 'Chấp nhận',
    declineChallenge: 'Từ chối',
    
    // Game End
    victory: 'Chiến Thắng!',
    defeat: 'Thất Bại',
    drawGame: 'Hòa Cờ',
    congratsWin: 'Chúc mừng bạn đã chiến thắng!',
    youLost: 'Bạn đã thua ván này.',
    gameDrawn: 'Ván cờ kết thúc với kết quả hòa.',
    opponentSurrendered: 'Đối thủ đầu hàng',
    reviewGame: 'Xem Lại',
    
    // Misc
    loading: 'Đang tải...',
    error: 'Có lỗi xảy ra',
    success: 'Thành công',
    cancel: 'Hủy',
    confirm: 'Xác nhận',
    save: 'Lưu',
    close: 'Đóng',
    
    // River text
    riverText: '楚河 漢界'
  },
  en: {
    // Navbar
    playNow: 'Play Now',
    leaderboard: 'Leaderboard',
    shop: 'Shop',
    tournament: 'Tournament',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    profile: 'Profile',
    
    // Landing
    heroTitle: 'MASTER OF XIANGQI',
    heroSubtitle: 'COMPETE IN CHINESE CHESS!',
    heroDesc: 'Join the top chess community. Battle, improve your ELO and become the Chess King!',
    playNowBtn: 'PLAY NOW',
    registerBtn: 'REGISTER NOW',
    playAsGuest: 'Play without account',
    onlinePlayers: 'Players Online',
    vsPlayer: 'VS Player',
    vsPlayerDesc: 'Challenge players worldwide',
    vsAI: 'VS AI',
    vsAIDesc: 'Practice with smart AI',
    topPlayers: 'TOP PLAYERS RANKING',
    viewAll: 'View all',
    noRankData: 'No ranking data yet',
    
    // Auth
    welcomeBack: 'Welcome back, Master!',
    joinCommunity: 'Join the Chess Master community today!',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    displayName: 'Display Name',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    loginNow: 'Login',
    registerNow: 'Register now',
    back: 'Back',
    
    // Lobby
    lobby: 'Lobby',
    lobbyDesc: 'Choose a room or create a new game',
    createRoom: 'Create Room',
    refresh: 'Refresh',
    roomName: 'Room name',
    timeControl: 'Time control',
    rankedGame: 'Ranked game (affects ELO)',
    noRooms: 'No rooms available',
    beFirst: 'Be the first to create a room!',
    createFirstRoom: 'Create First Room',
    joinRoom: 'Join Room',
    yourRoom: 'Your room',
    minutes: 'min',
    ranked: 'Ranked',
    
    // Game
    backToLobby: 'Back to lobby',
    surrender: 'Surrender',
    offerDraw: 'Offer Draw',
    yourTurn: 'Your turn',
    waitOpponent: 'Waiting for opponent...',
    chat: 'Chat',
    noMessages: 'No messages yet',
    typeMessage: 'Type a message...',
    
    // AI Game
    aiChess: 'AI Chess',
    aiThinking: 'Thinking...',
    aiTurn: "AI's turn",
    waitYou: 'Your move',
    newGame: 'New Game',
    moveHistory: 'Move History',
    aiDifficulty: 'AI Difficulty',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    
    // Profile
    editProfile: 'Edit Profile',
    games: 'Games',
    wins: 'Wins',
    losses: 'Losses',
    draws: 'Draws',
    winRate: 'Win Rate',
    coins: 'Coins',
    addCoins: 'Add more',
    gameHistory: 'Game History',
    noGames: "You haven't played any games",
    startPlaying: 'Start playing now',
    won: 'Won',
    lost: 'Lost',
    draw: 'Draw',
    red: 'Red',
    black: 'Black',
    age: 'Age',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    saveProfile: 'Save Profile',
    uploadAvatar: 'Upload Avatar',
    
    // Leaderboard
    leaderboardTitle: 'LEADERBOARD',
    topPlayersDesc: 'The best players',
    allPlayers: 'All Players',
    noPlayersYet: 'No players in the leaderboard yet',
    
    // Shop
    shopTitle: 'SHOP',
    shopDesc: 'Buy coins to use premium features',
    balance: 'Balance',
    buyNow: 'BUY NOW',
    mostPopular: 'MOST POPULAR',
    whatCoinsFor: 'What are Coins for?',
    unlockAvatars: 'Unlock premium avatars',
    joinTournaments: 'Join special tournaments',
    advancedAnalysis: 'Advanced game analysis',
    supportDev: 'Support game development',
    paymentSecure: 'Secure payment via Stripe',
    
    // Tournament
    tournamentTitle: 'TOURNAMENTS',
    tournamentDesc: 'Join tournaments to win prizes',
    upcomingTournaments: 'Upcoming Tournaments',
    ongoingTournaments: 'Ongoing',
    prize: 'Prize',
    participants: 'Participants',
    startTime: 'Start Time',
    joinTournament: 'Join',
    entryFee: 'Entry Fee',
    free: 'Free',
    
    // Challenge
    challenge: 'Challenge',
    challengePlayer: 'Challenge a player',
    searchPlayer: 'Search for player...',
    sendChallenge: 'Send Challenge',
    challengeSent: 'Challenge sent!',
    challengeReceived: 'You received a challenge',
    acceptChallenge: 'Accept',
    declineChallenge: 'Decline',
    
    // Game End
    victory: 'Victory!',
    defeat: 'Defeat',
    drawGame: 'Draw',
    congratsWin: 'Congratulations on your victory!',
    youLost: 'You lost this game.',
    gameDrawn: 'The game ended in a draw.',
    opponentSurrendered: 'Opponent surrendered',
    reviewGame: 'Review',
    
    // Misc
    loading: 'Loading...',
    error: 'An error occurred',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    close: 'Close',
    
    // River text
    riverText: '楚河 漢界'
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'vi';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key) => {
    return translations[language][key] || key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'vi' ? 'en' : 'vi');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
