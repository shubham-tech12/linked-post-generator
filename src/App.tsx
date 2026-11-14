import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function App() {
  // Auth States
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Generator States
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('Storytelling');
  const [length, setLength] = useState('Medium');
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [generatedPost, setGeneratedPost] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message);
      else alert('🎉 Signup successful! Check your email or log in.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
    }
    setAuthLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) alert(error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    setCopied(false);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    const prompt = `Write a high-engagement LinkedIn post about: "${topic}".
    - Tone: ${tone}
    - Length: ${length}
    - Use emojis: ${includeEmojis ? 'Yes, naturally placed' : 'No emojis'}
    - Include relevant hashtags at the end: ${includeHashtags ? 'Yes (3-5 hashtags)' : 'No hashtags'}
    - Formatting: Strong 1-2 line hook at the top, short readable paragraphs with line breaks, and an engaging question at the end. Return ONLY the post text.`;

    try {
      if (!apiKey) {
        await new Promise((res) => setTimeout(res, 700));
        setGeneratedPost(
          `Most people overcomplicate ${topic}.\n\nHere is what actually works when you focus on execution:\n\n1. Start small and ship fast\n2. Solve one specific problem\n3. Share your learnings publicly\n\nWhat's your experience with ${topic}? Let's discuss below 👇\n\n${
            includeHashtags ? '#LinkedInGrowth #BuildInPublic #Career' : ''
          }`
        );
      } else {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          }
        );
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) setGeneratedPost(text.trim());
        else alert('AI generation failed. Check your Gemini API key.');
      }
    } catch (err) {
      console.error(err);
      alert('Error generating post.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedPost) return;
    navigator.clipboard.writeText(generatedPost);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Login / Signup View
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white px-4">
        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
          <h2 className="text-2xl font-bold mb-6 text-center text-indigo-400">
            {isSignUp ? '✨ Create Account' : '🔑 Welcome Back'}
          </h2>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-900 rounded border border-gray-700 focus:outline-none focus:border-indigo-500 text-white"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-900 rounded border border-gray-700 focus:outline-none focus:border-indigo-500 text-white"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded font-semibold transition text-white shadow-lg"
            >
              {authLoading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Login'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center">
            <div className="flex-grow border-t border-gray-700"></div>
            <span className="px-3 text-xs text-gray-400 uppercase">or</span>
            <div className="flex-grow border-t border-gray-700"></div>
          </div>

          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-2.5 bg-white hover:bg-gray-100 text-gray-900 rounded font-semibold transition flex items-center justify-center gap-3 shadow-md"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-indigo-400 hover:underline"
            >
              {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator';
  const avatarUrl = user.user_metadata?.avatar_url;

  // Logged-In Generator Dashboard
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="flex justify-between items-center max-w-6xl mx-auto mb-8 border-b border-gray-800 pb-4">
        <h1 className="text-2xl font-bold text-indigo-400">🚀 LinkedIn Post Generator</h1>
        <div className="flex items-center gap-3">
          {avatarUrl && (
            <img src={avatarUrl} alt="Profile" className="w-8 h-8 rounded-full border border-indigo-500" />
          )}
          <span className="text-sm text-gray-300 hidden sm:inline">{displayName}</span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600/80 hover:bg-red-600 rounded text-sm font-medium transition"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Generator Form */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-fit">
          <h2 className="text-lg font-semibold mb-4 text-gray-100">✍️ Create Your Post</h2>
          <form onSubmit={handleGenerate} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Post Topic or Rough Idea
              </label>
              <textarea
                rows={4}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
                placeholder="e.g., 3 lessons I learned while deploying my first React + Supabase app on Vercel..."
                className="w-full p-3 bg-gray-900 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500 text-white text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full p-2.5 bg-gray-900 rounded-lg border border-gray-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="Storytelling">📖 Storytelling</option>
                  <option value="Viral Hook">🔥 Viral / Punchy</option>
                  <option value="Educational">💡 Educational</option>
                  <option value="Contrarian">⚡ Bold / Contrarian</option>
                  <option value="Professional">👔 Professional</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Length</label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full p-2.5 bg-gray-900 rounded-lg border border-gray-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="Short">Short</option>
                  <option value="Medium">Medium</option>
                  <option value="Long">Long-form</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeEmojis}
                  onChange={(e) => setIncludeEmojis(e.target.checked)}
                  className="rounded text-indigo-600 bg-gray-900 border-gray-700"
                />
                Emojis
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeHashtags}
                  onChange={(e) => setIncludeHashtags(e.target.checked)}
                  className="rounded text-indigo-600 bg-gray-900 border-gray-700"
                />
                Hashtags
              </label>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg font-semibold transition text-white shadow-lg"
            >
              {isGenerating ? '✨ Generating...' : '⚡ Generate Post'}
            </button>
          </form>
        </div>

        {/* Right: LinkedIn Preview Card */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-100">👀 Live LinkedIn Preview</h2>
            {generatedPost && (
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium transition text-indigo-300"
              >
                {copied ? '✅ Copied!' : '📋 Copy Post'}
              </button>
            )}
          </div>

          <div className="bg-white text-gray-900 rounded-lg p-4 shadow-md">
            <div className="flex items-center gap-3 mb-3">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-11 h-11 rounded-full object-cover" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                  {displayName[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-sm text-gray-900">{displayName}</p>
                <p className="text-xs text-gray-500">Just now • 🌐</p>
              </div>
            </div>

            {generatedPost ? (
              <textarea
                value={generatedPost}
                onChange={(e) => setGeneratedPost(e.target.value)}
                rows={11}
                className="w-full text-sm text-gray-800 whitespace-pre-wrap leading-relaxed focus:outline-none resize-none border border-transparent focus:border-gray-200 rounded p-1"
              />
            ) : (
              <div className="py-16 text-center text-gray-400 text-sm">
                Left side mein topic likh kar <b>Generate Post</b> par click karein.
              </div>
            )}

            <div className="border-t border-gray-200 mt-3 pt-2.5 flex justify-around text-xs font-medium text-gray-500">
              <span>👍 Like</span>
              <span>💬 Comment</span>
              <span>🔁 Repost</span>
              <span>📤 Send</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}