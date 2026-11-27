import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Bookmark,
  Trash2,
  LogOut,
  RefreshCw,
  Send,
  Wand2,
  Zap,
  Crown,
} from 'lucide-react';
import { supabase } from './supabase';
import { AuthPage } from './components/AuthPage';
import { LinkedInPreview } from './components/LinkedInPreview';
import { SubscriptionModal } from './components/SubscriptionModal';

interface SavedPost {
  id: string;
  topic: string;
  tone: string;
  content: string;
  created_at: string;
}

const DAILY_FREE_LIMIT = 3;

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
  const [isRefining, setIsRefining] = useState(false);
  const [activeRefineAction, setActiveRefineAction] = useState('');
  const [copied, setCopied] = useState(false);

  // 3 Viral Hook Variations state
  const [hooks, setHooks] = useState<string[]>([]);
  const [isGeneratingHooks, setIsGeneratingHooks] = useState(false);

  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Subscription & Daily Usage State
  const [isPro, setIsPro] = useState(false);
  const [dailyUsed, setDailyUsed] = useState(0);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);

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

   // Load saved posts & user subscription/usage status from Supabase
  useEffect(() => {
    if (user) {
      fetchSavedPosts();
      loadUserUsageAndPlan();
    } else {
      setSavedPosts([]);
      setIsPro(false);
      setDailyUsed(0);
    }
  }, [user]);

  const loadUserUsageAndPlan = async () => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    // Check if user just returned from Dodo Payments checkout
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      await supabase.from('user_subscriptions').upsert({
        user_id: user.id,
        is_pro: true,
        daily_used: 0,
        usage_date: today,
      });
      setIsPro(true);
      setDailyUsed(0);
      window.history.replaceState({}, document.title, window.location.pathname);
      alert('🎉 Payment Successful! Welcome to Pro Creator Plan.');
      return;
    }

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error loading usage:', error);
      return;
    }

    if (!data) {
      await supabase.from('user_subscriptions').insert({
        user_id: user.id,
        is_pro: false,
        daily_used: 0,
        usage_date: today,
      });
      setIsPro(false);
      setDailyUsed(0);
      return;
    }

    let currentUsed = data.daily_used || 0;
    if (data.usage_date !== today) {
      currentUsed = 0;
      await supabase
        .from('user_subscriptions')
        .update({ daily_used: 0, usage_date: today })
        .eq('user_id', user.id);
    }

    setIsPro(Boolean(data.is_pro));
    setDailyUsed(currentUsed);
  };

  const remainingFreeUses = Math.max(0, DAILY_FREE_LIMIT - dailyUsed);

  const checkAndIncrementUsage = (): boolean => {
    if (isPro) return true;
    if (dailyUsed >= DAILY_FREE_LIMIT) {
      setIsSubModalOpen(true);
      return false;
    }
    const nextCount = dailyUsed + 1;
    setDailyUsed(nextCount);

    if (user) {
      const today = new Date().toISOString().slice(0, 10);
      supabase
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          is_pro: isPro,
          daily_used: nextCount,
          usage_date: today,
        })
        .then(({ error }) => {
          if (error) console.error('Failed to sync usage:', error);
        });
    }
    return true;
  };

  const handleUpgradeToPro = async () => {
    setIsPro(true);
    if (user) {
      await supabase
        .from('user_subscriptions')
        .upsert({ user_id: user.id, is_pro: true });
    }
    setIsSubModalOpen(false);
  };

  const handleDowngradeToFree = async () => {
    setIsPro(false);
    if (user) {
      await supabase
        .from('user_subscriptions')
        .upsert({ user_id: user.id, is_pro: false });
    }
  };

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

  // Shared 1-Second Groq-Primary + Gemini-Fallback AI Helper
   // Shared 1-Second Groq-Primary + Gemini-Fallback AI Helper
  const callFastAI = async (aiPrompt: string): Promise<string> => {
    const groqKey = import.meta.env.VITE_GROQ_API_KEY?.trim();
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();

    let generatedText = '';
    let groqError = '';
    const cleanOutput = (str: string) =>
  str
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .replace(/^```[\w]*\n?/gm, '')
    .replace(/```$/gm, '')
    .replace(/\*\*/g, '')
    .trim();

    if (groqKey) {
      let candidateModels: string[] = [];
      const cachedModel = sessionStorage.getItem('groq_active_model');
      if (cachedModel) candidateModels.push(cachedModel);

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
              !id.includes('orpheus') &&
              !id.includes('playai') &&
              !id.includes('vision') &&
              !id.includes('compound')
          );

        const preferredOrder = [
          ...available.filter((id) => (id.includes('llama') || id.includes('gemma')) && !id.includes('70b')),
          ...available.filter((id) => id.includes('llama') || id.includes('gemma')),
          ...available,
        ];

        for (const m of preferredOrder) {
          if (!candidateModels.includes(m)) candidateModels.push(m);
        }
      } catch (e: any) {
        groqError = e?.message || 'Could not fetch Groq models';
      }

      if (candidateModels.length === 0) {
        candidateModels = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'];
      }

      for (const modelId of candidateModels) {
        try {
          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${groqKey}`,
            },
            body: JSON.stringify({
              model: modelId,
              messages: [{ role: 'user', content: aiPrompt }],
              temperature: 0.7,
              max_tokens: 1024,
            }),
          });
          const groqData = await groqRes.json();
          const rawText = groqData?.choices?.[0]?.message?.content || '';
           const text = cleanOutput(rawText);
          if (text) {
            sessionStorage.setItem('groq_active_model', modelId);
            generatedText = text;
            break;
          } else {
            sessionStorage.removeItem('groq_active_model');
            groqError = groqData?.error?.message || `Groq Status ${groqRes.status}`;
          }
        } catch (e: any) {
          sessionStorage.removeItem('groq_active_model');
          groqError = e?.message || 'Groq network error';
        }
      }
    }

    // Gemini Fallback (using current supported models)
    if (!generatedText && geminiKey) {
      for (const modelName of ['gemini-2.5-flash', 'gemini-2.0-flash']) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
              body: JSON.stringify({
                contents: [{ parts: [{ text: aiPrompt }] }],
              }),
            }
          );
          clearTimeout(timeoutId);
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text && text.trim()) {
             generatedText = cleanOutput(text);
            break;
          }
        } catch {
          clearTimeout(timeoutId);
        }
      }
    }

    if (!generatedText) {
      throw new Error(
        !groqKey
          ? 'VITE_GROQ_API_KEY is missing in Vercel Environment Variables!'
          : groqError || 'All AI models failed. Check Groq/Gemini API keys in Vercel.'
      );
    }

    return generatedText;
  };

  // Main Post Generator
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      alert('Please enter a post topic or rough idea first.');
      return;
    }

    if (!checkAndIncrementUsage()) return;

    setIsGenerating(true);
    setCopied(false);
    setSaveSuccess(false);
    setHooks([]);

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
      const result = await callFastAI(prompt);
      setGeneratedPost(result);
    } catch (err: any) {
      alert('Generation Failed: ' + (err?.message || 'Please try again.'));
    } finally {
      setIsGenerating(false);
    }
  };

  // One-Click Rewrite Toolbar (Shorter / Punchier / Add Stats / Fix Grammar)
  const handleRefinePost = async (action: 'Shorter' | 'Punchier' | 'Add Stats' | 'Fix Grammar') => {
    if (!generatedPost.trim() || isRefining) return;
    if (!checkAndIncrementUsage()) return;

    setIsRefining(true);
    setActiveRefineAction(action);

    const instructionsMap: Record<typeof action, string> = {
      Shorter:
        'Condense this LinkedIn post to around 70-90 words while keeping the hook, core value, and final CTA question strong.',
      Punchier:
        'Rewrite this LinkedIn post to be much bolder, sharper, and higher-impact with crisp 1-line sentences and stronger emotional punch.',
      'Add Stats':
        'Enhance this LinkedIn post by weaving in 1-2 realistic, relevant industry insights, percentages, or concrete numbers to boost credibility.',
      'Fix Grammar':
        'Polish the grammar, flow, and readability of this LinkedIn post so it reads like a native top LinkedIn creator wrote it, without changing the message.',
    };

    const refinePrompt = `You are an expert LinkedIn Editor.
Task: ${instructionsMap[action]}

Rules:
- Keep clean spacing with blank lines between short paragraphs.
- Do NOT use markdown stars (** or *).
- Return ONLY the updated LinkedIn post text, nothing else.

Original Post:
"""
${generatedPost}
"""`;

    try {
      const refined = await callFastAI(refinePrompt);
      setGeneratedPost(refined);
    } catch (err: any) {
      alert('Refine Failed: ' + (err?.message || 'Please try again.'));
    } finally {
      setIsRefining(false);
      setActiveRefineAction('');
    }
  };

  // 3 Viral Hook Variations Generator & One-Click Apply
  const handleGenerateHooks = async () => {
    const sourceText = topic.trim() || generatedPost.trim();
    if (!sourceText) {
      alert('Enter a topic or generate a post first to create viral hooks!');
      return;
    }

    if (!checkAndIncrementUsage()) return;

    setIsGeneratingHooks(true);
    const hookPrompt = `You are a viral LinkedIn Hook Copywriter.
Based on the topic/post below, write 3 distinct, scroll-stopping opening hooks (each 1-2 short lines, max 18 words):
1. Question Hook (sparks curiosity or self-reflection)
2. Bold Claim / Contrarian Hook (challenges common belief)
3. Story / Personal Lesson Hook (creates instant emotional pull)

Strict Rules:
- Return ONLY the 3 hooks separated by "|||" (three pipe characters).
- No numbering, no labels like "Question Hook:", no markdown (** or *).

Topic / Post:
"""
${sourceText}
"""`;

    try {
      const rawHooks = await callFastAI(hookPrompt);
      const parsedHooks = rawHooks
        .split('|||')
        .map((h) => h.replace(/^\d+[\.\)]\s*/, '').trim())
        .filter(Boolean)
        .slice(0, 3);

      if (parsedHooks.length > 0) {
        setHooks(parsedHooks);
      } else {
        alert('Could not parse hooks, please click Viral Hooks again.');
      }
    } catch (err: any) {
      alert('Hook Generation Failed: ' + (err?.message || 'Please try again.'));
    } finally {
      setIsGeneratingHooks(false);
    }
  };

  const handleApplyHook = (selectedHook: string) => {
    if (!generatedPost.trim()) {
      setGeneratedPost(selectedHook);
      return;
    }
    const paragraphs = generatedPost.split(/\n\s*\n/);
    if (paragraphs.length > 1) {
      paragraphs[0] = selectedHook;
      setGeneratedPost(paragraphs.join('\n\n'));
    } else {
      setGeneratedPost(`${selectedHook}\n\n${generatedPost}`);
    }
  };

  const handleCopy = () => {
    if (!generatedPost) return;
    navigator.clipboard.writeText(generatedPost);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePostToLinkedIn = () => {
    if (!generatedPost.trim()) return;
    navigator.clipboard.writeText(generatedPost);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
    window.open(
      'https://www.linkedin.com/feed/?shareActive=true',
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleSavePost = async () => {
    if (!generatedPost.trim() || !user) return;
    if (!isPro && savedPosts.length >= 5) {
      setIsSubModalOpen(true);
      return;
    }

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
      {/* Subscription Pricing Modal */}
      <SubscriptionModal
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        isPro={isPro}
        onUpgradeToPro={handleUpgradeToPro}
        onDowngradeToFree={handleDowngradeToFree}
        remainingFreeUses={remainingFreeUses}
        userEmail={user?.email}
      />

      {/* Navbar */}
      <header className="border-b border-slate-800/80 bg-[#0F1629]/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🚀</span>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              LinkedIn Post Generator
            </h1>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Subscription Badge / Upgrade Button */}
            {isPro ? (
              <button
                onClick={() => setIsSubModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold transition cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>PRO PLAN</span>
              </button>
            ) : (
              <button
                onClick={() => setIsSubModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-extrabold shadow-sm transition cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Upgrade ({remainingFreeUses}/3 Left)</span>
              </button>
            )}

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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-sm font-medium transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Input Form & Viral Hooks */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
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
                      setHooks([]);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
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
                      setTopic(
                        'Just launched my new full-stack web app after weeks of late-night coding!'
                      )
                    }
                    className="text-xs px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                  >
                    🚀 Project Launch
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setTopic(
                        '3 lessons I learned while preparing for tech interviews as a developer'
                      )
                    }
                    className="text-xs px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                  >
                    💼 Job / Career Tip
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setTopic(
                        'Why building projects in public helped me grow faster than just watching tutorials'
                      )
                    }
                    className="text-xs px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
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
                      <option value="Professional & Insightful">
                        💼 Professional & Insightful
                      </option>
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

                {/* Primary Generate + Viral Hooks Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-60 font-semibold text-white shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Sparkles className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
                    <span>{isGenerating ? 'Writing your post...' : '⚡ Generate Post'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateHooks}
                    disabled={isGeneratingHooks}
                    className="py-3.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 disabled:opacity-60 font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
                    title="Generate 3 scroll-stopping opening hooks"
                  >
                    <Zap className={`w-4 h-4 ${isGeneratingHooks ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingHooks ? 'Creating Hooks...' : '3 Viral Hooks'}</span>
                  </button>
                </div>
              </form>

              {/* 3 Viral Hook Variations Box */}
              {hooks.length > 0 && (
                <div className="mt-5 p-4 rounded-xl bg-[#0B0F19] border border-amber-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" /> Click a Hook to Apply on Top
                    </span>
                    <button
                      type="button"
                      onClick={() => setHooks([])}
                      className="text-[11px] text-slate-500 hover:text-slate-300"
                    >
                      Close
                    </button>
                  </div>

                  <div className="space-y-2">
                    {hooks.map((hookText, idx) => {
                      const labels = ['❓ Question Hook', '🔥 Bold Claim', '📖 Story Hook'];
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleApplyHook(hookText)}
                          className="w-full text-left p-3 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 transition group cursor-pointer"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-semibold text-amber-400/90">
                              {labels[idx] || `Hook #${idx + 1}`}
                            </span>
                            <span className="text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 transition">
                              Use this hook →
                            </span>
                          </div>
                          <p className="text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                            {hookText}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live LinkedIn Preview, Rewrite Toolbar & Direct Share */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span>👀</span> Live LinkedIn Preview
              </h2>

              {generatedPost && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition cursor-pointer"
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-xs font-medium text-indigo-300 border border-indigo-500/40 transition cursor-pointer"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{saveSuccess ? 'Saved!' : isSaving ? 'Saving...' : 'Save'}</span>
                  </button>

                  <button
                    onClick={handlePostToLinkedIn}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A66C2] hover:bg-[#004182] text-xs font-semibold text-white shadow-sm transition cursor-pointer"
                    title="Copies post to clipboard & opens LinkedIn composer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post to LinkedIn</span>
                  </button>
                </div>
              )}
            </div>

            {/* One-Click AI Rewrite Toolbar */}
            {generatedPost && (
              <div className="mb-4 p-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mr-1">
                  <Wand2 className="w-3.5 h-3.5 text-indigo-400" /> AI Refine:
                </span>
                {(['Shorter', 'Punchier', 'Add Stats', 'Fix Grammar'] as const).map((action) => (
                  <button
                    key={action}
                    type="button"
                    disabled={isRefining}
                    onClick={() => handleRefinePost(action)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-indigo-600/30 text-slate-200 hover:text-indigo-200 border border-slate-700 hover:border-indigo-500/40 disabled:opacity-50 transition cursor-pointer"
                  >
                    {isRefining && activeRefineAction === action ? 'Refining...' : action}
                  </button>
                ))}
              </div>
            )}

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
                        className="text-slate-500 hover:text-red-400 transition cursor-pointer"
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
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium self-start transition cursor-pointer"
                  >
                    Load into Preview →
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      {/* Footer with Legal Policies */}
      <footer className="w-full border-t border-slate-800/80 bg-[#0B0F19] py-6 px-4 mt-12 text-center text-xs text-slate-400">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 LinkedIn Post AI. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a
              href="/terms.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-400 transition"
            >
              Terms & Conditions
            </a>
            <a
              href="/privacy.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-400 transition"
            >
              Privacy Policy
            </a>
            <a
              href="mailto:shubhamsingh01205@gmail.com"
              className="hover:text-indigo-400 transition"
            >
              Contact Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}