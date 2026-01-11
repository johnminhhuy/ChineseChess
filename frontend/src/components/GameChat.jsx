import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';

export default function GameChat({ messages, onSendMessage, currentUserId }) {
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    onSendMessage(newMessage.trim());
    setNewMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#241e1b] rounded-lg border border-[#4a3b32]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#4a3b32]">
        <h3 className="font-serif text-lg text-[#d4af37]">Trò Chuyện</h3>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-3">
          {messages.map((msg, idx) => (
            <div 
              key={msg.id || idx}
              className={`${msg.user_id === currentUserId ? 'text-right' : ''}`}
            >
              <div 
                className={`inline-block max-w-[80%] px-3 py-2 rounded-lg ${
                  msg.user_id === currentUserId 
                    ? 'bg-[#c92a2a]/30 text-[#e6dcc3]' 
                    : 'bg-[#3a2e2a] text-[#e6dcc3]'
                }`}
              >
                <span className="text-xs text-[#d4af37] font-medium block mb-1">
                  {msg.username}
                </span>
                <span className="text-sm">{msg.message}</span>
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <p className="text-center text-[#a89f91] text-sm">
              Chưa có tin nhắn nào
            </p>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-[#4a3b32]">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập nội dung..."
            className="flex-1 bg-[#1a1614] border-[#4a3b32] text-[#e6dcc3] placeholder:text-[#5c4d45]"
            data-testid="chat-input"
          />
          <Button
            onClick={handleSend}
            size="icon"
            className="bg-[#d4af37] hover:bg-[#b4941f] text-[#1a1614]"
            data-testid="chat-send-btn"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
