import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MetaConnectionStatus } from '../../types';
import { X, CheckCircle, AlertCircle, RefreshCw, Send, Link, ShieldCheck, Copy, Check } from 'lucide-react';

interface MetaSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshContacts: () => void;
}

export const MetaSettingsModal: React.FC<MetaSettingsModalProps> = ({
  isOpen,
  onClose,
  onRefreshContacts
}) => {
  const [status, setStatus] = useState<MetaConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionResult, setSubscriptionResult] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Test message simulator state
  const [simPhone, setSimPhone] = useState('919876543210');
  const [simText, setSimText] = useState('Hi');
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('/api/meta/status');
      setStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch Meta status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoSubscribe = async () => {
    setIsSubscribing(true);
    setSubscriptionResult(null);
    try {
      const res = await axios.post('/api/meta/auto-subscribe', {
        domain: window.location.origin
      });
      setSubscriptionResult('✅ Webhook successfully auto-registered and subscribed with Meta Cloud API!');
      fetchStatus();
    } catch (err: any) {
      setSubscriptionResult(`❌ Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleSimulateIncoming = async () => {
    if (!simPhone || !simText) return;
    setIsSimulating(true);
    try {
      await axios.post('/api/meta/simulate-incoming', {
        phone: simPhone,
        text: simText,
        name: 'Test Customer'
      });
      onRefreshContacts();
      setSimText('');
    } catch (err: any) {
      alert(`Simulation error: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const copyToClipboard = (text: string, type: 'url' | 'token') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  if (!isOpen) return null;

  const webhookUrl = `${window.location.origin}/webhook`;
  const verifyToken = status?.verifyToken || 'aguaone_lead_bot_verify_token_2026';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#f0f2f5] border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-wa-teal" />
            <h2 className="font-semibold text-gray-900 text-base">Meta WhatsApp & Webhook Setup</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Status Banner */}
          <div className={`p-4 rounded-xl border flex items-start space-x-3 ${
            status?.metaConnection?.connected
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            {status?.metaConnection?.connected ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs">
              <p className="font-bold text-sm">
                {status?.metaConnection?.connected
                  ? 'Meta Cloud API Connected & Live'
                  : 'Meta Credentials Pending Configuration'}
              </p>
              {status?.metaConnection?.connected ? (
                <p className="mt-1 text-emerald-700">
                  Number: <strong>{status.metaConnection.displayPhoneNumber}</strong> ({status.metaConnection.verifiedName})
                </p>
              ) : (
                <p className="mt-1 text-amber-700">
                  Update <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">.env</code> with your Meta Permanent Access Token and Phone Number ID to connect live WhatsApp.
                </p>
              )}
            </div>
            <button
              onClick={fetchStatus}
              className={`p-1.5 rounded-md hover:bg-black/5 text-gray-500 ${isLoading ? 'animate-spin' : ''}`}
              title="Refresh connection status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Webhook URLs to copy */}
          <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
            <h3 className="font-bold text-gray-800 flex items-center space-x-1.5">
              <Link className="w-4 h-4 text-wa-teal" />
              <span>Your Webhook Credentials</span>
            </h3>

            <div>
              <label className="text-[11px] font-semibold text-gray-500 block mb-1">
                Webhook Callback URL
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="flex-1 bg-white font-mono text-[11px] px-3 py-1.5 rounded border border-gray-300 text-gray-700 focus:outline-none select-all"
                />
                <button
                  onClick={() => copyToClipboard(webhookUrl, 'url')}
                  className="px-2.5 py-1.5 bg-gray-200 hover:bg-gray-300 rounded font-medium text-gray-700 flex items-center space-x-1"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-500 block mb-1">
                Verify Token
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={verifyToken}
                  className="flex-1 bg-white font-mono text-[11px] px-3 py-1.5 rounded border border-gray-300 text-gray-700 focus:outline-none select-all"
                />
                <button
                  onClick={() => copyToClipboard(verifyToken, 'token')}
                  className="px-2.5 py-1.5 bg-gray-200 hover:bg-gray-300 rounded font-medium text-gray-700 flex items-center space-x-1"
                >
                  {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Auto-Subscribe Action (Replicating n8n OAuth convenience) */}
            <div className="pt-2">
              <button
                onClick={handleAutoSubscribe}
                disabled={isSubscribing}
                className="w-full py-2 bg-wa-teal hover:bg-wa-teal-dark text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center space-x-2 text-xs"
              >
                {isSubscribing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>{isSubscribing ? 'Subscribing...' : 'Auto-Subscribe Webhook to Meta API'}</span>
              </button>

              {subscriptionResult && (
                <p className="mt-2 text-xs font-medium p-2 rounded bg-white border border-gray-200 break-words">
                  {subscriptionResult}
                </p>
              )}
            </div>
          </div>

          {/* Built-In Bot Simulator for Local Testing */}
          <div className="bg-sky-50/70 p-4 rounded-xl border border-sky-200 text-xs space-y-2.5">
            <h3 className="font-bold text-sky-900 flex items-center space-x-1.5">
              <span>🧪 Local Bot & State Machine Simulator</span>
            </h3>
            <p className="text-sky-700 text-[11px]">
              Simulate an incoming WhatsApp message right now without live Meta credentials to watch the questionnaire flow in real time!
            </p>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-sky-800 block mb-1">Customer Phone</label>
                <input
                  type="text"
                  value={simPhone}
                  onChange={(e) => setSimPhone(e.target.value)}
                  className="w-full bg-white px-2.5 py-1.5 rounded border border-sky-300 text-gray-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-sky-800 block mb-1">Message Text / Option</label>
                <input
                  type="text"
                  value={simText}
                  onChange={(e) => setSimText(e.target.value)}
                  placeholder="e.g. Hi, Lucknow, Own Shop..."
                  className="w-full bg-white px-2.5 py-1.5 rounded border border-sky-300 text-gray-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <button
                onClick={handleSimulateIncoming}
                disabled={isSimulating}
                className="flex-1 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-2xs flex items-center justify-center space-x-1 text-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSimulating ? 'Sending...' : 'Send Simulated Message'}</span>
              </button>

              <button
                onClick={() => { setSimText('flovax'); }}
                className="px-2 py-1.5 bg-blue-50 border border-blue-300 text-blue-800 hover:bg-blue-100 rounded text-xs font-semibold"
                title="Simulate FLOVAX Nepal Flow"
              >
                "flovax"
              </button>

              <button
                onClick={() => { setSimText('aguaone'); }}
                className="px-2 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded text-xs font-semibold"
                title="Simulate AGUAONE India Flow"
              >
                "aguaone"
              </button>

              <button
                onClick={() => { setSimText('restart'); }}
                className="px-2 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded text-xs font-medium"
              >
                "restart"
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
