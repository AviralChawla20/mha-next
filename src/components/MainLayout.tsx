'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home as HomeIcon, Tv, BookOpen, Library, ArrowUp } from 'lucide-react';
import AuthButton from './AuthButton';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const mainRef = useRef<HTMLElement>(null);

    const isHome = pathname === '/';
    const isWatch = pathname.startsWith('/watch');
    const isAnime = pathname === '/anime';
    const isManga = pathname === '/manga';
    const isLibrary = pathname === '/library';

    const getBgClass = () => {
        if (isAnime) return 'bg-[conic-gradient(at_center,_var(--tw-gradient-stops))] from-yellow-500 via-slate-900 to-yellow-500';
        if (isManga) return 'bg-[conic-gradient(at_center,_var(--tw-gradient-stops))] from-emerald-500 via-slate-900 to-emerald-500';
        if (isLibrary) return 'bg-[conic-gradient(at_center,_var(--tw-gradient-stops))] from-pink-500 via-slate-900 to-pink-500';
        return 'bg-slate-900';
    };

    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const mainElement = mainRef.current;
        if (!mainElement) return;

        const handleScroll = () => {
            setShowScrollTop(mainElement.scrollTop > 300);
        };

        mainElement.addEventListener('scroll', handleScroll);
        return () => mainElement.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        if (mainRef.current) {
            mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="h-screen w-full bg-slate-900 overflow-hidden font-sans text-white selection:bg-red-600 selection:text-white relative">

            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            <div className={`absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none transition-all duration-700 ${getBgClass()}`}></div>

            {/* --- CHANGE 1: Header is now FIXED to the top of the viewport --- */}
            {!isHome && !isWatch && (
                <header className="fixed top-0 left-0 right-0 z-50 flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-slate-950/80 backdrop-blur-md border-b border-white/10 shadow-xl">

                    <Link href="/" className="flex items-center gap-3 mb-4 md:mb-0 cursor-pointer group">
                        <div className={`p-2 rounded-full ${isAnime ? 'bg-yellow-400' : isManga ? 'bg-emerald-500' : 'bg-pink-500'} text-slate-900 font-black text-xl group-hover:scale-110 transition-transform`}>
                            UA
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter uppercase italic text-white" style={{ textShadow: '2px 2px 0px #e11d48' }}>
                                My Hero <span className={isAnime ? 'text-yellow-400' : isManga ? 'text-emerald-500' : 'text-pink-500'}>
                                    {isLibrary ? 'Archive' : 'Timeline'}
                                </span>
                            </h1>
                            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold group-hover:text-white transition-colors">Return Home</p>
                        </div>
                    </Link>

                    {/* Navigation Section */}
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors border border-white/10" title="Go Home">
                            <HomeIcon size={20} />
                        </Link>

                        <div className="flex p-1 bg-slate-800 rounded-full border border-white/10 shadow-inner">
                            <Link href="/anime" className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full font-bold uppercase text-xs transition-all duration-300 ${isAnime ? 'bg-yellow-400 text-black shadow-lg scale-105' : 'text-slate-400 hover:text-white'}`}>
                                <Tv size={14} /> <span className="hidden md:inline">Anime</span>
                            </Link>
                            <Link href="/manga" className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full font-bold uppercase text-xs transition-all duration-300 ${isManga ? 'bg-emerald-500 text-black shadow-lg scale-105' : 'text-slate-400 hover:text-white'}`}>
                                <BookOpen size={14} /> <span className="hidden md:inline">Manga</span>
                            </Link>
                            <Link href="/library" className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full font-bold uppercase text-xs transition-all duration-300 ${isLibrary ? 'bg-pink-500 text-white shadow-lg scale-105' : 'text-slate-400 hover:text-white'}`}>
                                <Library size={14} /> <span className="hidden md:inline">Archive</span>
                            </Link>
                        </div>

                        {/* Auth Button */}
                        <div className="hidden md:block border-l border-white/10 pl-4 min-w-[50px]">
                            <AuthButton allowSignIn={false} />
                        </div>

                    </div>
                </header>
            )}

            {/* --- CHANGE 2: Main container has Padding Top (pt-24) to account for fixed header --- */}
            <main
                ref={mainRef}
                className={`relative z-10 w-full h-full overflow-y-auto scroll-smooth perspective-container hide-scrollbar ${!isHome && !isWatch ? 'pt-24 md:pt-28' : ''}`}
            >
                {children}
            </main>

            <button
                onClick={scrollToTop}
                className={`fixed bottom-8 right-8 z-30 p-4 rounded-full bg-red-600 text-white shadow-lg transition-all duration-500 hover:bg-red-500 hover:scale-110 active:scale-95 border-4 border-white ${showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
            >
                <ArrowUp size={24} strokeWidth={3} />
            </button>
        </div>
    );
}