'use client'; // <--- CRITICAL: This tells Next.js this file has interactivity

import React from 'react';
import { useRouter } from 'next/navigation'; // Changed from 'react-router-dom'
import { Tv, BookOpen, Library, ChevronRight } from 'lucide-react';

export default function Home() {
  // Changed: Next.js uses useRouter, not useNavigate
  const router = useRouter();

  const izukuImg = "https://i.ibb.co/kVfwwv7p/Izuku-Midoriya.png";
  const allMightImg = "https://i.ibb.co/Y4mSbpt6/Adobe-Express-file.png";

  return (
    <div className="min-h-screen w-full bg-slate-900 flex flex-col relative overflow-hidden font-sans text-white">
      {/* Background effects */}
      <div className="absolute inset-0 z-0 bg-[conic-gradient(at_center,_var(--tw-gradient-stops))] from-yellow-500/20 via-slate-900 to-emerald-500/20 animate-pulse"></div>
      <div className="absolute inset-0 z-0 opacity-10 bg-[radial-gradient(#ffffff_1px,_transparent_1px)] bg-[size:20px_20px]"></div>

      {/* Character Images */}
      <div className="absolute bottom-0 left-0 md:-left-10 w-1/2 md:w-1/3 h-2/3 md:h-full z-10 opacity-80 pointer-events-none transition-transform hover:scale-105 duration-700">
        {/* Note: We are keeping standard <img> tags for simplicity with external URLs */}
        <img src={izukuImg} alt="Izuku" className="w-full h-full object-contain object-bottom drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
      </div>
      <div className="absolute bottom-0 right-0 md:-right-10 w-1/2 md:w-1/3 h-2/3 md:h-full z-10 opacity-80 pointer-events-none transition-transform hover:scale-105 duration-700">
        <img src={allMightImg} alt="All Might" className="w-full h-full object-contain object-bottom drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
      </div>

      {/* Main Content */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center p-4 text-center">
        <div className="mb-12 space-y-2 animate-[slideDown_1s_ease-out]">
          <h2 className="text-yellow-400 font-black tracking-widest uppercase text-xl md:text-2xl drop-shadow-md">
            The Ultimate Guide
          </h2>
          <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-tight" style={{ textShadow: '4px 4px 0px #e11d48, -2px -2px 0px #0f172a' }}>
            My Hero Academia<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-yellow-400">
              All You Need to Know
            </span>
          </h1>
          <div className="h-1 w-32 mx-auto bg-white rounded-full mt-4"></div>
        </div>

        {/* Navigation Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mx-auto z-30 px-4">

          {/* Anime Button */}
          <button
            onClick={() => router.push('/anime')} // Changed: navigate -> router.push
            className="group relative bg-gradient-to-br from-yellow-400 to-orange-500 p-1 rounded-2xl transform transition-all duration-300 hover:scale-105 hover:rotate-1 shadow-xl hover:shadow-yellow-400/30"
          >
            <div className="bg-slate-900 h-full w-full rounded-xl px-6 py-6 flex flex-col items-start justify-between group-hover:bg-slate-800 transition-colors min-h-[140px]">
              <div className="w-full flex justify-between items-start mb-2">
                <Tv className="text-yellow-400" size={32} strokeWidth={2} />
                <ChevronRight className="text-yellow-400 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
              </div>
              <div className="text-left">
                <p className="text-yellow-400 text-[10px] font-bold uppercase tracking-widest mb-1">Watch Order</p>
                <h3 className="text-2xl font-black uppercase italic text-white group-hover:text-yellow-400 transition-colors">Anime</h3>
              </div>
            </div>
          </button>

          {/* Manga Button */}
          <button
            onClick={() => router.push('/manga')}
            className="group relative bg-gradient-to-br from-emerald-400 to-teal-500 p-1 rounded-2xl transform transition-all duration-300 hover:scale-105 hover:-rotate-1 shadow-xl hover:shadow-emerald-400/30"
          >
            <div className="bg-slate-900 h-full w-full rounded-xl px-6 py-6 flex flex-col items-start justify-between group-hover:bg-slate-800 transition-colors min-h-[140px]">
              <div className="w-full flex justify-between items-start mb-2">
                <BookOpen className="text-emerald-400" size={32} strokeWidth={2} />
                <ChevronRight className="text-emerald-400 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
              </div>
              <div className="text-left">
                <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-1">Read Order</p>
                <h3 className="text-2xl font-black uppercase italic text-white group-hover:text-emerald-400 transition-colors">Manga</h3>
              </div>
            </div>
          </button>

          {/* Library Button */}
          <button
            onClick={() => router.push('/library')}
            className="group relative bg-gradient-to-br from-pink-500 to-purple-500 p-1 rounded-2xl transform transition-all duration-300 hover:scale-105 hover:rotate-1 shadow-xl hover:shadow-pink-500/30"
          >
            <div className="bg-slate-900 h-full w-full rounded-xl px-6 py-6 flex flex-col items-start justify-between group-hover:bg-slate-800 transition-colors min-h-[140px]">
              <div className="w-full flex justify-between items-start mb-2">
                <Library className="text-pink-400" size={32} strokeWidth={2} />
                <ChevronRight className="text-pink-400 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
              </div>
              <div className="text-left">
                <p className="text-pink-400 text-[10px] font-bold uppercase tracking-widest mb-1">Archive</p>
                <h3 className="text-2xl font-black uppercase italic text-white group-hover:text-pink-400 transition-colors">Library</h3>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="relative z-20 pb-4 text-slate-500 text-xs font-mono text-center uppercase">
        Plus Ultra Archives © 2025
      </div>
    </div>
  );
}