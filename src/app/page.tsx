'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Tv, BookOpen, Library, Star, Zap, Shield, Database, Activity, Wifi, Crosshair, Cpu } from 'lucide-react';
import AuthButton from '@/components/AuthButton';
import { libraryData } from '@/data';


export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [libraryStats, setLibraryStats] = useState({ owned: 0, total: 0, percentage: 0 });

  // Current Time for the HUD
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    // Clock for HUD
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
    }, 1000);

    const checkUserAndStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { count } = await supabase.from('user_library').select('*', { count: 'exact', head: true });
        const owned = count || 0;
        const total = libraryData.length;
        const percentage = total > 0 ? Math.round((owned / total) * 100) : 0;
        setLibraryStats({ owned, total, percentage });
      }
      setLoading(false);
    };

    checkUserAndStats();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => {
      subscription.unsubscribe();
      clearInterval(timer);
    };
  }, [supabase]);

  // Rank & Foil Helpers
  const getLibraryRank = (pct: number) => {
    if (pct === 100) return { label: 'PLUS ULTRA', color: 'text-pink-500', stars: 5 };
    if (pct >= 80) return { label: 'LEGENDARY', color: 'text-pink-400', stars: 5 };
    if (pct >= 60) return { label: 'HEROIC', color: 'text-purple-400', stars: 4 };
    if (pct >= 40) return { label: 'RARE', color: 'text-blue-400', stars: 3 };
    if (pct >= 20) return { label: 'UNCOMMON', color: 'text-green-400', stars: 2 };
    return { label: 'NOVICE', color: 'text-slate-400', stars: 1 };
  };
  const rank = getLibraryRank(libraryStats.percentage);

  const getFoilClass = (pct: number) => {
    if (pct === 100) return 'bg-foil-rainbow opacity-80 animate-[shimmer_2s_linear_infinite]';
    if (pct >= 40) return 'bg-foil-silver opacity-50 animate-[shimmer_3s_linear_infinite]';
    return 'hidden';
  };
  const foilClass = getFoilClass(libraryStats.percentage);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-500 font-mono">INITIALIZING SYSTEM...</div>;

  // --- LOGGED OUT STATE ---
  if (!user) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden font-sans text-white">
        <div className="absolute inset-0 bg-tech-grid opacity-20"></div>
        <div className="relative z-10 flex flex-col items-center text-center p-6 animate-[fadeIn_1s_ease-out]">
          <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(250,204,21,0.4)]">
            <span className="text-slate-900 font-black text-3xl">UA</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-4">Welcome Hero</h1>
          <p className="text-slate-400 text-lg max-w-md mb-8">Access the ultimate archive of My Hero Academia. Sign in to track your progress.</p>
          <div className="scale-125"><AuthButton allowSignIn={true} /></div>
        </div>
      </div>
    );
  }

  // --- DASHBOARD (MISSION CONTROL) ---
  // Removed the character image URLs

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col relative overflow-hidden font-sans text-white">

      {/* ======================= */}
      {/* 1. MISSION CONTROL UI LAYERS */}
      {/* ======================= */}

      {/* Base Grid */}
      <div className="absolute inset-0 bg-tech-grid opacity-20 pointer-events-none"></div>

      {/* Moving Scanline */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent h-[20%] w-full animate-scanline pointer-events-none"></div>

      {/* Rotating HUD Rings (Center) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-10">
        <div className="w-[800px] h-[800px] border border-cyan-500/30 rounded-full animate-spin-slow border-dashed"></div>
        <div className="absolute w-[600px] h-[600px] border border-yellow-500/20 rounded-full animate-spin-reverse"></div>
        <div className="absolute w-[400px] h-[400px] border border-pink-500/20 rounded-full animate-spin-slow opacity-30"></div>
      </div>

      {/* ---> NEW: Schematic/Blueprint Background Layer <--- */}
      {/* This is a subtle layer for a tech blueprint or map. Replace the src with your preferred image! */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none mix-blend-screen">
        <img
          src="/hud.png" // Placeholder sci-fi blueprint
          alt="Schematic Background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* HUD Corners */}
      <div className="absolute top-0 left-0 p-8 z-10 hidden md:block pointer-events-none">
        <div className="flex items-center gap-2 text-cyan-400 mb-1">
          <Activity size={16} className="animate-pulse" />
          <span className="font-mono text-xs tracking-widest">SYSTEM ONLINE</span>
        </div>
        <div className="h-20 w-20 border-l-2 border-t-2 border-cyan-500/50 rounded-tl-xl"></div>
      </div>

      {/* ---> REMOVED TOP RIGHT HUD ELEMENT to make space for profile <--- */}

      <div className="absolute bottom-0 left-0 p-8 z-10 hidden md:block pointer-events-none">
        <div className="h-20 w-20 border-l-2 border-b-2 border-emerald-500/50 rounded-bl-xl"></div>
        <div className="flex items-center gap-2 text-emerald-400 mt-1">
          <Cpu size={16} />
          <span className="font-mono text-xs tracking-widest">CORE: STABLE</span>
        </div>
      </div>
      <div className="absolute bottom-0 right-0 p-8 z-10 hidden md:block pointer-events-none text-right">
        <div className="h-20 w-20 border-r-2 border-b-2 border-pink-500/50 rounded-br-xl float-right"></div>
        <div className="flex items-center justify-end gap-2 text-pink-400 mt-1 clear-both">
          <span className="font-mono text-xl tracking-widest font-bold">{time} UTC</span>
        </div>
      </div>

      {/* ======================= */}
      {/* 2. MAIN CONTENT (CARDS) */}
      {/* ======================= */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center p-4">

        {/* Header Title with HUD lines */}
        <div className="mb-8 md:mb-12 text-center animate-[slideDown_1s_ease-out] relative">
          <div className="absolute top-1/2 left-[-50px] w-12 h-[1px] bg-cyan-500 hidden md:block"></div>
          <div className="absolute top-1/2 right-[-50px] w-12 h-[1px] bg-cyan-500 hidden md:block"></div>

          <h2 className="text-yellow-400 font-black tracking-widest uppercase text-lg md:text-xl drop-shadow-md flex items-center justify-center gap-2">
            <Crosshair size={16} className="text-cyan-400" /> DATABASE_ACCESS
          </h2>
          <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none text-white" style={{ textShadow: '0 0 20px rgba(0, 255, 255, 0.5)' }}>
            CHOOSE TARGET
          </h1>
        </div>

        {/* CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto px-4 perspective-container">

          {/* ANIME CARD */}
          <button onClick={() => router.push('/anime')} className="group relative h-[400px] w-full bg-slate-900/80 backdrop-blur-sm rounded-3xl border border-yellow-500/30 hover:border-yellow-400 transition-all duration-500 hover:-translate-y-4 hover:shadow-[0_0_30px_rgba(250,204,21,0.3)] overflow-hidden">
            <div className="absolute inset-0 bg-tech-grid opacity-10"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/10 to-transparent opacity-50 group-hover:opacity-80 transition-opacity"></div>
            <div className="relative z-10 h-full flex flex-col justify-between p-6">
              <div className="flex justify-between items-start"><div className="bg-yellow-500 text-black font-black text-xs px-2 py-1 rounded-sm uppercase tracking-tighter font-mono">SSR-01</div><div className="flex gap-1">{[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />)}</div></div>
              <div className="flex flex-col items-center"><div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center border-2 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)] group-hover:scale-110 transition-transform duration-300"><Tv size={32} className="text-yellow-400" /></div><h2 className="mt-6 text-3xl font-black italic uppercase text-white group-hover:text-yellow-400 transition-colors">Anime</h2></div>
              <div className="bg-slate-950/80 rounded-sm p-3 border-l-2 border-yellow-500"><div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-1"><span>TYPE</span><span className="text-yellow-400 font-bold">MEDIA</span></div><div className="flex justify-between items-center text-xs font-mono text-slate-400"><span>STATUS</span><span className="text-green-400 font-bold">ONGOING</span></div><div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden"><div className="bg-yellow-400 h-full w-[80%]"></div></div></div>
            </div>
          </button>

          {/* MANGA CARD */}
          <button onClick={() => router.push('/manga')} className="group relative h-[400px] w-full bg-slate-900/80 backdrop-blur-sm rounded-3xl border border-emerald-500/30 hover:border-emerald-400 transition-all duration-500 hover:-translate-y-4 hover:shadow-[0_0_30px_rgba(52,211,153,0.3)] overflow-hidden">
            <div className="absolute inset-0 bg-tech-grid opacity-10"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent opacity-50 group-hover:opacity-80 transition-opacity"></div>
            <div className="relative z-10 h-full flex flex-col justify-between p-6">
              <div className="flex justify-between items-start"><div className="bg-emerald-500 text-black font-black text-xs px-2 py-1 rounded-sm uppercase tracking-tighter font-mono">UR-02</div><div className="flex gap-1">{[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} className="text-emerald-400 fill-emerald-400" />)}</div></div>
              <div className="flex flex-col items-center"><div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center border-2 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)] group-hover:scale-110 transition-transform duration-300"><BookOpen size={32} className="text-emerald-400" /></div><h2 className="mt-6 text-3xl font-black italic uppercase text-white group-hover:text-emerald-400 transition-colors">Manga</h2></div>
              <div className="bg-slate-950/80 rounded-sm p-3 border-l-2 border-emerald-500"><div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-1"><span>TYPE</span><span className="text-emerald-400 font-bold">SOURCE</span></div><div className="flex justify-between items-center text-xs font-mono text-slate-400"><span>STATUS</span><span className="text-green-400 font-bold">COMPLETE</span></div><div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden"><div className="bg-emerald-400 h-full w-[100%]"></div></div></div>
            </div>
          </button>

          {/* LIBRARY CARD (DYNAMIC) */}
          <button onClick={() => router.push('/library')} className="group relative h-[400px] w-full bg-slate-900/80 backdrop-blur-sm rounded-3xl border border-pink-500/30 hover:border-pink-500 transition-all duration-500 hover:-translate-y-4 hover:shadow-[0_0_30px_rgba(236,72,153,0.3)] overflow-hidden">
            <div className="absolute inset-0 bg-tech-grid opacity-10"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-pink-500/10 to-transparent opacity-50 group-hover:opacity-80 transition-opacity"></div>
            <div className={`absolute inset-0 z-0 pointer-events-none ${foilClass}`}></div>

            <div className="relative z-10 h-full flex flex-col justify-between p-6">
              <div className="flex justify-between items-start">
                <div className={`bg-pink-500 text-white font-black text-xs px-2 py-1 rounded-sm uppercase tracking-tighter font-mono shadow-lg ${rank.stars === 5 ? 'animate-pulse' : ''}`}>{rank.label}</div>
                <div className="flex gap-1">{[1, 2, 3, 4, 5].map(i => (<Star key={i} size={12} className={`${i <= rank.stars ? 'text-pink-400 fill-pink-400' : 'text-slate-600'}`} />))}</div>
              </div>
              <div className="flex flex-col items-center"><div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center border-2 border-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.5)] group-hover:scale-110 transition-transform duration-300"><Library size={32} className="text-pink-400" /></div><h2 className="mt-6 text-3xl font-black italic uppercase text-white group-hover:text-pink-400 transition-colors">Archive</h2></div>
              <div className="bg-slate-950/80 rounded-sm p-3 border-l-2 border-pink-500"><div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-1"><span className="flex items-center gap-1"><Database size={10} /> OWNED</span><span className="text-pink-400 font-bold">{libraryStats.owned} / {libraryStats.total}</span></div><div className="flex justify-between items-center text-xs font-mono text-slate-400"><span className="flex items-center gap-1"><Shield size={10} /> STATUS</span><span className={`font-bold ${rank.color}`}>{rank.label}</span></div><div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden"><div className="bg-pink-500 h-full transition-all duration-1000 ease-out" style={{ width: `${libraryStats.percentage}%` }}></div></div></div>
            </div>
          </button>

        </div>
      </div>

      {/* Footer System Status */}
      <div className="relative z-20 pb-4 text-slate-600 text-[10px] font-mono text-center uppercase tracking-[0.3em] opacity-50">
        UA High Server /// Secure Connection Established
      </div>
    </div>
  );
}