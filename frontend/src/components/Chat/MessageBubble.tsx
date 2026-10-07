import React, { useState } from 'react';
import { Message } from '../../types';
import { Bot, User, Check, CheckCheck, ExternalLink, X, FileText, Download, Clock, AlertCircle } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const [showLightbox, setShowLightbox] = useState(false);
  const isOutbound = message.direction === 'outbound';
  const isBot = message.sender_type === 'bot';
  const isAgent = message.sender_type === 'agent';

  const isImage = 
    message.message_type === 'image' || 
    (Boolean(message.media_url) && /\.(jpe?g|png|gif|webp)(\?.*)?$/i.test(message.media_url || ''));

  const isVideo = 
    message.message_type === 'video' || 
    (Boolean(message.media_url) && /\.(mp4|mov|webm|3gp)(\?.*)?$/i.test(message.media_url || ''));

  const isDocument =
    message.message_type === 'document' ||
    (Boolean(message.media_url) && /\.(pdf|docx?|xlsx?|pptx?|txt|csv)(\?.*)?$/i.test(message.media_url || ''));

  const documentName = React.useMemo(() => {
    if (!isDocument) return '';
    const rawContent = (message.content || '').replace(/^📄\s*/, '').trim();
    if (rawContent && rawContent.includes('.') && rawContent.toLowerCase() !== 'untitled') {
      return rawContent;
    }
    if (message.media_url) {
      const urlBase = message.media_url.split('/').pop()?.split('?')[0] || '';
      const cleanBase = urlBase.replace(/^(?:inbound_|document_)?\d+_[a-z0-9]*_?/i, '');
      if (cleanBase && cleanBase.includes('.') && cleanBase.toLowerCase() !== 'untitled') {
        return cleanBase;
      }
      if (urlBase && urlBase.includes('.')) {
        return urlBase;
      }
    }
    return rawContent || 'Document.pdf';
  }, [isDocument, message.content, message.media_url]);

  const mediaSrc = message.media_url || (isImage || isVideo || isDocument ? message.content : '');

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div className={`flex w-full my-1.5 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`relative max-w-[88%] sm:max-w-[80%] md:max-w-[70%] rounded-lg px-3 py-2 text-sm shadow-sm transition-all ${
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
                  <span>Bot Automation</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-emerald-800">
                  <User className="w-3.5 h-3.5" />
                  <span>Human Agent</span>
                </span>
              )}
            </div>
          )}

          {/* Media Rendering: IMAGE */}
          {isImage && mediaSrc && (
            <div className="mb-1.5 mt-0.5 rounded-lg overflow-hidden group relative cursor-pointer border border-black/5 bg-gray-50">
              <img
                src={mediaSrc}
                alt={message.caption || 'WhatsApp Image'}
                onClick={() => setShowLightbox(true)}
                className="max-h-72 w-full object-cover rounded-lg hover:opacity-95 transition-opacity"
                loading="lazy"
              />
              <div
                onClick={() => setShowLightbox(true)}
                className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium space-x-1"
              >
                <ExternalLink className="w-4 h-4" />
                <span>View Full Size</span>
              </div>
            </div>
          )}

          {/* Media Rendering: VIDEO */}
          {isVideo && mediaSrc && (
            <div className="mb-1.5 mt-0.5 rounded-lg overflow-hidden border border-black/5 bg-black/90">
              <video
                src={mediaSrc}
                controls
                preload="metadata"
                className="max-h-80 w-full rounded-lg"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {/* Media Rendering: DOCUMENT */}
          {isDocument && mediaSrc && (
            <a
              href={mediaSrc}
              target="_blank"
              rel="noreferrer"
              download={documentName}
              className="flex items-center space-x-2.5 p-2.5 my-1 rounded-lg bg-black/5 hover:bg-black/10 transition-colors border border-black/10 group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate group-hover:underline" title={documentName}>
                  {documentName}
                </p>
                <span className="text-[10px] text-gray-500">Tap to download</span>
              </div>
              <Download className="w-4 h-4 text-gray-400 group-hover:text-gray-700 shrink-0" />
            </a>
          )}

          {/* Message Body Content / Caption */}
          {message.caption ? (
            <div className="whitespace-pre-wrap leading-relaxed break-words text-[13.5px] mt-1">
              {message.caption}
            </div>
          ) : (!isImage && !isVideo && !isDocument && message.content) ? (
            <div className="whitespace-pre-wrap leading-relaxed break-words text-[13.5px]">
              {message.content}
            </div>
          ) : null}

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
              <span title={
                message.status === 'read' ? 'Read' :
                message.status === 'delivered' ? 'Delivered' :
                message.status === 'pending' ? 'Sending...' :
                message.status === 'failed' ? 'Delivery failed' : 'Sent'
              }>
                {message.status === 'read' ? (
                  <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
                ) : message.status === 'delivered' ? (
                  <CheckCheck className="w-3.5 h-3.5 text-gray-400" />
                ) : message.status === 'pending' ? (
                  <Clock className="w-3.5 h-3.5 text-gray-400 animate-pulse" />
                ) : message.status === 'failed' ? (
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-gray-400" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal for Enlarged Image View */}
      {showLightbox && isImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowLightbox(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={mediaSrc}
              alt="Enlarged media"
              className="max-h-[80vh] max-w-full rounded-lg shadow-2xl object-contain"
            />
            {message.caption && (
              <p className="text-white text-sm mt-3 px-4 py-1.5 bg-black/50 rounded-full text-center max-w-xl">
                {message.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};
