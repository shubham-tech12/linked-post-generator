import React, { useState, useEffect } from 'react';
import { generateLinkedInPostFromAI } from './gemini';

interface SavedPost {
  id: string;
  topic: string;
  content: string;
  date: string;
}

function App() {
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState('Insightful Essay');
  const [generatedPost, setGeneratedPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Monetization & Credits State
  const [credits, setCredits] = useState<number>(5);
  const [isPro, setIsPro] = useState<boolean>(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);

  // Brand Matrix Global States
  const [targetPersona, setTargetPersona] = useState('B2B Tech Founders');
  const [brandLink, setBrandLink] = useState('yourwebsite.com/grow');

  const [charCount, setCharCount] = useState(0);
  const [hashtagCount, setHashtagCount] = useState(0);
  const [viralityScore, setViralityScore] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('linkedin_swipe_file');
    if (saved) setSavedPosts(JSON.parse(saved));
    
    const savedPersona = localStorage.getItem('brand_persona');
    const savedLink = localStorage.getItem('brand_link');
    if (savedPersona) setTargetPersona(savedPersona);
    if (savedLink) setBrandLink(savedLink);

    // Load Credits & Pro Status
    const userCredits = localStorage.getItem('user_credits');
    const userPro = localStorage.getItem('is_pro');
    if (userCredits !== null) setCredits(parseInt(userCredits));
    else localStorage.setItem('user_credits', '5');
    if (userPro) setIsPro(JSON.parse(userPro));
  }, []);

  useEffect(() => {
    if (!generatedPost) {
      setCharCount(0);
      setHashtagCount(0);
      setViralityScore(0);
      return;
    }

    setCharCount(generatedPost.length);
    const hashtags = (generatedPost.match(/#/g) || []).length;
    setHashtagCount(hashtags);

    let score = 75; 
    if (generatedPost.includes('🚀') || generatedPost.includes('💡') || generatedPost.includes('🔥') || generatedPost.includes('🎯')) score += 10;
    if (hashtags >= 3 && hashtags <= 5) score += 10; 
    if (hashtags > 5) score -= 15; 
    if (generatedPost.length > 3000) score -= 30; 
    setViralityScore(Math.max(Math.min(score, 100), 10));
  }, [generatedPost]);

  const handleGenerate = async () => {
    if (!topic) return alert('Please enter a content topic!');
    
    // Check Free Credits Limit
    if (!isPro && credits <= 0) {
      setShowUpgradeModal(true);
      return;
    }

    setLoading(true);
    
    let post = await generateLinkedInPostFromAI(topic, style) as string;
    
    if (style === "Deep Storytelling") {
      post = post.replace("What's your biggest roadblock", `If you are targeting ${targetPersona}, what's your biggest roadblock`);
      post = post.replace("Let's fix it below.", `Let's fix it at ${brandLink}`);
    } else if (style === "Corporate Professional") {
      post = post.replace("How is your enterprise", `How are fellow ${targetPersona} enterprise networks`);
      post = post.replace("Let's connect.", `Let's deep dive here: ${brandLink}`);
    } else {
      post += `\n\nP.S. Helping ${targetPersona} automate this setup at ${brandLink}`;
    }

    setGeneratedPost(post);
    setLoading(false);
    setTopic('');

    // Deduct Credit if not Pro
    if (!isPro) {
      const newCredits = credits - 1;
      setCredits(newCredits);
      localStorage.setItem('user_credits', newCredits.toString());
    }
  };

  const handleSimulatePayment = () => {
    // Yahan apna Stripe ya Razorpay payment link dal sakte hain
    // window.location.href = "YOUR_STRIPE_OR_RAZORPAY_LINK";
    setIsPro(true);
    localStorage.setItem('is_pro', 'true');
    setShowUpgradeModal(false);
    alert('🎉 Congratulations! You are now a PRO member with Unlimited Generations.');
  };

  const handleSavePost = () => {
    if (!generatedPost) return;
    const newPost: SavedPost = {
      id: Date.now().toString(),
      topic: topic.trim() || generatedPost.slice(0, 30) + '...',
      content: generatedPost,
      date: new Date().toLocaleDateString()
    };
    const updated = [newPost, ...savedPosts];
    setSavedPosts(updated);
    localStorage.setItem('linkedin_swipe_file', JSON.stringify(updated));
    alert('Post saved to your Swipe File! 🚀');
  };

  const handleSaveBrandMatrix = () => {
    localStorage.setItem('brand_persona', targetPersona);
    localStorage.setItem('brand_link', brandLink);
    alert('Brand Matrix synchronized! 👑');
  };

  const handleDeleteSaved = (id: string) => {
    const updated = savedPosts.filter(p => p.id !== id);
    setSavedPosts(updated);
    localStorage.setItem('linkedin_swipe_file', JSON.stringify(updated));
  };

  return (
    <div className="flex h-screen bg-[#121212] text-gray-100 font-sans overflow-hidden relative">
      
      {/* UPGRADE MODAL PAYWALL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-amber-500/30 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 text-2xl mx-auto">👑</div>
            <h3 className="text-xl font-bold text-white">Unlock Unlimited AI Posts</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              You've exhausted your free credits. Upgrade to <span className="text-amber-400 font-semibold">LinkedIn AI Pro</span> to generate unlimited viral posts, advanced styles, and priority execution.
            </p>
            <div className="bg-[#121212] p-3 rounded-xl border border-gray-800 text-left space-y-2 text-xs">
              <div className="flex justify-between"><span>🔥 Unlimited Generations</span><span className="text-emerald-400">✓</span></div>
              <div className="flex justify-between"><span>🎨 All Creator Styles</span><span className="text-emerald-400">✓</span></div>
              <div className="flex justify-between"><span>⚡ Priority AI Processing</span><span className="text-emerald-400">✓</span></div>
            </div>
            <button 
              onClick={handleSimulatePayment}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold py-3 rounded-xl text-xs shadow-lg transition-all"
            >
              Upgrade for $9 / month (Stripe / Razorpay)
            </button>
            <button 
              onClick={() => setShowUpgradeModal(false)}
              className="text-gray-500 hover:text-gray-300 text-xs"
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}

      {/* 1. COLLAPSIBLE SIDEBAR */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 bg-[#171717] border-r border-gray-800 flex flex-col justify-between overflow-hidden`}>
        <div className="p-4 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              ✨ LinkedIn AI Pro
            </h2>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${isPro ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
              {isPro ? 'PRO 👑' : `${credits} Credits Left`}
            </span>
          </div>

          {!isPro && (
            <button 
              onClick={() => setShowUpgradeModal(true)}
              className="w-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 text-amber-400 border border-amber-500/30 rounded-xl py-2 px-3 text-xs font-semibold mb-3 flex items-center justify-center gap-1.5 transition-all"
            >
              <span>⭐</span> Upgrade to Pro ($9/mo)
            </button>
          )}

          <button 
            onClick={() => setGeneratedPost('')}
            className="w-full bg-[#212121] hover:bg-[#2f2f2f] text-gray-200 border border-gray-700/60 rounded-xl py-2.5 px-3 text-xs font-medium flex items-center gap-2 mb-3 transition-all"
          >
            <span>➕</span> New Post Session
          </button>

          {/* Style Selector inside Sidebar */}
          <div className="mb-3">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Creator Style</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full bg-[#212121] border border-gray-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Insightful Essay">Insightful Essay</option>
              <option value="Justin Welsh Style">Justin Welsh Style 🔥</option>
              <option value="Deep Storytelling">Deep Storytelling 📖</option>
              <option value="Corporate Professional">Corporate Executive 💼</option>
            </select>
          </div>

          {/* Brand Matrix Settings */}
          <div className="bg-[#212121] p-3 rounded-xl border border-gray-800 mb-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-amber-400 uppercase">Brand Matrix</span>
              <button onClick={handleSaveBrandMatrix} className="text-[9px] bg-gray-700 hover:bg-gray-600 px-2 py-0.5 rounded text-white">Save</button>
            </div>
            <div>
              <label className="block text-[9px] text-gray-400 mb-1">Target Persona</label>
              <input 
                type="text" 
                value={targetPersona} 
                onChange={(e) => setTargetPersona(e.target.value)}
                className="w-full bg-[#121212] border border-gray-700 rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[9px] text-gray-400 mb-1">CTA URL / Link</label>
              <input 
                type="text" 
                value={brandLink} 
                onChange={(e) => setBrandLink(e.target.value)}
                className="w-full bg-[#121212] border border-gray-700 rounded p-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Swipe File History List */}
          <div className="flex-1 overflow-y-auto space-y-2 mb-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Saved Swipe Files ({savedPosts.length})</p>
            {savedPosts.map((post) => (
              <div 
                key={post.id} 
                onClick={() => setGeneratedPost(post.content)}
                className="bg-[#212121] hover:bg-[#292929] p-2 rounded-lg border border-gray-800 text-xs cursor-pointer group flex justify-between items-center transition-all"
              >
                <span className="truncate text-gray-300 w-36 pointer-events-none">{post.topic}</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSaved(post.id);
                  }} 
                  className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] p-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* AFFILIATE / SPONSOR BANNER */}
          <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/20 p-2.5 rounded-xl text-center">
            <p className="text-[10px] font-semibold text-blue-300">💡 Sponsored Tool</p>
            <p className="text-[9px] text-gray-400 mt-0.5">Automate your social calendar with Buffer.</p>
            <a href="https://buffer.com" target="_blank" rel="noreferrer" className="inline-block mt-1.5 text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded font-medium">Explore Partner</a>
          </div>
        </div>
      </div>

      {/* 2. MAIN WORKSTATION */}
      <div className="flex-1 flex flex-col h-full bg-[#121212] relative">
        <div className="h-14 border-b border-gray-800 flex items-center justify-between px-6 bg-[#121212]/80 backdrop-blur z-10">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white text-sm bg-[#212121] border border-gray-800 p-2 rounded-lg transition-all"
          >
            {sidebarOpen ? '◀ Hide Sidebar' : '▶ Menu'}
          </button>
          <div className="text-xs font-semibold text-gray-300">
            Engine Mode: <span className="text-blue-400">{style}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6 pb-36">
          {!generatedPost && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
              <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 text-xl mb-3">✨</div>
              <h2 className="text-xl font-bold text-gray-200">What would you like to post about today?</h2>
              <p className="text-xs text-gray-400 mt-1">Type your topic below to generate high-converting LinkedIn content.</p>
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-3 text-gray-400 text-sm animate-pulse bg-[#1a1a1a] p-4 rounded-xl border border-gray-800 w-fit">
              <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
              Crafting your viral LinkedIn post...
            </div>
          )}

          {generatedPost && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 bg-[#171717] p-3 rounded-xl border border-gray-800">
                <div className="text-center">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Characters</span>
                  <p className={`text-sm font-bold ${charCount > 3000 ? 'text-red-400' : 'text-blue-400'}`}>{charCount} / 3000</p>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Hashtags</span>
                  <p className="text-sm font-bold text-emerald-400">{hashtagCount}</p>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Virality Score</span>
                  <p className="text-sm font-bold text-amber-400">{viralityScore}% 🔥</p>
                </div>
              </div>

              <div className="bg-[#171717] p-5 rounded-2xl border border-gray-800 relative group">
                <div className="absolute top-3 right-3 flex gap-2">
                  <button onClick={handleSavePost} className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 text-xs px-2.5 py-1 rounded-lg border border-emerald-500/30">Save</button>
                  <button onClick={() => { navigator.clipboard.writeText(generatedPost); alert('Copied!'); }} className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-2.5 py-1 rounded-lg">Copy</button>
                </div>
                <textarea
                  value={generatedPost}
                  onChange={(e) => setGeneratedPost(e.target.value)}
                  rows={12}
                  className="w-full bg-transparent text-gray-200 text-sm font-sans focus:outline-none resize-none leading-relaxed"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. FLOATING INPUT */}
        <div className="absolute bottom-6 left-0 right-0 px-6 z-20">
          <div className="max-w-3xl mx-auto bg-[#1a1a1a] border border-gray-700/70 rounded-full shadow-2xl p-2 flex items-center gap-3">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="Ask AI to write a post about..."
              className="flex-1 bg-transparent border-none px-4 py-2 text-sm text-white focus:outline-none placeholder-gray-500"
            />
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-full p-2.5 px-5 text-xs font-semibold shadow-md transition-all flex items-center gap-1.5"
            >
              <span>Generate</span> 🚀
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;