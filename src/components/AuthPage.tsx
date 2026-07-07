import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, Linkedin, Mail, Loader2 } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) return;
    
    try {
      setIsSending(true);
      // सीधे AuthContext के फंक्शन को कॉल कर रहे हैं
      await signInWithEmail(cleanEmail);
    } catch (error) {
      console.error("Form Submit Error:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-2xl text-center">
        <div className="inline-flex p-3 bg-blue-600/10 rounded-xl text-blue-500 mb-4 border border-blue-500/20">
          <Sparkles className="w-8 h-8 animate-pulse" />
        </div>
        
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2 flex items-center justify-center gap-2">
          LinkedIn <span className="text-blue-500">Post AI</span>
        </h1>
        <p className="text-slate-400 text-sm mb-8">
          Generate viral LinkedIn posts and carousels in seconds.
        </p>

        {/* Google Login Button */}
        <button
          onClick={signInWithGoogle}
          className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold py-3 px-4 rounded-xl transition duration-200 flex items-center justify-center gap-3 shadow-lg mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </button>

        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-slate-700"></div>
          <span className="flex-shrink mx-4 text-slate-500 text-xs uppercase tracking-wider">Or continue with</span>
          <div className="flex-grow border-t border-slate-700"></div>
        </div>

        {/* Email Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Mail size={18} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSending || !email.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg"
          >
            {isSending ? <Loader2 className="animate-spin" size={18} /> : null}
            {isSending ? 'Sending link...' : 'Send Magic Link'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Linkedin className="w-3 h-3" /> Powered by Gemini AI & Supabase
        </div>
      </div>
    </div>
  );
};