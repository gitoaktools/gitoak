import { useState, useEffect } from 'react';
import { Search, File, Folder } from 'lucide-react';

interface ChatWindowProps {
  repoOwner: string;
  repoName: string;
  defaultBranch: string;
}

export function ChatWindow({ repoOwner, repoName, defaultBranch }: ChatWindow) {
 
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ text: string; isUser: boolean }>>([{text:'Hello, I am a AI assistant for GitHub, how can I help you today?',isUser:false}]);
 


  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    // Add user message to chat history
    setChatHistory(prev => [...prev, { text: message, isUser: true }]);
    setMessage('');
    
    // TODO: Add AI response handling here
  };

  return (
    <div className="p-2 flex flex-col h-[85vh]">
      <div className="flex-1 overflow-auto mb-4">
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={`mb-2 p-2 rounded-lg ${
              msg.isUser
                ? 'bg-blue-100 dark:bg-blue-900 ml-auto'
                : 'bg-gray-100 dark:bg-gray-800 mr-auto'
            } max-w-[80%]`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div className="relative">
        <div className="flex items-center gap-2 px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className="w-full bg-transparent border-none outline-none text-sm"
          />
          <button
            onClick={handleSendMessage}
            className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
            disabled
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
} 