import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Check, Bookmark, Trash2, LogOut, RefreshCw } from 'lucide-react';
import { supabase } from './supabase';
import { AuthPage } from './components/AuthPage';
import { LinkedInPreview } from './components/LinkedInPreview';

interface SavedPost {
  id: string;
  topic: string;
  tone: string;
  content: string;
  created_at: string;
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('Storytelling');
  const [length, setLength] = useState('Medium (~150 words)');
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [includeHashtags, setIncludeHashtags] = useState(true);

  const [generatedPost, setGeneratedPost] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchSavedPosts();
    } else {
      setSavedPosts([]);
    }
  }, [user]);

  const fetchSavedPosts = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSavedPosts(data);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      alert('Please enter a post topic or rough idea first.');
      return;
    }

    setIsGenerating(true);
    setCopied(false);
    setSaveSuccess(false);

    const groqKey = import.meta.env.VITE_GROQ_API_KEY?.trim();
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();

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
      let generatedText = '';
      let groqError = '';

      // 1. PEHLE Ultra-Fast Groq AI chalega (~1 second response)
      if (groqKey) {
        let activeGroqModel = sessionStorage.getItem('groq_active_model') || '';

        if (!activeGroqModel) {
          try {
            const listRes = await fetch('https://api.groq.com/openai/v1/models', {
              headers: { Authorization: `Bearer ${groqKey}` },
            });
            const listData = await listRes.json();
            const available: string[] = (listData?.data || [])
              .map((m: any) => m.id)
              .filter(
                (id: string) =>
                  !id.includes('whisper') &&
                  !id.includes('guard') &&
                  !id.includes('tts') &&
                  !id.includes('compound')
              );

            const preferred = available.find(
              (id) =>
                (id.includes('llama') || id.includes('gemma') || id.includes('mistral')) &&
                !id.includes('70b') &&
                !id.includes('reasoning')
            );
            activeGroqModel = preferred || available[0] || '';
          } catch {
            // Ignore list fetch error
          }
        }

        if (activeGroqModel) {
          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${groqKey}`,
            },
            body: JSON.stringify({
              model: activeGroqModel,
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.7,
              max_tokens: 500,
            }),
          });
          const groqData = await groqRes.json();
          const text = groqData?.choices?.[0]?.message?.content;
          if (text && text.trim()) {
            sessionStorage.setItem('groq_active_model', activeGroqModel);
            generatedText = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
          } else {
            sessionStorage.removeItem('groq_active_model');
            groqError = groqData?.error?.message || `Groq Status ${groqRes.status}`;
          }
        }
      }

      // 2. SIRF agar Groq fail ho toh Gemini fallback chalega
      if (!generatedText && geminiKey) {
        for (const modelName of ['gemini-3.5-flash-lite', 'gemini-3.8-flash']) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          try {
            const res = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                  contents: [{ parts: [{ text: prompt }] }],
                }),
              }
            );
            clearTimeout(timeoutId);
            const data = await res.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text && text.trim()) {
              generatedText = text.trim();
              break;
            }
          } catch {
            clearTimeout(timeoutId);
          }
        }
      }

      if (generatedText) {
        setGeneratedPost(generatedText);
      } else {
        alert(
          !groqKey
            ? 'VITE_GROQ_API_KEY missing in Vercel Environment Variables!'
            : `Generation Failed: ${groqError || 'AI servers are busy, please try again.'}`
        );
      }
    } catch (err) {
      console.error(err);
      alert('Network error while generating post.');
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-white">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'LinkedIn Creator';
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '';

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100">
      {/* Navbar */}
      <header className="border-b border-slate-800/80 bg-[#0F1629]/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🚀</span>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              LinkedIn Post Generator
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800/70 px-3 py-1.5 rounded-full border border-slate-700/60">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm text-slate-200 font-medium hidden sm:inline">
                {userName}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-sm font-medium transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Input Form */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span>✍️</span> Create Your Post
              </h2>
              {topic && (
                <button
                  type="button"
                  onClick={() => {
                    setTopic('');
                    setGeneratedPost('');
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 transition"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Quick Idea Chips */}
            <div className="mb-4">
              <p className="text-xs text-slate-400 mb-2">Try a quick idea:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setTopic('Just launched my new full-stack web app after weeks of late-night coding!')
                  }
                  className="text-xs px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                >
                  🚀 Project Launch
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setTopic('3 lessons I learned while preparing for tech interviews as a developer')
                  }
                  className="text-xs px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                >
                  💼 Job / Career Tip
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setTopic('Why building projects in public helped me grow faster than just watching tutorials')
                  }
                  className="text-xs px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                >
                  🔥 Coding Journey
                </button>
              </div>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Post Topic or Rough Idea
                </label>
                <textarea
                  rows={4}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Write your raw thought, project update, or lesson learned..."
                  className="w-full rounded-xl bg-[#0B0F19] border border-slate-700/80 px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Tone
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full rounded-xl bg-[#0B0F19] border border-slate-700/80 px-3 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Storytelling">📖 Storytelling</option>
                    <option value="Professional & Insightful">💼 Professional & Insightful</option>
                    <option value="Bold & Contrarian">🔥 Bold & Contrarian</option>
                    <option value="Educational / How-To">💡 Educational / How-To</option>
                    <option value="Casual & Authentic">😊 Casual & Authentic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Length
                  </label>
                  <select
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full rounded-xl bg-[#0B0F19] border border-slate-700/80 px-3 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Short (~80 words)">Short (~80 words)</option>
                    <option value="Medium (~150 words)">Medium (~150 words)</option>
                    <option value="Long (~250 words)">Long (~250 words)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeEmojis}
                    onChange={(e) => setIncludeEmojis(e.target.checked)}
                    className="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                  />
                  Include Emojis
                </label>

                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeHashtags}
                    onChange={(e) => setIncludeHashtags(e.target.checked)}
                    className="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                  />
                  Include Hashtags
                </label>
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-60 font-semibold text-white shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Sparkles className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Writing your post...' : '⚡ Generate Post'}</span>
              </button>
            </form>
          </div>

          {/* Right Column: Live LinkedIn Preview */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span>👀</span> Live LinkedIn Preview
              </h2>

              {generatedPost && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleSavePost}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-xs font-medium text-indigo-300 border border-indigo-500/40 transition"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{saveSuccess ? 'Saved!' : isSaving ? 'Saving...' : 'Save'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1">
               <LinkedInPreview
                text={generatedPost}
                setText={setGeneratedPost}
                userName={userName}
              />
            </div>
          </div>
        </div>

        {/* Saved Posts Section */}
        <section className="mt-10 bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>📚</span> Your Saved Posts ({savedPosts.length})
          </h3>

          {savedPosts.length === 0 ? (
            <p className="text-sm text-slate-400">
              No saved posts yet. Generate a post and click Save to keep it here!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-[#0B0F19] border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {post.tone}
                      </span>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="text-slate-500 hover:text-red-400 transition"
                        title="Delete post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-slate-200 whitespace-pre-line line-clamp-5">
                      {post.content}
                    </p>
                  </div>

                  <button
                    onClick={() => setGeneratedPost(post.content)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium self-start transition"
                  >
                    Load into Preview →
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}