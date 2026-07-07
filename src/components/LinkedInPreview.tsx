// src/components/LinkedInPreview.tsx
import React, { useState, useRef } from 'react';
import { toBold, toItalic } from '../utils/textFormatter';

interface LinkedInPreviewProps {
  text: string;
  setText: (text: string) => void;
  userName?: string;
  userTitle?: string;
}

export const LinkedInPreview: React.FC<LinkedInPreviewProps> = ({
  text,
  setText,
  userName = "Aapka Naam",
  userTitle = "LinkedIn Content Creator | Software Engineer"
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null); // State update aur focus track karne ke liye ref use kiya

  const handleFormat = (type: 'bold' | 'italic') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    // Agar kuch select nahi kiya toh text change mat karo
    if (start === end) return; 

    const selectedText = text.substring(start, end);
    const formattedText = type === 'bold' ? toBold(selectedText) : toItalic(selectedText);
    
    const newText = text.substring(0, start) + formattedText + text.substring(end);
    
    // State update
    setText(newText);

    // UX Fix: Taaki text change hote hi selection vahi bani rahe aur user continuous editing kar sake
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + formattedText.length);
    }, 50);
  };

  const shouldShowSeeMore = text.length > 200;
  const displayText = isExpanded ? text : text.substring(0, 200);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-900">
      
      {/* LEFT SIDE: Editor & Formatting Toolbar */}
      <div className="flex flex-col gap-2">
        <label className="font-semibold text-xs text-slate-400 uppercase tracking-wider">Edit & Format Your Post</label>
        
        {/* Dark Theme Toolbar */}
        <div className="flex gap-2 bg-slate-950 p-2 rounded-t-xl border border-slate-800">
          <button 
            type="button"
            onClick={() => handleFormat('bold')}
            className="px-3 py-1 bg-slate-800 text-white font-bold border border-slate-700 rounded hover:bg-slate-700 text-sm transition active:scale-95"
            title="Bold Selection"
          >
            B
          </button>
          <button 
            type="button"
            onClick={() => handleFormat('italic')}
            className="px-3 py-1 bg-slate-800 text-white italic border border-slate-700 rounded hover:bg-slate-700 text-sm transition active:scale-95"
            title="Italic Selection"
          >
            I
          </button>
        </div>

        {/* Dark Theme Textarea */}
        <textarea
          ref={textareaRef} // Attach Ref here
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-72 p-4 bg-slate-950 text-slate-200 border border-t-0 border-slate-800 rounded-b-xl focus:outline-none focus:border-blue-500 transition resize-none text-sm leading-relaxed"
          placeholder="Yahan aapka generated content dikhega..."
        />
        <div className="text-right text-[11px] text-slate-500 font-medium">
          Character Count: {text.length}
        </div>
      </div>

      {/* RIGHT SIDE: Real-time LinkedIn Feed Preview */}
      <div className="flex flex-col gap-2">
        <label className="font-semibold text-xs text-slate-400 uppercase tracking-wider">LinkedIn Feed Preview</label>
        
        {/* LinkedIn Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 font-sans text-[14px] text-gray-900 max-h-[340px] overflow-y-auto custom-scrollbar">
          
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-sky-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
              {userName[0]}
            </div>
            <div>
              <div className="font-semibold text-gray-950 hover:text-blue-600 hover:underline cursor-pointer text-sm">
                {userName}
              </div>
              <div className="text-[11px] text-gray-500 max-w-[220px] truncate leading-tight">
                {userTitle}
              </div>
              <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                <span>1h • </span>
                <span>🌐</span>
              </div>
            </div>
          </div>

          {/* Post Content */}
          <div className="whitespace-pre-wrap break-words leading-relaxed text-[13.5px]">
            {displayText}
            {shouldShowSeeMore && !isExpanded && (
              <button 
                onClick={() => setIsExpanded(true)}
                className="text-gray-500 font-semibold ml-1 hover:text-blue-600 hover:underline"
              >
                ...see more
              </button>
            )}
          </div>

          {/* Dummy Social Bar */}
          <div className="mt-4 pt-2 border-t border-gray-100 flex justify-between text-gray-500 font-semibold text-[11px]">
            <span className="flex items-center gap-1 cursor-pointer p-1.5 hover:bg-gray-50 rounded">👍 Like</span>
            <span className="flex items-center gap-1 cursor-pointer p-1.5 hover:bg-gray-50 rounded">💬 Comment</span>
            <span className="flex items-center gap-1 cursor-pointer p-1.5 hover:bg-gray-50 rounded">🔁 Repost</span>
            <span className="flex items-center gap-1 cursor-pointer p-1.5 hover:bg-gray-50 rounded">🚀 Send</span>
          </div>

        </div>
      </div>

    </div>
  );
};