import React from 'react';
import { Message } from '../../types';
import { Bot, User, Check, CheckCheck } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isOutbound = message.direction === 'outbound';
  const isBot = message.sender_type === 'bot';
  const isAgent = message.sender_type === 'agent';

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex w-full my-1.5 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`relative max-w-[85%] md:max-w-[70%] rounded-lg px-3 py-2 text-sm shadow-sm transition-all ${
          !isOutbound
            ? 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
            : isBot
            ? 'bg-sky-50 text-gray-900 rounded-tr-none border border-sky-100'
            : 'bg-[#d9fdd3] text-gray-900 rounded-tr-none border border-emerald-100'
        }`}
      >
        {/* Header Tag for Bot / Agent Outbound */}
        {isOutbound && (
          <div className="flex items-center space-x-1 mb-1 pb-1 border-b border-black/5 text-[11px] font-semibold">
            {isBot ? (
              <span className="flex items-center space-x-1 text-sky-700">
                <Bot className="w-3.5 h-3.5" />
                <span>AGUAONE Bot Automation</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-emerald-800">
                <User className="w-3.5 h-3.5" />
                <span>Human Agent (Live Takeover)</span>
              </span>
            )}
          </div>
        )}

        {/* Message Body Content */}
        <div className="whitespace-pre-wrap leading-relaxed break-words text-[13.5px]">
          {message.content}
        </div>

        {/* Selected Option badge if interactive reply */}
        {message.selected_title && (
          <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
            Selected: <span className="font-semibold ml-1">{message.selected_title}</span>
          </div>
        )}

        {/* Timestamp and Delivery Status */}
        <div className="flex items-center justify-end space-x-1 mt-1 text-[10px] text-gray-400">
          <span>{formatTime(message.timestamp)}</span>
          {isOutbound && (
            <span>
              {message.status === 'read' ? (
                <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
              ) : message.status === 'delivered' ? (
                <CheckCheck className="w-3.5 h-3.5 text-gray-400" />
              ) : (
                <Check className="w-3.5 h-3.5 text-gray-400" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
