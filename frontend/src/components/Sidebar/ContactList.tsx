import React, { useState } from 'react';
import { Contact } from '../../types';
import { Search, Bot, User, Award, Settings, RefreshCw, MessageSquare, LogOut, Download } from 'lucide-react';
import { downloadLeadsCSV } from '../../utils/export';

interface ContactListProps {
  contacts: Contact[];
  selectedPhone: string | null;
  onSelectContact: (phone: string) => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenSettings: () => void;
  onRefresh: () => void;
  onLogout: () => void;
  isLoading: boolean;
  className?: string;
}

export const ContactList: React.FC<ContactListProps> = ({
  contacts,
  selectedPhone,
  onSelectContact,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  onOpenSettings,
  onRefresh,
  onLogout,
  isLoading,
  className = ''
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExport = async (type: 'all' | 'qualified') => {
    setIsExporting(true);
    setShowExportMenu(false);
    try {
      const brand = activeFilter === 'aguaone' ? 'aguaone' : activeFilter === 'flovax' ? 'flovax' : 'all';
      await downloadLeadsCSV({ type, brand });
    } finally {
      setIsExporting(false);
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handoffCount = contacts.filter(c => c.bot_active === 0 || c.lead_status === 'HANDOFF').length;

  return (
    <div className={`flex flex-col h-full bg-white border-r border-gray-200 select-none ${className}`}>
      {/* Top Header with Safe Area Inset */}
      <div className="min-h-[64px] bg-[#f0f2f5] px-3 sm:px-4 flex items-center justify-between border-b border-gray-200 shrink-0 pt-[env(safe-area-inset-top,0px)] py-2 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-wa-teal text-white flex items-center justify-center font-bold text-lg shadow-sm">
            A
          </div>
          <div>
            <h1 className="font-semibold text-gray-800 text-sm leading-tight">AGUAONE Lead CRM</h1>
            <p className="text-xs text-gray-500">Live Agent Inbox</p>
          </div>
        </div>

        <div className="flex items-center space-x-1 text-gray-600">
          {/* Export Leads Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              title="Export Leads to CSV"
              className={`p-2 hover:bg-gray-200 rounded-full transition-colors flex items-center ${
                isExporting ? 'text-emerald-600' : ''
              }`}
            >
              <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce text-emerald-600' : ''}`} />
            </button>

            {showExportMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Export to CSV {activeFilter === 'aguaone' ? '(AGUAONE)' : activeFilter === 'flovax' ? '(FLOVAX)' : ''}
                  </div>
                  <button
                    onClick={() => handleExport('qualified')}
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50 hover:text-emerald-700 flex items-center space-x-2 text-gray-700 transition-colors"
                  >
                    <Award className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Qualified Leads Only</span>
                  </button>
                  <button
                    onClick={() => handleExport('all')}
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50 hover:text-emerald-700 flex items-center space-x-2 text-gray-700 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    <span>All Contacts & Leads</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={onRefresh}
            title="Refresh contacts"
            className={`p-2 hover:bg-gray-200 rounded-full transition-colors ${isLoading ? 'animate-spin text-wa-teal' : ''}`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenSettings}
            title="Meta & Webhook Settings"
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onLogout}
            title="Log Out"
            className="p-2 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="p-2 bg-white border-b border-gray-100">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, phone, or city..."
            className="w-full bg-[#f0f2f5] text-gray-800 text-sm rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:bg-white focus:ring-1 focus:ring-wa-teal transition-all"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 px-2 py-2 bg-white border-b border-gray-200 text-xs overflow-x-auto scrollbar-none">
        <button
          onClick={() => onFilterChange('all')}
          className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
            activeFilter === 'all'
              ? 'bg-[#00a884] text-white font-medium shadow-sm'
              : 'bg-[#f0f2f5] text-gray-600 hover:bg-gray-200'
          }`}
        >
          All ({contacts.length})
        </button>

        <button
          onClick={() => onFilterChange('handoff')}
          className={`px-3 py-1 rounded-full whitespace-nowrap flex items-center space-x-1 transition-colors ${
            activeFilter === 'handoff'
              ? 'bg-[#00a884] text-white font-medium shadow-sm'
              : 'bg-[#f0f2f5] text-gray-600 hover:bg-gray-200'
          }`}
        >
          <span>Needs Human</span>
          {handoffCount > 0 && (
            <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
              activeFilter === 'handoff' ? 'bg-white text-wa-teal' : 'bg-red-500 text-white'
            }`}>
              {handoffCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onFilterChange('bot_active')}
          className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
            activeFilter === 'bot_active'
              ? 'bg-[#00a884] text-white font-medium shadow-sm'
              : 'bg-[#f0f2f5] text-gray-600 hover:bg-gray-200'
          }`}
        >
          Bot Active
        </button>

        <button
          onClick={() => onFilterChange('qualified')}
          className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
            activeFilter === 'qualified'
              ? 'bg-[#00a884] text-white font-medium shadow-sm'
              : 'bg-[#f0f2f5] text-gray-600 hover:bg-gray-200'
          }`}
        >
          Qualified ⭐
        </button>

        <button
          onClick={() => onFilterChange('aguaone')}
          className={`px-3 py-1 rounded-full whitespace-nowrap flex items-center space-x-1 transition-colors ${
            activeFilter === 'aguaone'
              ? 'bg-emerald-600 text-white font-medium shadow-sm'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <span>🇮🇳 AGUAONE</span>
        </button>

        <button
          onClick={() => onFilterChange('flovax')}
          className={`px-3 py-1 rounded-full whitespace-nowrap flex items-center space-x-1 transition-colors ${
            activeFilter === 'flovax'
              ? 'bg-sky-600 text-white font-medium shadow-sm'
              : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200'
          }`}
        >
          <span>🇳🇵 FLOVAX</span>
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {contacts.length === 0 ? (
          <div className="p-8 text-center text-gray-400 flex flex-col items-center justify-center space-y-2">
            <MessageSquare className="w-8 h-8 opacity-40" />
            <p className="text-sm">No conversations found</p>
            <p className="text-xs text-gray-400">Incoming WhatsApp messages will appear here live</p>
          </div>
        ) : (
          contacts.map((contact) => {
            const isSelected = selectedPhone === contact.phone;
            const isBotActive = contact.bot_active === 1 && contact.lead_status !== 'HANDOFF';

            return (
              <div
                key={contact.phone}
                onClick={() => onSelectContact(contact.phone)}
                className={`px-3 py-3 flex items-center space-x-3 cursor-pointer transition-colors relative ${
                  isSelected
                    ? 'bg-[#f0f2f5]'
                    : 'hover:bg-[#f5f6f6] bg-white'
                }`}
              >
                {/* Avatar with Status Ring */}
                <div className="relative shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold text-white shadow-sm ${
                    contact.qualified ? 'bg-amber-500' : isBotActive ? 'bg-sky-600' : 'bg-emerald-600'
                  }`}>
                    {contact.name && contact.name !== 'Customer'
                      ? contact.name.charAt(0).toUpperCase()
                      : contact.phone.slice(-2)}
                  </div>
                  {/* Small icon badge on avatar */}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow">
                    {contact.qualified ? (
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                    ) : isBotActive ? (
                      <Bot className="w-3.5 h-3.5 text-sky-600" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </div>
                </div>

                {/* Name, message snippet, and status tags */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h2 className="font-medium text-gray-900 text-sm truncate pr-2">
                      {contact.name && contact.name !== 'Customer' ? contact.name : `+${contact.phone}`}
                    </h2>
                    <span className="text-[11px] text-gray-400 shrink-0">
                      {formatTime(contact.last_message_at)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 truncate mb-1">
                    {contact.last_message || `State: ${contact.state}`}
                  </p>

                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    {/* Brand Pill */}
                    {contact.brand && (
                      <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        contact.brand.toLowerCase() === 'flovax'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {contact.brand.toLowerCase() === 'flovax' ? '🇳🇵 FLOVAX' : '🇮🇳 AGUAONE'}
                      </span>
                    )}

                    {/* Bot vs Human Pill */}
                    {isBotActive ? (
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-sky-100 text-sky-800">
                        🤖 Bot
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
                        🙋 Human Mode
                      </span>
                    )}

                    {/* Lead Status Tag */}
                    {contact.qualified ? (
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        ⭐ Qualified
                      </span>
                    ) : contact.lead_status === 'HANDOFF' ? (
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-purple-100 text-purple-800">
                        Handoff
                      </span>
                    ) : null}

                    {contact.city && (
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] bg-gray-100 text-gray-600">
                        📍 {contact.city}
                      </span>
                    )}
                  </div>
                </div>

                {/* Unread Message Badge */}
                {contact.unread_count > 0 && (
                  <div className="shrink-0 flex items-center justify-center">
                    <span className="w-5 h-5 rounded-full bg-wa-teal text-white text-[11px] font-bold flex items-center justify-center shadow">
                      {contact.unread_count}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
