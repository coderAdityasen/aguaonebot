import React, { useEffect, useRef, useMemo, useState } from 'react';
import { Contact, Message } from '../../types';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Bot, User, Phone, PanelRight, ArrowLeft, Clock, AlertTriangle, Pencil, Check, X } from 'lucide-react';

interface ChatWindowProps {
  contact: Contact | null;
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string) => void | Promise<void>;
  onSendMedia?: (file: File, caption?: string) => void | Promise<void>;
  onToggleBot: (active: boolean) => Promise<void>;
  onToggleLeadPanel: () => void;
  showLeadPanel: boolean;
  onBackMobile?: () => void;
  onUpdateName?: (name: string) => Promise<void>;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  contact,
  messages,
  isLoading,
  onSendMessage,
  onSendMedia,
  onToggleBot,
  onToggleLeadPanel,
  showLeadPanel,
  onBackMobile,
  onUpdateName
}) => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  useEffect(() => {
    setIsEditingName(false);
    setEditedName(contact?.name && contact.name !== 'Customer' ? contact.name : '');
  }, [contact?.phone]);

  const handleStartEditName = () => {
    setEditedName(contact?.name && contact.name !== 'Customer' ? contact.name : '');
    setIsEditingName(true);
    setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }, 50);
  };

  const handleSaveName = async () => {
    const trimmed = editedName.trim();
    if (!trimmed || !onUpdateName) {
      setIsEditingName(false);
      return;
    }
    if (trimmed === contact?.name) {
      setIsEditingName(false);
      return;
    }
    try {
      setIsSavingName(true);
      await onUpdateName(trimmed);
      setIsEditingName(false);
    } catch (err) {
      console.error('Failed to rename contact:', err);
    } finally {
      setIsSavingName(false);
    }
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Instant scroll to the bottom whenever opening a chat or changing contact
  useEffect(() => {
    if (!isLoading && contact) {
      scrollToBottom('auto');
      // Re-scroll after layout paint for media bubbles
      const timer = setTimeout(() => {
        scrollToBottom('auto');
      }, 70);
      return () => clearTimeout(timer);
    }
  }, [contact?.phone, isLoading]);

  // Smooth scroll down when new messages are received or sent
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      scrollToBottom('smooth');
    }
  }, [messages.length]);

  // WhatsApp Cloud API 24-Hour Customer Care Window Calculation
  const lastInboundMsg = useMemo(() => {
    return [...messages].reverse().find(m => m.direction === 'inbound');
  }, [messages]);

  const { isWindowOpen, windowRemainingText, expiredAgoText } = useMemo(() => {
    if (!lastInboundMsg?.timestamp) {
      return {
        isWindowOpen: false,
        windowRemainingText: null,
        expiredAgoText: 'No inbound customer message received yet'
      };
    }

    const lastTime = new Date(lastInboundMsg.timestamp).getTime();
    const now = Date.now();
    const diffMs = (24 * 60 * 60 * 1000) - (now - lastTime);

    if (diffMs > 0) {
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return {
        isWindowOpen: true,
        windowRemainingText: `${hours}h ${mins}m left`,
        expiredAgoText: null
      };
    } else {
      const pastMs = now - (lastTime + 24 * 60 * 60 * 1000);
      const hoursPast = Math.floor(pastMs / (1000 * 60 * 60));
      const minsPast = Math.floor((pastMs % (1000 * 60 * 60)) / (1000 * 60));
      const timeStr = hoursPast > 0 ? `${hoursPast}h ${minsPast}m ago` : `${minsPast}m ago`;
      return {
        isWindowOpen: false,
        windowRemainingText: null,
        expiredAgoText: `Expired ${timeStr}`
      };
    }
  }, [lastInboundMsg?.timestamp, messages]);

  if (!contact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#f0f2f5] p-8 text-center border-b-[6px] border-wa-teal select-none">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-wa-teal mb-4 shadow-inner">
          <Phone className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-medium text-gray-800 mb-1">AGUAONE WhatsApp Dashboard</h2>
        <p className="text-sm text-gray-500 max-w-md">
          Select a customer from the left sidebar to inspect lead responses, monitor bot questionnaire progress, or take over chat directly on WhatsApp.
        </p>
      </div>
    );
  }

  const isBotActive = contact.bot_active === 1 && contact.lead_status !== 'HANDOFF';

  return (
    <div className="flex-1 flex flex-col h-full bg-[#efeae2] relative overflow-hidden">
      {/* Chat Top Header with Mobile Safe Area Inset */}
      <div className="bg-[#f0f2f5] px-2 sm:px-4 flex items-center justify-between border-b border-gray-200 shrink-0 z-20 min-h-[64px] pt-[env(safe-area-inset-top,0px)] py-2 shadow-xs">
        <div className="flex items-center space-x-1.5 sm:space-x-3 min-w-0 flex-1 mr-1 sm:mr-2">
          {onBackMobile && (
            <button
              type="button"
              onClick={onBackMobile}
              className="md:hidden p-2 text-gray-700 hover:bg-gray-200 active:bg-gray-300 rounded-full transition-colors shrink-0 flex items-center justify-center cursor-pointer"
              title="Back to contacts"
              aria-label="Back to contacts"
            >
              <ArrowLeft className="w-5 h-5 text-gray-800" />
            </button>
          )}

          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-sm shrink-0">
            {contact.name && contact.name !== 'Customer'
              ? contact.name.charAt(0).toUpperCase()
              : contact.phone.slice(-2)}
          </div>

          <div className="min-w-0 flex-1">
            {isEditingName ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveName();
                }}
                className="flex items-center space-x-1.5 py-0.5"
              >
                <input
                  ref={nameInputRef}
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setIsEditingName(false);
                  }}
                  placeholder="Enter contact name..."
                  className="text-xs sm:text-sm font-semibold text-gray-900 bg-white border border-wa-teal rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-wa-teal shadow-xs max-w-[200px]"
                  disabled={isSavingName}
                />
                <button
                  type="submit"
                  disabled={isSavingName || !editedName.trim()}
                  className="p-1 text-emerald-600 hover:bg-emerald-100 rounded transition-colors"
                  title="Save name"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  disabled={isSavingName}
                  className="p-1 text-gray-400 hover:bg-gray-200 rounded transition-colors"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="flex items-center space-x-1.5 truncate group">
                <h2
                  onClick={handleStartEditName}
                  className="font-semibold text-gray-900 text-sm leading-tight truncate cursor-pointer hover:text-wa-teal transition-colors"
                  title="Click to rename user"
                >
                  {contact.name && contact.name !== 'Customer' ? contact.name : `+${contact.phone}`}
                </h2>
                <button
                  type="button"
                  onClick={handleStartEditName}
                  className="p-1 text-gray-400 hover:text-wa-teal rounded transition-colors opacity-70 group-hover:opacity-100"
                  title="Rename user"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                {contact.brand && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                    contact.brand.toLowerCase() === 'flovax'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {contact.brand.toLowerCase() === 'flovax' ? '🇳🇵 FLOVAX' : '🇮🇳 AGUAONE'}
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
              <span className="text-[11px] text-gray-500 truncate">+{contact.phone}</span>
              <span className="text-gray-300 hidden sm:inline">•</span>
              
              {isBotActive ? (
                <span className="text-[11px] text-sky-700 font-medium flex items-center space-x-1 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse shrink-0"></span>
                  <span className="truncate">Bot Active ({contact.state})</span>
                </span>
              ) : (
                <span className="text-[11px] text-emerald-700 font-medium flex items-center space-x-1 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="truncate">Human Mode</span>
                </span>
              )}

              {/* 24-Hour WhatsApp Care Window Indicator */}
              <span className="text-gray-300 hidden sm:inline">•</span>
              {isWindowOpen ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>24h Window: {windowRemainingText}</span>
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-amber-100 text-amber-900 flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                  <span>24h Window Closed</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
          {/* Quick 1-Click Bot Toggle Switch */}
          <button
            onClick={() => onToggleBot(!isBotActive)}
            className={`px-2 sm:px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1 transition-all shadow-sm ${
              isBotActive
                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
                : 'bg-sky-100 text-sky-800 hover:bg-sky-200 border border-sky-300'
            }`}
            title={isBotActive ? 'Click to Pause Bot & Take Over' : 'Click to Resume Bot Automation'}
          >
            {isBotActive ? (
              <>
                <User className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Take Over</span>
                <span className="sm:hidden text-[11px]">Pause</span>
              </>
            ) : (
              <>
                <Bot className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Resume Bot</span>
                <span className="sm:hidden text-[11px]">Resume</span>
              </>
            )}
          </button>

          {/* Toggle CRM Drawer */}
          <button
            onClick={onToggleLeadPanel}
            title={showLeadPanel ? "Hide Lead CRM" : "Show Lead CRM"}
            className={`p-2 rounded-full transition-colors ${
              showLeadPanel ? 'bg-gray-200 text-wa-teal' : 'text-gray-600 hover:bg-gray-200 active:bg-gray-300'
            }`}
          >
            <PanelRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-1"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.03' fill-rule='evenodd'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-wa-teal border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-xs">
            No messages yet. Send a message to start conversation.
          </div>
        ) : (
          messages.map((msg, idx) => (
            <MessageBubble key={msg.id || idx} message={msg} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 24-Hour Window Closed Banner OR Active Message Input Bar */}
      {!isWindowOpen ? (
        <div className="bg-[#fff8e1] border-t border-amber-200/80 p-3.5 sm:p-4 text-center shrink-0 shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center justify-center space-x-2 text-amber-900 font-semibold text-xs sm:text-sm mb-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>24-Hour Customer Care Window Closed (Meta Policy)</span>
          </div>
          <p className="text-xs text-amber-800 max-w-xl mx-auto leading-relaxed">
            Meta WhatsApp Cloud API policy restricts businesses from sending free-form messages, images, or files after 24 hours of customer inactivity.
            {expiredAgoText ? ` (${expiredAgoText})` : ''}
          </p>
          <div className="mt-2.5 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-100 text-[11px] font-medium text-amber-900 border border-amber-300">
            <span>🔒 Sending locked until customer sends a new message to reopen the 24h window.</span>
          </div>
        </div>
      ) : (
        <MessageInput
          onSendMessage={onSendMessage}
          onSendMedia={onSendMedia}
          disabled={isLoading}
          botActive={isBotActive}
        />
      )}
    </div>
  );
};
