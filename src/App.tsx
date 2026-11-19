import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

interface SavedPost {
  id: string;
  topic: string;
  tone: string;
  content: string;
  created_at: string;
}

const SAMPLE_TOPICS = [
  {
    label: '🚀 Project Launch',
    text: 'How I built and deployed my own AI LinkedIn Post Generator using React, TypeScript, Supabase, and Vercel.',
  },
  {
    label: '💼 Job / Career Tip',
    text: '5 resume mistakes that get freshers rejected in the first 10 seconds—and how to fix them.',
  },
  {
    label: '🔥 Coding Journey',
    text: 'Why building real-world projects beats watching 100 hours of coding tutorials.',
  },
];

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
  const [headline, setHeadline] = useState('Full-Stack Developer | Building in Public');
  const [generatedPost, setGeneratedPost] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Saved Posts States
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const previewRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user's saved posts on login
  useEffect(() => {
    if (user) {
      fetchSavedPosts();
    }
  }, [user]);

  // Auto-resize preview textarea to remove awkward inner scrollbars
  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.style.height = 'auto';
      previewRef.current.style.height = `${previewRef.current.scrollHeight}px`;
    }
  }, [generatedPost]);

  const fetchSavedPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSavedPosts(data);
    }
  };

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
    setSavedPosts([]);
    setGeneratedPost('');
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    setCopied(false);
    setSaveSuccess(false);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    const prompt = `You are an expert LinkedIn Ghostwriter and Personal Branding Strategist.
Turn the user's raw idea into a high-engagement, scroll-stopping LinkedIn post.

User's Raw Idea: "${topic}"
Tone: ${tone}
Target Length: ${length} (Short = ~60-90 words, Medium = ~130-180 words, Long = ~220-280 words)
Emojis: ${includeEmojis ? 'Use 3-5 relevant emojis naturally for visual breaks' : 'Do NOT use any emojis'}
Hashtags: ${includeHashtags ? 'Add 3-5 high-reach, relevant hashtags at the very bottom' : 'Do NOT include any hashtags'}

Strict Rules:
1. Start with a strong 1-2 line scroll-stopping hook (under 12 words on line 1).
2. Fix any grammar/spelling issues from the raw idea while keeping the core message authentic.
3. Use short 1-2 sentence paragraphs with blank lines between thoughts.
4. End with a clear, engaging question to drive comments.
5. Return ONLY the post text ready to copy-paste. Do NOT use markdown stars (** or *) because LinkedIn does not render markdown.`;

    try {
      if (!apiKey) {
        await new Promise((res) => setTimeout(res, 700));
        setGeneratedPost(
          `⚠️ Note: Add VITE_GEMINI_API_KEY in Vercel to unlock real AI generation.\n\nMeanwhile, here is a draft on "${topic}":\n\nMost people overcomplicate progress.\n\nHere is what actually moves the needle:\n• Start before you feel 100% ready\n• Focus on solving one real problem\n• Share your learnings publicly\n\nWhat's your take on this? Drop your thoughts below 👇\n\n${
            includeHashtags ? '#LinkedInGrowth #BuildInPublic #Career' : ''
          }`
        );
        } else {
        const cleanKey = apiKey.trim();

        const listRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`
        );
        const listData = await listRes.json();

        if (!listRes.ok) {
          alert(`API Key Error: ${listData?.error?.message || 'Invalid API Key'}`);
          return;
        }

        const validModels = (listData.models || [])
          .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
          .map((m: any) => m.name)
          .filter((name: string) => !name.includes('2.5-flash'));

        // Latest models ko pehle try karein, busy ho toh agle model par fallback karein
        const candidateModels = [...validModels].reverse();
        let generatedText = '';
        let lastError = 'No supported models available';

        for (const modelName of candidateModels) {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${cleanKey}`,
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

          if (text) {
            generatedText = text.trim();
            break;
          } else {
            lastError = data?.error?.message || 'Model busy';
          }
        }

        if (generatedText) {
          setGeneratedPost(generatedText);
        } else {
          alert(`Gemini Error: ${lastError}`);
        }
      }

    } catch (err) {
      console.error(err);
      alert('Network error while generating post.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePost = async () => {
    if (!generatedPost.trim() || !user) return;
    setIsSaving(true);

    const { error } = await supabase.from('posts').insert([
      {
        user_id: user.id,
        topic: topic || 'Untitled Idea',
        tone,
        content: generatedPost,
      },
    ]);

    if (error) {
      alert('Error saving post: ' + error.message);
    } else {
      setSaveSuccess(true);
      fetchSavedPosts();
      setTimeout(() => setSaveSuccess(false), 2500);
    }
    setIsSaving(false);
  };

  const handleDeletePost = async (id: string) => {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (!error) {
      setSavedPosts((prev) => prev.filter((post) => post.id !== id));
    }
  };

  const handleCopy = (textToCopy = generatedPost) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Auth Screen
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

          <div className="my-5 flex items-center">
            <div className="flex-grow border-t border-gray-700"></div>
            <span className="px-3 text-xs text-gray-400 uppercase">or</span>
            <div className="flex-grow border-t border-gray-700"></div>
          </div>

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
  const charCount = generatedPost.length;

  // Main Workspace
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6">
      {/* Top Navbar */}
      <div className="flex justify-between items-center max-w-6xl mx-auto mb-8 border-b border-gray-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-indigo-400">🚀 LinkedIn Post Generator</h1>
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

      {/* Generator & Live Preview Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Card: Controls */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-100">✍️ Create Your Post</h2>
            {topic && (
              <button
                type="button"
                onClick={() => setTopic('')}
                className="text-xs text-gray-400 hover:text-white transition"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Sample Chips */}
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-2">Try a quick idea:</p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_TOPICS.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => setTopic(sample.text)}
                  className="text-xs bg-gray-900 hover:bg-gray-700 text-indigo-300 border border-gray-700 px-2.5 py-1.5 rounded-full transition"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

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
                placeholder="Write your idea, story, or rough notes here..."
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
                  <option value="Short">Short (~80 words)</option>
                  <option value="Medium">Medium (~150 words)</option>
                  <option value="Long">Long-form (~250 words)</option>
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
                Include Emojis
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeHashtags}
                  onChange={(e) => setIncludeHashtags(e.target.checked)}
                  className="rounded text-indigo-600 bg-gray-900 border-gray-700"
                />
                Include Hashtags
              </label>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg font-semibold transition text-white shadow-lg"
            >
              {isGenerating ? '✨ Writing your post...' : '⚡ Generate Post'}
            </button>
          </form>
        </div>

        {/* Right Card: Auto-Expanding LinkedIn Preview */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-gray-100">👀 Live LinkedIn Preview</h2>
            {generatedPost && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSavePost}
                  disabled={isSaving}
                  className="px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-600 rounded text-xs font-medium transition text-white"
                >
                  {saveSuccess ? '✅ Saved!' : isSaving ? 'Saving...' : '💾 Save Post'}
                </button>
                <button
                  onClick={() => handleCopy()}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium transition text-indigo-300"
                >
                  {copied ? '✅ Copied!' : '📋 Copy Post'}
                </button>
              </div>
            )}
          </div>

          <div className="bg-white text-gray-900 rounded-lg p-4 shadow-md">
            {/* Profile Header with Editable Headline */}
            <div className="flex items-start gap-3 mb-3">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-11 h-11 rounded-full object-cover mt-0.5" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                  {displayName[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-900">{displayName}</p>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full text-xs text-gray-500 bg-transparent focus:outline-none focus:bg-gray-100 rounded px-1 -ml-1"
                  title="Click to edit your LinkedIn headline"
                />
                <p className="text-[11px] text-gray-400">Just now • 🌐</p>
              </div>
            </div>

            {generatedPost ? (
              <textarea
                ref={previewRef}
                value={generatedPost}
                onChange={(e) => setGeneratedPost(e.target.value)}
                className="w-full text-sm text-gray-800 whitespace-pre-wrap leading-relaxed focus:outline-none resize-none overflow-hidden border border-transparent focus:border-gray-200 rounded p-1"
              />
            ) : (
              <div className="py-16 text-center text-gray-400 text-sm">
                Select a sample idea or write your own topic on the left, then click <b>Generate Post</b>.
              </div>
            )}

            {/* Character Counter */}
            {generatedPost && (
              <div className="flex justify-end mt-2">
                <span
                  className={`text-[11px] font-medium ${
                    charCount > 3000 ? 'text-red-600' : 'text-gray-400'
                  }`}
                >
                  {charCount} / 3,000 characters
                </span>
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

      {/* Bottom Section: Saved Posts History */}
      <div className="max-w-6xl mx-auto mt-10">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">
          📚 Your Saved Posts ({savedPosts.length})
        </h2>

        {savedPosts.length === 0 ? (
          <div className="bg-gray-800/60 border border-gray-700/70 rounded-xl p-6 text-center text-sm text-gray-400">
            No saved posts yet. Generate a post and click <b>💾 Save Post</b> to keep it here!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedPosts.map((post) => (
              <div
                key={post.id}
                className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full">
                      {post.tone || 'Post'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 whitespace-pre-line line-clamp-4 mb-4">
                    {post.content}
                  </p>
                </div>

                <div className="flex justify-end gap-2 border-t border-gray-700 pt-3">
                  <button
                    onClick={() => {
                      setGeneratedPost(post.content);
                      setTopic(post.topic);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-200 transition"
                  >
                    ✏️ Load in Editor
                  </button>
                  <button
                    onClick={() => handleCopy(post.content)}
                    className="px-3 py-1 bg-indigo-600/80 hover:bg-indigo-600 rounded text-xs text-white transition"
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded text-xs transition"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}