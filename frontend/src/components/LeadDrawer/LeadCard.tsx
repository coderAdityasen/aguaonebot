import React, { useState } from 'react';
import { Contact, Note } from '../../types';
import { 
  Building2, 
  MapPin, 
  Store, 
  Clock, 
  Briefcase, 
  IndianRupee, 
  Award, 
  Download, 
  Plus, 
  X,
  FileText
} from 'lucide-react';
import axios from 'axios';

import { downloadLeadsCSV } from '../../utils/export';

interface LeadCardProps {
  contact: Contact | null;
  notes: Note[];
  onUpdateLeadStatus: (status: string) => Promise<void>;
  onAddNote: (note: string) => Promise<void>;
  onClose: () => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  contact,
  notes,
  onUpdateLeadStatus,
  onAddNote,
  onClose
}) => {
  const [newNote, setNewNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!contact) return null;

  const handleSaveNote = async () => {
    if (!newNote.trim() || isSavingNote) return;
    setIsSavingNote(true);
    try {
      await onAddNote(newNote.trim());
      setNewNote('');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleExportCSV = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await downloadLeadsCSV({ type: 'all' });
    } finally {
      setIsExporting(false);
    }
  };

  const isFlovax = contact.brand?.toLowerCase() === 'flovax';

  const surveyFields = [
    { label: 'Brand Track', value: contact.brand ? (isFlovax ? '🇳🇵 FLOVAX (Nepal)' : '🇮🇳 AGUAONE (India)') : '', icon: Building2, color: 'text-sky-500' },
    { label: 'City / District', value: contact.city, icon: MapPin, color: 'text-rose-500' },
    { label: 'Shop Status', value: contact.shop_status, icon: Store, color: 'text-amber-500' },
    { label: 'Experience', value: contact.experience, icon: Clock, color: 'text-indigo-500' },
    { label: 'Opportunity', value: contact.opportunity, icon: Briefcase, color: 'text-purple-500' },
    { label: 'Monthly Volume', value: contact.budget, icon: IndianRupee, color: 'text-emerald-500' },
    { label: 'Firm / Business Name', value: contact.firm_name, icon: FileText, color: 'text-cyan-600' },
    ...(isFlovax ? [
      { label: 'Import License', value: contact.import_license, icon: Building2, color: 'text-blue-600' },
      { label: 'Import Experience', value: contact.import_experience, icon: Clock, color: 'text-teal-600' },
      { label: 'PAN / Registration', value: contact.pan_registration, icon: Store, color: 'text-violet-600' }
    ] : [
      { label: 'GST Registration', value: contact.gst_status, icon: Building2, color: 'text-emerald-600' }
    ])
  ];

  return (
    <div className="w-full sm:w-88 md:w-96 lg:w-88 bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden select-none">
      {/* Header with Safe Area Inset */}
      <div className="min-h-[64px] px-4 bg-[#f0f2f5] border-b border-gray-200 flex items-center justify-between shrink-0 pt-[env(safe-area-inset-top,0px)] py-2 shadow-xs">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-wa-teal" />
          <h2 className="font-semibold text-gray-800 text-sm">Lead CRM Details</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:bg-gray-200 active:bg-gray-300 rounded-full transition-colors"
          title="Close lead details"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Customer Identity Card */}
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-wa-teal text-white flex items-center justify-center font-bold text-xl mb-2 shadow-sm">
            {contact.name && contact.name !== 'Customer' ? contact.name.charAt(0).toUpperCase() : 'C'}
          </div>
          <h3 className="font-semibold text-gray-900 text-base">{contact.name || 'Customer'}</h3>
          <p className="text-xs text-gray-500">+{contact.phone}</p>

          {/* Brand Tag */}
          {contact.brand && (
            <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800">
              {isFlovax ? '🇳🇵 FLOVAX Dealership' : '🇮🇳 AGUAONE Dealership'}
            </div>
          )}

          {/* Lead Status Dropdown */}
          <div className="mt-3">
            <label className="text-[11px] font-medium text-gray-400 block mb-1 uppercase tracking-wide">
              Lead Lifecycle Status
            </label>
            <select
              value={contact.lead_status}
              onChange={(e) => onUpdateLeadStatus(e.target.value)}
              className="w-full text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-wa-teal"
            >
              <option value="IN_PROGRESS">🟡 IN PROGRESS (Bot Active)</option>
              <option value="HANDOFF">🟣 HANDOFF (Needs Human)</option>
              <option value="QUALIFIED">⭐ QUALIFIED (Ready for Dealership)</option>
              <option value="CLOSED">⚪ CLOSED / ARCHIVED</option>
            </select>
          </div>
        </div>

        {/* Qualification Survey Responses */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center space-x-1">
              <span>{isFlovax ? 'FLOVAX (Nepal)' : 'AGUAONE'} Survey Answers</span>
            </h4>
            {contact.qualified ? (
              <span className="flex items-center space-x-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <Award className="w-3 h-3" />
                <span>Qualified</span>
              </span>
            ) : null}
          </div>

          <div className="space-y-2">
            {surveyFields.map((field, i) => {
              const Icon = field.icon;
              return (
                <div
                  key={i}
                  className="p-2.5 rounded-lg border border-gray-100 bg-[#f9fafb] flex items-start space-x-2.5"
                >
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${field.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-gray-400 font-medium leading-none mb-1">
                      {field.label}
                    </p>
                    <p className="text-xs font-semibold text-gray-800 break-words">
                      {field.value || <span className="text-gray-300 font-normal italic">Pending...</span>}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Private Internal Notes */}
        <div>
          <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
            Internal Agent Notes
          </h4>

          {/* New note input */}
          <div className="space-y-1.5 mb-3">
            <textarea
              rows={2}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add private note (e.g. Call scheduled for tomorrow 2 PM)..."
              className="w-full text-xs p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-wa-teal resize-none"
            />
            <button
              onClick={handleSaveNote}
              disabled={!newNote.trim() || isSavingNote}
              className={`w-full py-1.5 rounded-md text-xs font-medium flex items-center justify-center space-x-1 transition-all ${
                newNote.trim() && !isSavingNote
                  ? 'bg-wa-teal text-white hover:bg-wa-teal-dark'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Note</span>
            </button>
          </div>

          {/* Notes History list */}
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {notes.length === 0 ? (
              <p className="text-[11px] text-gray-400 text-center py-2">No notes added yet</p>
            ) : (
              notes.map((n) => (
                <div key={n.id} className="p-2 bg-yellow-50/60 rounded border border-yellow-200/60 text-xs">
                  <p className="text-gray-800 whitespace-pre-wrap">{n.note}</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {n.agent_name} • {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer with CSV Export */}
      <div className="p-3 bg-[#f0f2f5] border-t border-gray-200 shrink-0">
        <button
          onClick={handleExportCSV}
          disabled={isExporting}
          className={`w-full py-2 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-colors shadow-sm ${
            isExporting ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
          <span>{isExporting ? 'Generating CSV...' : 'Export All Leads to CSV'}</span>
        </button>
      </div>
    </div>
  );
};
