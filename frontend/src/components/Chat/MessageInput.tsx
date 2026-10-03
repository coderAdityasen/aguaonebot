import React, { useState, useRef } from 'react';
import { Send, Zap } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (text: string) => Promise<void>;
  disabled: boolean;
  botActive: boolean;
}

const QUICK_REPLIES = [
  'नमस्ते! मैं AGUAONE टीम से बात कर रहा हूँ।',
  'क्या हम थोड़ी देर में कॉल पर बात कर सकते हैं?',
  'हमारा डीलरशिप कैटलॉग और प्राइस लिस्ट जल्द भेज रहे हैं।',
  'धन्यवाद! हमारी सेल्स टीम आपसे संपर्क करेगी।'
];

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled,
  botActive
}) => {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (!text.trim() || isSending) return;
    setIsSending(true);
    try {
      await onSendMessage(text.trim());
      setText('');
      inputRef.current?.focus();
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickReply = (reply: string) => {
    setText(reply);
    inputRef.current?.focus();
  };

  return (
    <div className="bg-[#f0f2f5] p-2.5 border-t border-gray-200 shrink-0">
      {/* Quick Reply Chips */}
      <div className="flex items-center space-x-1.5 mb-2 overflow-x-auto scrollbar-none py-0.5">
        <span className="text-[11px] font-semibold text-gray-400 flex items-center shrink-0">
          <Zap className="w-3 h-3 mr-0.5 text-amber-500" />
          Quick:
        </span>
        {QUICK_REPLIES.map((reply, i) => (
          <button
            key={i}
            onClick={() => handleQuickReply(reply)}
            className="px-2.5 py-1 text-xs bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-gray-200 rounded-full shrink-0 shadow-2xs transition-colors truncate max-w-[220px]"
          >
            {reply}
          </button>
        ))}
      </div>

      {/* Input Row */}
      <div className="flex items-center space-x-2">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isSending}
          placeholder={
            botActive
              ? "Type to send as agent (pauses bot)..."
              : "Type a WhatsApp reply..."
          }
          className="flex-1 bg-white text-gray-800 text-sm rounded-lg px-3.5 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:ring-1 focus:ring-wa-teal border border-gray-200 transition-all placeholder:text-gray-400 min-w-0"
        />

        <button
          onClick={handleSend}
          disabled={!text.trim() || disabled || isSending}
          className={`p-2.5 rounded-full transition-all shadow-sm flex items-center justify-center shrink-0 min-w-[40px] min-h-[40px] ${
            text.trim() && !disabled && !isSending
              ? 'bg-wa-teal text-white hover:bg-wa-teal-dark active:scale-95'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          title="Send WhatsApp message"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {botActive && (
        <p className="text-[11px] text-amber-700 mt-1 pl-1">
          💡 Note: Sending a message will automatically switch this conversation to Human Agent Mode.
        </p>
      )}
    </div>
  );
};
