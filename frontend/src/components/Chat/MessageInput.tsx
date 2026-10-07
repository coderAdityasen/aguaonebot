import React, { useState, useRef, useEffect } from 'react';
import { Send, Zap, Paperclip, X, Image as ImageIcon, Video, FileText } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (text: string) => void | Promise<void>;
  onSendMedia?: (file: File, caption?: string) => void | Promise<void>;
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
  onSendMedia,
  disabled,
  botActive
}) => {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit to 50MB
    if (file.size > 50 * 1024 * 1024) {
      alert('File size exceeds 50MB limit.');
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
    inputRef.current?.focus();
    // Reset file input value so re-selecting same file triggers onChange
    e.target.value = '';
  };

  const handleClearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  // WhatsApp-Style Instant Send: Dispatches in background without locking UI
  const handleSend = () => {
    if (disabled) return;

    if (selectedFile) {
      if (!onSendMedia) return;
      const fileToSend = selectedFile;
      const captionToSend = text.trim();
      handleClearFile();
      setText('');
      inputRef.current?.focus();
      onSendMedia(fileToSend, captionToSend);
      return;
    }

    if (!text.trim()) return;
    const textToSend = text.trim();
    setText('');
    inputRef.current?.focus();
    onSendMessage(textToSend);
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

  const isVideo = selectedFile?.type.startsWith('video');
  const isImage = selectedFile?.type.startsWith('image');
  const isDoc = !isVideo && !isImage;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-[#f0f2f5] p-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))] border-t border-gray-200 shrink-0">
      {/* Hidden File Input (supports images, videos, documents) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/3gpp,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Selected Media Preview Tray */}
      {selectedFile && (
        <div className="mb-2 p-2 bg-white rounded-xl border border-wa-teal/30 shadow-sm flex items-center space-x-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="relative w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center border border-gray-200">
            {isVideo ? (
              <div className="flex flex-col items-center justify-center text-sky-600">
                <Video className="w-6 h-6" />
                <span className="text-[9px] font-bold mt-0.5 uppercase">Video</span>
              </div>
            ) : isImage && previewUrl ? (
              <img src={previewUrl} alt="Upload preview" className="w-full h-full object-cover" />
            ) : isDoc ? (
              <div className="flex flex-col items-center justify-center text-red-500">
                <FileText className="w-6 h-6" />
                <span className="text-[9px] font-bold mt-0.5 uppercase">DOC</span>
              </div>
            ) : (
              <ImageIcon className="w-6 h-6 text-gray-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                isVideo ? 'bg-purple-100 text-purple-800' : isDoc ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {isVideo ? '🎥 VIDEO' : isDoc ? '📄 DOCUMENT' : '📷 PHOTO'}
              </span>
              <p className="text-xs font-semibold text-gray-800 truncate">{selectedFile.name}</p>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {formatFileSize(selectedFile.size)} • Type optional caption below
            </p>
          </div>

          <button
            onClick={handleClearFile}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors shrink-0"
            title="Remove attachment"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Reply Chips (Hidden when media preview is active) */}
      {!selectedFile && (
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
      )}

      {/* Input Row */}
      <div className="flex items-center space-x-2">
        {/* Attachment Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className={`p-2 sm:p-2.5 rounded-full transition-all shrink-0 flex items-center justify-center ${
            selectedFile
              ? 'bg-wa-teal text-white'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200 active:bg-gray-300'
          }`}
          title="Upload image, video or document"
        >
          <Paperclip className="w-5 h-5 -rotate-45" />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={
            selectedFile
              ? "Add a caption (optional)..."
              : botActive
              ? "Type to send as agent (pauses bot)..."
              : "Type a WhatsApp reply..."
          }
          className="flex-1 bg-white text-gray-800 text-sm rounded-lg px-3.5 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:ring-1 focus:ring-wa-teal border border-gray-200 transition-all placeholder:text-gray-400 min-w-0"
        />

        <button
          onClick={handleSend}
          disabled={(!text.trim() && !selectedFile) || disabled}
          className={`p-2.5 rounded-full transition-all shadow-sm flex items-center justify-center shrink-0 min-w-[40px] min-h-[40px] ${
            (text.trim() || selectedFile) && !disabled
              ? 'bg-wa-teal text-white hover:bg-wa-teal-dark active:scale-95'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          title={selectedFile ? "Send attachment" : "Send WhatsApp message"}
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
