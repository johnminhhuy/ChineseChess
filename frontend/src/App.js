import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";
import AIGame from "./pages/AIGame";
import GuestAIGame from "./pages/GuestAIGame";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import Shop from "./pages/Shop";
import ShopSuccess from "./pages/ShopSuccess";
import Tournament from "./pages/Tournament";
import WatchGame from "./pages/WatchGame";
import "./App.css";

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <div className="App min-h-screen bg-[#1a1614]">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/lobby" element={<Lobby />} />
              <Route path="/game/:gameId" element={<Game />} />
              <Route path="/ai-game" element={<AIGame />} />
              <Route path="/guest-game" element={<GuestAIGame />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/shop/success" element={<ShopSuccess />} />
              <Route path="/tournament" element={<Tournament />} />
              <Route path="/watch/:gameId" element={<WatchGame />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </BrowserRouter>
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: '#241e1b',
                border: '1px solid #4a3b32',
                color: '#e6dcc3',
                fontSize: '16px',
              },
            }}
          />
        </div>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
