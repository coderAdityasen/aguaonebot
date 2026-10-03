import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Contact, Message, Note } from './types';
import { useSocket } from './context/SocketContext';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './components/Auth/LoginPage';
import { ContactList } from './components/Sidebar/ContactList';
import { ChatWindow } from './components/Chat/ChatWindow';
import { LeadCard } from './components/LeadDrawer/LeadCard';
import { MetaSettingsModal } from './components/Modals/MetaSettingsModal';

export const App: React.FC = () => {
  const { isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const { isConnected, latestMessage, latestContactUpdate } = useSocket();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLeadPanel, setShowLeadPanel] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Fetch list of contacts (only when authenticated)
  const fetchContacts = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingContacts(true);
    try {
      const res = await axios.get('/api/contacts', {
        params: { filter: activeFilter, search: searchQuery }
      });
      setContacts(res.data.contacts || []);
    } catch (err: any) {
      if (err.response?.status === 401) {
        logout();
      }
      console.error('Failed to load contacts:', err);
    } finally {
      setIsLoadingContacts(false);
    }
  }, [isAuthenticated, activeFilter, searchQuery, logout]);

  // Initial load and filter/search reload
  useEffect(() => {
    if (isAuthenticated) {
      fetchContacts();
    }
  }, [isAuthenticated, fetchContacts]);

  // Fetch messages and notes for selected contact
  const fetchConversation = useCallback(async (phone: string) => {
    setIsLoadingMessages(true);
    try {
      const [msgRes, contactRes] = await Promise.all([
        axios.get(`/api/contacts/${phone}/messages`),
        axios.get(`/api/contacts/${phone}`)
      ]);

      setMessages(msgRes.data.messages || []);
      setNotes(contactRes.data.notes || []);

      // Reset unread count on server
      await axios.post(`/api/contacts/${phone}/reset-unread`);

      // Update contact unread count locally
      setContacts(prev => prev.map(c => c.phone === phone ? { ...c, unread_count: 0 } : c));
    } catch (err: any) {
      if (err.response?.status === 401) {
        logout();
      }
      console.error('Failed to load conversation:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [logout]);

  // When a contact is clicked
  const handleSelectContact = (phone: string) => {
    setSelectedPhone(phone);
    fetchConversation(phone);
  };

  // Real-time WebSocket: incoming message handler
  useEffect(() => {
    if (!latestMessage || !isAuthenticated) return;

    // If message is for currently open chat, append to messages
    if (selectedPhone && latestMessage.phone === selectedPhone) {
      setMessages(prev => {
        if (latestMessage.whatsapp_message_id && prev.some(m => m.whatsapp_message_id === latestMessage.whatsapp_message_id)) {
          return prev;
        }
        return [...prev, latestMessage];
      });
    }

    // Refresh contact list or update latest snippet
    setContacts(prev => {
      const exists = prev.some(c => c.phone === latestMessage.phone);
      if (!exists) {
        fetchContacts();
        return prev;
      }
      return prev.map(c => {
        if (c.phone === latestMessage.phone) {
          const isCurrent = c.phone === selectedPhone;
          return {
            ...c,
            last_message: latestMessage.content,
            last_message_at: latestMessage.timestamp,
            unread_count: isCurrent ? 0 : (c.unread_count || 0) + 1
          };
        }
        return c;
      });
    });
  }, [latestMessage, selectedPhone, isAuthenticated, fetchContacts]);

  // Real-time WebSocket: contact update handler
  useEffect(() => {
    if (!latestContactUpdate || !isAuthenticated) return;

    setContacts(prev => {
      const exists = prev.some(c => c.phone === latestContactUpdate.phone);
      if (!exists) {
        return [latestContactUpdate, ...prev];
      }
      return prev.map(c => c.phone === latestContactUpdate.phone ? { ...c, ...latestContactUpdate } : c);
    });
  }, [latestContactUpdate, isAuthenticated]);

  // Action: Human Agent sends a message
  const handleSendMessage = async (text: string) => {
    if (!selectedPhone) return;
    try {
      const res = await axios.post('/api/messages/send', {
        phone: selectedPhone,
        text
      });

      if (res.data?.message) {
        setMessages(prev => [...prev, res.data.message]);
      }
    } catch (err: any) {
      alert(`Failed to send WhatsApp message: ${err.response?.data?.error || err.message}`);
    }
  };

  // Action: 1-Click Bot Automation Mode Toggle
  const handleToggleBot = async (active: boolean) => {
    if (!selectedPhone) return;
    try {
      const res = await axios.post(`/api/contacts/${selectedPhone}/toggle-bot`, {
        bot_active: active ? 1 : 0
      });
      if (res.data?.contact) {
        setContacts(prev => prev.map(c => c.phone === selectedPhone ? res.data.contact : c));
      }
    } catch (err) {
      console.error('Failed to toggle bot mode:', err);
    }
  };

  // Action: Update Lead Lifecycle Status
  const handleUpdateLeadStatus = async (status: string) => {
    if (!selectedPhone) return;
    try {
      const res = await axios.patch(`/api/contacts/${selectedPhone}/lead`, {
        lead_status: status
      });
      if (res.data?.contact) {
        setContacts(prev => prev.map(c => c.phone === selectedPhone ? { ...c, lead_status: status as any } : c));
      }
    } catch (err) {
      console.error('Failed to update lead status:', err);
    }
  };

  // Action: Add Internal Note
  const handleAddNote = async (note: string) => {
    if (!selectedPhone) return;
    try {
      const res = await axios.post(`/api/contacts/${selectedPhone}/notes`, {
        note,
        agent_name: 'Agent'
      });
      if (res.data?.notes) {
        setNotes(res.data.notes);
      }
    } catch (err) {
      console.error('Failed to save note:', err);
    }
  };

  // Loading state while verifying token
  if (isAuthLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#f0f2f5]">
        <div className="w-10 h-10 border-3 border-wa-teal border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs text-gray-500 font-medium">Verifying admin session...</p>
      </div>
    );
  }

  // If not authenticated, display Login Page
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const selectedContact = contacts.find(c => c.phone === selectedPhone) || null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      {/* 1. Left Sidebar: Contacts List */}
      <ContactList
        contacts={contacts}
        selectedPhone={selectedPhone}
        onSelectContact={handleSelectContact}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenSettings={() => setShowSettingsModal(true)}
        onRefresh={fetchContacts}
        onLogout={logout}
        isLoading={isLoadingContacts}
      />

      {/* 2. Middle Column: Active Live Chat Feed */}
      <ChatWindow
        contact={selectedContact}
        messages={messages}
        isLoading={isLoadingMessages}
        onSendMessage={handleSendMessage}
        onToggleBot={handleToggleBot}
        onToggleLeadPanel={() => setShowLeadPanel(prev => !prev)}
        showLeadPanel={showLeadPanel}
      />

      {/* 3. Right Column: Collapsible Lead CRM Drawer */}
      {showLeadPanel && selectedContact && (
        <LeadCard
          contact={selectedContact}
          notes={notes}
          onUpdateLeadStatus={handleUpdateLeadStatus}
          onAddNote={handleAddNote}
          onClose={() => setShowLeadPanel(false)}
        />
      )}

      {/* Meta WhatsApp & Webhook Configuration Modal */}
      <MetaSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onRefreshContacts={fetchContacts}
      />

      {/* Live WebSocket Connection Status Ping at Bottom Right */}
      <div className="fixed bottom-3 right-3 z-40 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full shadow border border-gray-200 flex items-center space-x-1.5 text-[11px] font-medium text-gray-600">
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
        <span>{isConnected ? 'WebSocket: Live' : 'WS Reconnecting...'}</span>
      </div>
    </div>
  );
};
