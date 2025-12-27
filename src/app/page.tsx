'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Tv, BookOpen, Library, Star, Zap, Shield, Database, Activity, Wifi, Crosshair, Cpu, Monitor, Smartphone } from 'lucide-react';
import AuthButton from '@/components/AuthButton';
import { libraryData, animeData, mangaData } from '@/data';

export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Stats State
  const [libraryStats, setLibraryStats] = useState({ owned: 0, total: 0, percentage: 0 });
  const [animeStats, setAnimeStats] = useState({ watched: 0, total: 0, percentage: 0 });
  const [mangaStats, setMangaStats] = useState({ read: 0, total: 0, percentage: 0 });

  // TV Login State
  const [showTvLogin, setShowTvLogin] = useState(false);
  const [tvCode, setTvCode] = useState<string | null>(null);

  // Current Time for the HUD
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    // 1. Timer
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
    }, 1000);

    // 2. Check User & Stats
    const checkUserAndStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // --- Fetch Library Stats ---
        const { count: libCount } = await supabase.from('user_library').select('*', { count: 'exact', head: true });
        const libOwned = libCount || 0;
        const libTotal = libraryData.length;
        setLibraryStats({ owned: libOwned, total: libTotal, percentage: libTotal > 0 ? Math.round((libOwned / libTotal) * 100) : 0 });

        // --- Fetch Anime Stats ---
        const { count: animeCount } = await supabase.from('user_anime').select('*', { count: 'exact', head: true }).eq('is_watched', true);
        const watched = animeCount || 0;
        const animeTotal = animeData.filter((i: any) => i.type === 'episode' || i.type === 'movie').length;
        setAnimeStats({ watched, total: animeTotal, percentage: animeTotal > 0 ? Math.round((watched / animeTotal) * 100) : 0 });

        // --- Fetch Manga Stats ---
        const { count: mangaCount } = await supabase.from('user_manga').select('*', { count: 'exact', head: true }).eq('is_read', true);
        const read = mangaCount || 0;
        const mangaTotal = mangaData.length;
        setMangaStats({ read, total: mangaTotal, percentage: mangaTotal > 0 ? Math.round((read / mangaTotal) * 100) : 0 });
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

  // --- TV LOGIN LOGIC ---
  const generateTvCode = async () => {
    // Generate a random 6-character code (A-Z, 0-9)
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setTvCode(code);

    // Insert into DB
    await supabase.from('tv_codes').insert({ code });

    // Listen for updates to this specific code
    const channel = supabase.channel(`tv_login_${code}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tv_codes', filter: `code=eq.${code}` },
        async (payload) => {
          if (payload.new.refresh_token) {
            // WE GOT THE TOKEN! Login the TV.
            const { error } = await supabase.auth.setSession({
              refresh_token: payload.new.refresh_token,
              access_token: payload.new.refresh_token // Supabase will auto-refresh if valid
            });

            if (!error) {
              window.location.reload(); // Refresh to load the dashboard
            }
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  // --- RANK LOGIC ---
  const getRank = (pct: number) => {
    if (pct === 100) return { label: 'PLUS ULTRA', color: 'text-pink-500', stars: 5 };
    if (pct >= 80) return { label: 'LEGENDARY', color: 'text-pink-400', stars: 5 };
    if (pct >= 60) return { label: 'HEROIC', color: 'text-purple-400', stars: 4 };
    if (pct >= 40) return { label: 'RARE', color: 'text-blue-400', stars: 3 };
    if (pct >= 20) return { label: 'UNCOMMON', color: 'text-green-400', stars: 2 };
    return { label: 'NOVICE', color: 'text-slate-400', stars: 1 };
  };

  const libRank = getRank(libraryStats.percentage);
  const animeRank = getRank(animeStats.percentage);
  const mangaRank = getRank(mangaStats.percentage);

  // --- FOIL LOGIC ---
  const getFoilClass = (pct: number) => {
    if (pct === 100) return 'bg-foil-rainbow opacity-80 animate-[shimmer_2s_linear_infinite]';
    if (pct >= 50) return 'bg-foil-silver opacity-50 animate-[shimmer_3s_linear_infinite]';
    return 'hidden';
  };

  const libFoil = getFoilClass(libraryStats.percentage);
  const animeFoil = getFoilClass(animeStats.percentage);
  const mangaFoil = getFoilClass(mangaStats.percentage);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-500 font-mono">INITIALIZING SYSTEM...</div>;

  if (!user) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden font-sans text-white">
        <div className="absolute inset-0 bg-tech-grid opacity-20"></div>

        {/* TV Login Modal / Overlay */}
        {showTvLogin && (
          <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
            <div className="w-full max-w-md bg-slate-900 border border-cyan-500/50 p-8 rounded-2xl relative shadow-[0_0_50px_rgba(6,182,212,0.2)]">
              <button onClick={() => setShowTvLogin(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white font-mono">X_CLOSE</button>

              <h2 className="text-2xl font-black italic uppercase text-cyan-400 mb-6 flex items-center gap-2">
                <Monitor className="animate-pulse" /> DEVICE_LINK
              </h2>

              <div className="text-center space-y-6">
                <p className="text-slate-400 text-sm">
                  On your phone or computer, go to:
                  <br />
                  <span className="text-white font-mono bg-slate-800 px-2 py-1 rounded mt-2 block">myheroarchive.vercel.app/activate</span>
                </p>

                <div className="py-6">
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">ENTER CODE</p>
                  {tvCode ? (
                    <div className="text-5xl md:text-6xl font-black tracking-widest text-yellow-400 font-mono shadow-cyan-500/50 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
                      {tvCode}
                    </div>
                  ) : (
                    <div className="text-cyan-500/50 animate-pulse text-sm font-mono">GENERATING UPLINK...</div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-mono">
                  <Activity size={12} className="animate-spin" /> WAITING FOR SIGNAL...
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="relative z-10 flex flex-col items-center text-center p-6 animate-[fadeIn_1s_ease-out]">
          <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(250,204,21,0.4)]">
            <span className="text-slate-900 font-black text-3xl">UA</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-4">Welcome Hero</h1>
          <p className="text-slate-400 text-lg max-w-md mb-8">Access the ultimate archive of My Hero Academia. Sign in to track your progress.</p>

          <div className="scale-125 mb-8"><AuthButton allowSignIn={true} /></div>

          {/* New TV Login Button */}
          <button
            onClick={() => {
              setShowTvLogin(true);
              generateTvCode();
            }}
            className="flex items-center gap-2 text-cyan-500 hover:text-cyan-400 font-mono text-sm tracking-widest border border-cyan-500/30 hover:border-cyan-500 px-4 py-2 rounded-full transition-all hover:bg-cyan-500/10"
          >
            <Monitor size={16} /> LOGIN ON TV / CONSOLE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col relative overflow-hidden font-sans text-white">

      {/* UI Layers */}
      <div className="absolute inset-0 bg-tech-grid opacity-20 pointer-events-none"></div>
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent h-[20%] w-full animate-scanline pointer-events-none"></div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-10">
        <div className="w-[800px] h-[800px] border border-cyan-500/30 rounded-full animate-spin-slow border-dashed"></div>
        <div className="absolute w-[600px] h-[600px] border border-yellow-500/20 rounded-full animate-spin-reverse"></div>
        <div className="absolute w-[400px] h-[400px] border border-pink-500/20 rounded-full animate-spin-slow opacity-30"></div>
      </div>

      {/* Blueprint Background */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none mix-blend-screen">
        <img src="/hud.png" alt="Schematic Background" className="w-full h-full object-cover" />
      </div>

      {/* --- AUTH BUTTON (RESTORED) --- */}
      <div className="absolute top-6 right-6 z-50">
        <AuthButton />
      </div>

      {/* HUD Elements */}
      <div className="absolute top-0 left-0 p-8 z-10 hidden md:block pointer-events-none">
        <div className="flex items-center gap-2 text-cyan-400 mb-1"><Activity size={16} className="animate-pulse" /><span className="font-mono text-xs tracking-widest">SYSTEM ONLINE</span></div>
        <div className="h-20 w-20 border-l-2 border-t-2 border-cyan-500/50 rounded-tl-xl"></div>
      </div>
      <div className="absolute bottom-0 left-0 p-8 z-10 hidden md:block pointer-events-none">
        <div className="h-20 w-20 border-l-2 border-b-2 border-emerald-500/50 rounded-bl-xl"></div>
        <div className="flex items-center gap-2 text-emerald-400 mt-1"><Cpu size={16} /><span className="font-mono text-xs tracking-widest">CORE: STABLE</span></div>
      </div>
      <div className="absolute bottom-0 right-0 p-8 z-10 hidden md:block pointer-events-none text-right">
        <div className="h-20 w-20 border-r-2 border-b-2 border-pink-500/50 rounded-br-xl float-right"></div>
        <div className="flex items-center justify-end gap-2 text-pink-400 mt-1 clear-both"><span className="font-mono text-xl tracking-widest font-bold">{time} UTC</span></div>
      </div>

      {/* Main Content */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center p-4">

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

          {/* 1. ANIME CARD */}
          <button onClick={() => router.push('/anime')} className="group relative h-[400px] w-full bg-slate-900/80 backdrop-blur-sm rounded-3xl border border-yellow-500/30 hover:border-yellow-400 transition-all duration-500 hover:-translate-y-4 hover:shadow-[0_0_30px_rgba(250,204,21,0.3)] overflow-hidden">
            <div className="absolute inset-0 bg-tech-grid opacity-10"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/10 to-transparent opacity-50 group-hover:opacity-80 transition-opacity"></div>
            <div className={`absolute inset-0 z-0 pointer-events-none ${animeFoil}`}></div>

            <div className="relative z-10 h-full flex flex-col justify-between p-6">
              <div className="flex justify-between items-start">
                <div className={`bg-yellow-500 text-black font-black text-xs px-2 py-1 rounded-sm uppercase tracking-tighter font-mono shadow-lg ${animeRank.stars === 5 ? 'animate-pulse' : ''}`}>{animeRank.label}</div>
                <div className="flex gap-1">{[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} className={`${i <= animeRank.stars ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />)}</div>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center border-2 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)] group-hover:scale-110 transition-transform duration-300">
                  <Tv size={32} className="text-yellow-400" />
                </div>
                <h2 className="mt-6 text-3xl font-black italic uppercase text-white group-hover:text-yellow-400 transition-colors">Anime</h2>
              </div>

              <div className="bg-slate-950/80 rounded-sm p-3 border-l-2 border-yellow-500">
                <div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-1"><span className="flex items-center gap-1"><Database size={10} /> WATCHED</span><span className="text-yellow-400 font-bold">{animeStats.watched} / {animeStats.total}</span></div>
                <div className="flex justify-between items-center text-xs font-mono text-slate-400"><span className="flex items-center gap-1"><Shield size={10} /> STATUS</span><span className="text-green-400 font-bold">ONGOING</span></div>
                <div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden"><div className="bg-yellow-400 h-full transition-all duration-1000 ease-out" style={{ width: `${animeStats.percentage}%` }}></div></div>
              </div>
            </div>
          </button>

          {/* 2. MANGA CARD */}
          <button onClick={() => router.push('/manga')} className="group relative h-[400px] w-full bg-slate-900/80 backdrop-blur-sm rounded-3xl border border-emerald-500/30 hover:border-emerald-400 transition-all duration-500 hover:-translate-y-4 hover:shadow-[0_0_30px_rgba(52,211,153,0.3)] overflow-hidden">
            <div className="absolute inset-0 bg-tech-grid opacity-10"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent opacity-50 group-hover:opacity-80 transition-opacity"></div>
            <div className={`absolute inset-0 z-0 pointer-events-none ${mangaFoil}`}></div>

            <div className="relative z-10 h-full flex flex-col justify-between p-6">
              <div className="flex justify-between items-start">
                <div className={`bg-emerald-500 text-black font-black text-xs px-2 py-1 rounded-sm uppercase tracking-tighter font-mono shadow-lg ${mangaRank.stars === 5 ? 'animate-pulse' : ''}`}>{mangaRank.label}</div>
                <div className="flex gap-1">{[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} className={`${i <= mangaRank.stars ? 'text-emerald-400 fill-emerald-400' : 'text-slate-600'}`} />)}</div>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center border-2 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)] group-hover:scale-110 transition-transform duration-300">
                  <BookOpen size={32} className="text-emerald-400" />
                </div>
                <h2 className="mt-6 text-3xl font-black italic uppercase text-white group-hover:text-emerald-400 transition-colors">Manga</h2>
              </div>

              <div className="bg-slate-950/80 rounded-sm p-3 border-l-2 border-emerald-500">
                <div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-1"><span className="flex items-center gap-1"><Database size={10} /> READ</span><span className="text-emerald-400 font-bold">{mangaStats.read} / {mangaStats.total}</span></div>
                <div className="flex justify-between items-center text-xs font-mono text-slate-400"><span className="flex items-center gap-1"><Shield size={10} /> STATUS</span><span className="text-green-400 font-bold">ONGOING</span></div>
                <div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden"><div className="bg-emerald-400 h-full transition-all duration-1000 ease-out" style={{ width: `${mangaStats.percentage}%` }}></div></div>
              </div>
            </div>
          </button>

          {/* 3. LIBRARY CARD */}
          <button onClick={() => router.push('/library')} className="group relative h-[400px] w-full bg-slate-900/80 backdrop-blur-sm rounded-3xl border border-pink-500/30 hover:border-pink-500 transition-all duration-500 hover:-translate-y-4 hover:shadow-[0_0_30px_rgba(236,72,153,0.3)] overflow-hidden">
            <div className="absolute inset-0 bg-tech-grid opacity-10"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-pink-500/10 to-transparent opacity-50 group-hover:opacity-80 transition-opacity"></div>
            <div className={`absolute inset-0 z-0 pointer-events-none ${libFoil}`}></div>

            <div className="relative z-10 h-full flex flex-col justify-between p-6">
              <div className="flex justify-between items-start">
                <div className={`bg-pink-500 text-white font-black text-xs px-2 py-1 rounded-sm uppercase tracking-tighter font-mono shadow-lg ${libRank.stars === 5 ? 'animate-pulse' : ''}`}>{libRank.label}</div>
                <div className="flex gap-1">{[1, 2, 3, 4, 5].map(i => (<Star key={i} size={12} className={`${i <= libRank.stars ? 'text-pink-400 fill-pink-400' : 'text-slate-600'}`} />))}</div>
              </div>
              <div className="flex flex-col items-center"><div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center border-2 border-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.5)] group-hover:scale-110 transition-transform duration-300"><Library size={32} className="text-pink-400" /></div><h2 className="mt-6 text-3xl font-black italic uppercase text-white group-hover:text-pink-400 transition-colors">Archive</h2></div>
              <div className="bg-slate-950/80 rounded-sm p-3 border-l-2 border-pink-500"><div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-1"><span className="flex items-center gap-1"><Database size={10} /> OWNED</span><span className="text-pink-400 font-bold">{libraryStats.owned} / {libraryStats.total}</span></div><div className="flex justify-between items-center text-xs font-mono text-slate-400"><span className="flex items-center gap-1"><Shield size={10} /> STATUS</span><span className={`font-bold ${libRank.color}`}>{libRank.label}</span></div><div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden"><div className="bg-pink-500 h-full transition-all duration-1000 ease-out" style={{ width: `${libraryStats.percentage}%` }}></div></div></div>
            </div>
          </button>

        </div>
      </div>

      {/* --- IZUKU PEEKING COMPONENT --- */}
      <div className="fixed bottom-0 right-0 z-50 overflow-hidden pointer-events-none">
        <div onClick={() => router.push('/characters')} className="relative translate-x-16 translate-y-16 group cursor-pointer pointer-events-auto">
          {/* Bubble */}
          <div className="absolute bottom-full translate-x-(-40) right-[45%] mb-[-5px] transform scale-0 group-hover:scale-100 transition-transform duration-300 origin-bottom-right drop-shadow-lg">
            <img src="/comic-bubble.png" alt="Psstt.." className="w-32 h-auto" />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[65%] text-black font-black italic text-base">Psstt..</span>
          </div>
          {/* Deku */}
          <img src="/izuku-peek.webp" alt="Izuku" className="w-24 md:w-32 h-auto object-contain transform transition-all duration-500 ease-out drop-shadow-2xl rotate-[-20deg] group-hover:translate-x-4 group-hover:translate-y-4 group-hover:rotate-[-20deg]" />
        </div>
      </div>


      {/* Footer System Status */}
      <div className="relative z-20 pb-4 text-slate-600 text-[10px] font-mono text-center uppercase tracking-[0.3em] opacity-50">
        UA High Server /// Secure Connection Established
      </div>
    </div>
  );
}