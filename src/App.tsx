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

  // NEW ENTERPRISE CORE: Brand Matrix Global States
  const [targetPersona, setTargetPersona] = useState('B2B Tech Founders');
  const [brandLink, setBrandLink] = useState('yourwebsite.com/grow');

  const [charCount, setCharCount] = useState(0);
  const [hashtagCount, setHashtagCount] = useState(0);
  const [viralityScore, setViralityScore] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('linkedin_swipe_file');
    if (saved) setSavedPosts(JSON.parse(saved));
    
    // Auto load previous brand configuration if existing
    const savedPersona = localStorage.getItem('brand_persona');
    const savedLink = localStorage.getItem('brand_link');
    if (savedPersona) setTargetPersona(savedPersona);
    if (savedLink) setBrandLink(savedLink);
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
    setLoading(true);
    
    // Fetch raw baseline structure
    let post = await generateLinkedInPostFromAI(topic, style) as string;
    
    // ENTERPRISE INJECTION LOGIC: Smoothly customize the post using Brand Matrix context
    if (style === "Deep Storytelling") {
      post = post.replace("What's your biggest roadblock", `If you are targeting ${targetPersona}, what's your biggest roadblock`);
      post = post.replace("Let's fix it below.", `Let's fix it at ${brandLink}`);
    } else if (style === "Corporate Professional") {
      post = post.replace("How is your enterprise", `How are fellow ${targetPersona} enterprise networks`);
      post = post.replace("Let's connect.", `Let's deep dive here: ${brandLink}`);
    } else {
      // Default / Justin Welsh style appended personalized anchor hook
      post += `\n\nP.S. Helping ${targetPersona} automate this setup at ${brandLink}`;
    }

    setGeneratedPost(post);
    setLoading(false);
  };

  const handleSavePost = () => {
    if (!generatedPost) return;
    const newPost: SavedPost = {
      id: Date.now().toString(),
      topic: topic || 'Custom Topic',
      content: generatedPost,
      date: new Date().toLocaleDateString()
    };
    const updated = [newPost, ...savedPosts];
    setSavedPosts(updated);
    localStorage.setItem('linkedin_swipe_file', JSON.stringify(updated));
    alert('Post committed to locally cached backup! 🚀');
  };

  const handleSaveBrandMatrix = () => {
    localStorage.setItem('brand_persona', targetPersona);
    localStorage.setItem('brand_link', brandLink);
    alert('Brand Matrix synchronization active! 👑');
  };

  const handleDeleteSaved = (id: string) => {
    const updated = savedPosts.filter(p => p.id !== id);
    setSavedPosts(updated);
    localStorage.setItem('linkedin_swipe_file', JSON.stringify(updated));
  };

  const handleClearAllSwipe = () => {
    if (window.confirm('Clear all saved premium templates from your session?')) {
      setSavedPosts([]);
      localStorage.removeItem('linkedin_swipe_file');
    }
  };

  const handleExportData = () => {
    if (savedPosts.length === 0) return alert('Your swipe file is empty. Nothing to export!');
    let backupText = `=== LINKEDIN CREATOR SUITE SWIPE FILE BACKUP ===\nExported on: ${new Date().toLocaleString()}\n\n`;
    savedPosts.forEach((post, index) => {
      backupText += `-------------------------------------------\n`;
      backupText += `POST #${index + 1} | Topic: ${post.topic} | Saved on: ${post.date}\n`;
      backupText += `-------------------------------------------\n\n`;
      backupText += `${post.content}\n\n\n`;
    });
    const blob = new Blob([backupText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `LinkedIn_SwipeFile_Backup_${new Date().toISOString().slice(0,10)}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#0d1527] text-white font-sans p-6">
      {/* Header */}
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            LinkedIn Post AI Pro
          </h1>
          <p className="text-xs text-gray-400">Advanced Content Engine v4.0 (Brand Matrix Suite)</p>
        </div>
        <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-xs font-bold px-3 py-1 rounded-full text-black shadow-lg">
          👑 SaaS Premium Mode
        </span>
      </header>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side Inputs Configuration Panel */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Main Parameters Panel */}
          <div className="bg-[#111c35] p-6 rounded-2xl border border-gray-800 shadow-xl">
            <h4 className="text-xs font-bold uppercase text-blue-400 tracking-wider mb-4">🎯 Generation Parameters</h4>
            <div className="mb-4">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                📦 Content Topic
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., UI/UX design trends"
                className="w-full bg-[#090f1d] border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all text-white"
              />
            </div>

            <div className="mb-6">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                🎭 Premium Creator Style
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full bg-[#090f1d] border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all text-white"
              >
                <option value="Insightful Essay">Insightful Essay (Standard)</option>
                <option value="Justin Welsh Style">Justin Welsh Style (Viral Minimalist) 🔥</option>
                <option value="Deep Storytelling">Deep Storytelling (Broetry Framework) 📖</option>
                <option value="Corporate Professional">Corporate Executive Tone 💼</option>
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2"
            >
              {loading ? <span className="inline-block animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span> : '✨ Generate AI Post'}
            </button>
          </div>

          {/* BRAND MATRIX CONTROL DECK */}
          <div className="bg-[#111c35] p-6 rounded-2xl border border-gray-800 shadow-xl border-t-2 border-t-amber-500/50">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-bold uppercase text-amber-400 tracking-wider">🏢 Global Brand Matrix</h4>
              <button onClick={handleSaveBrandMatrix} className="text-[10px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded hover:bg-gray-700 border border-gray-700">Lock</button>
            </div>
            
            <div className="mb-4">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Target Persona</label>
              <input
                type="text"
                value={targetPersona}
                onChange={(e) => setTargetPersona(e.target.value)}
                placeholder="e.g., Early Stage Founders"
                className="w-full bg-[#090f1d] border border-gray-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">CTA Anchor / URL</label>
              <input
                type="text"
                value={brandLink}
                onChange={(e) => setBrandLink(e.target.value)}
                placeholder="e.g., portfolio.com"
                className="w-full bg-[#090f1d] border border-gray-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 text-white"
              />
            </div>
          </div>

        </div>

        {/* Right Side Workstation Panel */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Customization Console */}
          <div className="bg-[#111c35] p-6 rounded-2xl border border-gray-800 shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Post Customization Panel</h3>
                {generatedPost && <p className="text-[10px] text-emerald-400 mt-0.5">✍️ Interactive Mode Active: Click anywhere inside the post to edit</p>}
              </div>
              {generatedPost && (
                <div className="flex gap-2">
                  <button onClick={handleSavePost} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all">
                    💾 Save to Swipe File
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(generatedPost); alert('Copied!'); }} className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all">
                    Copy Post
                  </button>
                </div>
              )}
            </div>

            {/* Performance Analytics Block */}
            {generatedPost && (
              <div className="grid grid-cols-3 gap-4 mb-4 bg-[#090f1d] p-3 rounded-xl border border-gray-800">
                <div className="text-center">
                  <p className="text-[10px] uppercase text-gray-500 font-bold">Characters</p>
                  <p className={`text-base font-bold ${charCount > 3000 ? 'text-red-400' : 'text-blue-400'}`}>{charCount} / 3000</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase text-gray-500 font-bold">Hashtags</p>
                  <p className={`text-base font-bold ${hashtagCount > 5 ? 'text-orange-400' : 'text-emerald-400'}`}>{hashtagCount} <span className="text-xs font-normal text-gray-500">(Optimal 3-5)</span></p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase text-gray-500 font-bold">Virality Score</p>
                  <p className="text-base font-bold text-amber-400">{viralityScore}% 🔥</p>
                </div>
              </div>
            )}

            {generatedPost ? (
              <textarea
                value={generatedPost}
                onChange={(e) => setGeneratedPost(e.target.value)}
                rows={14}
                className="w-full bg-[#090f1d] p-5 rounded-xl border border-gray-800 text-sm leading-relaxed text-gray-200 font-mono focus:outline-none focus:border-blue-500/50 resize-y transition-all"
                placeholder="Edit your AI generation here..."
              />
            ) : (
              <div className="text-center py-16 text-gray-500 border border-dashed border-gray-800 rounded-xl bg-[#090f1d]/50">
                <p className="text-lg">Your Sandbox is Empty</p>
                <p className="text-xs mt-1">Configure parameters and hit generate to spin the content core.</p>
              </div>
            )}
          </div>

          {/* Swipe File Dashboard Dashboard */}
          <div className="bg-[#111c35] p-6 rounded-2xl border border-gray-800 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                📂 Your Premium Swipe File ({savedPosts.length} Saved)
              </h3>
              {savedPosts.length > 0 && (
                <div className="flex gap-2">
                  <button onClick={handleExportData} className="text-xs bg-blue-950 text-blue-400 hover:bg-blue-900 border border-blue-900 px-3 py-1 rounded transition-all font-semibold">
                    📥 Export Backup (.txt)
                  </button>
                  <button onClick={handleClearAllSwipe} className="text-xs bg-red-950/40 text-red-400 hover:bg-red-900/60 border border-red-900/50 px-2 py-1 rounded transition-all">
                    🗑️ Clear All
                  </button>
                </div>
              )}
            </div>
            
            {savedPosts.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No posts saved yet. Generate and click "Save to Swipe File" to lock your content matrix.</p>
            ) : (
              <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
                {savedPosts.map((post) => (
                  <div key={post.id} className="bg-[#090f1d] p-4 rounded-xl border border-gray-800 relative group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-900">
                        Topic: {post.topic}
                      </span>
                      <div className="flex gap-2">
                        <button onClick={() => { navigator.clipboard.writeText(post.content); alert('Copied!'); }} className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded text-gray-300">
                          Copy
                        </button>
                        <button onClick={() => handleDeleteSaved(post.id)} className="text-xs bg-red-950 text-red-400 hover:bg-red-900 px-2 py-1 rounded border border-red-900">
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 whitespace-pre-wrap font-sans line-clamp-3 group-hover:line-clamp-none transition-all">
                      {post.content}
                    </p>
                    <span className="text-[10px] text-gray-600 block mt-2 text-right">Saved on: {post.date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
<div style={{ marginTop: '20px', textAlign: 'center', paddingBottom: '20px' }}>
   <a className="github-button" 
      href="https://github.com/shubham-tech12/linked-post-generator" 
      data-color-scheme="no-preference: light; light: light; dark: dark;" 
      data-icon="octicon-star" 
      data-size="large" 
      data-show-count="true"
      aria-label="Star shubham-tech12/linked-post-generator on GitHub">
      Star
   </a>
</div>

export default App;