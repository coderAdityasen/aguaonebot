import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await login(username.trim(), password.trim());
    if (!result.success) {
      setError(result.error || 'Invalid credentials');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen w-screen bg-[#e1e3e6] flex flex-col justify-between select-none relative overflow-hidden">
      {/* Top WhatsApp Teal Header Band */}
      <div className="h-56 bg-wa-teal w-full absolute top-0 left-0 z-0">
        <div className="max-w-4xl mx-auto px-6 pt-8 flex items-center space-x-3 text-white">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold text-xl">
            A
          </div>
          <span className="font-bold tracking-wide text-lg">AGUAONE WHATSAPP PLATFORM</span>
        </div>
      </div>

      {/* Center Auth Card */}
      <div className="flex-1 flex items-center justify-center p-4 z-10 pt-20">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-50 text-wa-teal rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-inner">
              <ShieldCheck className="w-9 h-9" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Admin & Agent Login</h1>
            <p className="text-xs text-gray-500 mt-1">
              Sign in to manage WhatsApp conversations, CRM leads & bot handoff
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Admin Username
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-[#f0f2f5] text-gray-800 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-wa-teal transition-all border border-transparent focus:border-wa-teal"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-[#f0f2f5] text-gray-800 text-sm rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-wa-teal transition-all border border-transparent focus:border-wa-teal"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-gray-400 hover:text-gray-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 bg-wa-teal hover:bg-wa-teal-dark text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center space-x-2 mt-2 ${
                isSubmitting ? 'opacity-80 cursor-wait' : 'hover:shadow-lg active:scale-98'
              }`}
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Default Credentials Hint */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-[11px] text-gray-400">
              Default credentials in <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600 font-mono">.env</code>:
            </p>
            <p className="text-xs font-mono text-gray-600 mt-1 font-semibold">
              admin / aguaone@2026
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 text-xs text-gray-500 z-10">
        AGUAONE Lead Qualification Bot & Agent CRM • Ultra-Low Latency VPS Edition
      </div>
    </div>
  );
};
