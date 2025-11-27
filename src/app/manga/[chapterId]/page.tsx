'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Home, BookOpen, ScrollText, ArrowLeft, ArrowRight } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function MangaReader() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();
    const chapterId = params.chapterId as string;

    const [pages, setPages] = useState<{ id: string; src: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // --- AUDIO REF ---
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // --- PRELOAD REF ---
    const preloadRef = useRef<HTMLImageElement[]>([]);

    // --- VIEW MODE STATE ---
    const [viewMode, setViewMode] = useState<'waterfall' | 'book'>('waterfall');
    const [bookIndex, setBookIndex] = useState(0);

    // --- FLIP ANIMATION STATE ---
    const [isFlipping, setIsFlipping] = useState(false);
    const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null);

    // --- 0. Initialize Audio ---
    useEffect(() => {
        audioRef.current = new Audio('/sounds/page-flip.mp3');
        audioRef.current.volume = 0.5; // Adjustable volume
    }, []);

    const playFlipSound = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch((e) => console.error("Audio play failed:", e));
        }
    };

    // --- 1. Fetch User ---
    useEffect(() => {
        setMounted(true);
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setUserId(user.id);
        };
        getUser();
    }, [supabase]);

    // --- 2. Fetch Pages from API ---
    useEffect(() => {
        const fetchPages = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/manga/pages?chapter=${chapterId}`);
                if (!res.ok) throw new Error('Failed to fetch pages');

                const data = await res.json();
                setPages(data.pages);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        if (chapterId) fetchPages();
    }, [chapterId]);

    // --- 3. INTELLIGENT PRELOADING ---
    useEffect(() => {
        if (!pages || pages.length === 0) return;

        // Preload next 10 pages
        const PRELOAD_BUFFER = 10;

        const start = bookIndex;
        const end = Math.min(bookIndex + PRELOAD_BUFFER, pages.length);

        for (let i = start; i < end; i++) {
            const src = pages[i].src;
            // Check if we already have this image object to avoid duplicates
            const alreadyLoaded = preloadRef.current.some(img => img.src === src);

            if (!alreadyLoaded) {
                const img = new Image();
                img.src = src;
                preloadRef.current.push(img);
            }
        }

        // Cleanup: Remove images far behind to save memory
        if (preloadRef.current.length > 20) {
            preloadRef.current = preloadRef.current.slice(-20);
        }

    }, [bookIndex, pages]);

    // --- 4. Mark as Read Function ---
    const markAsRead = async () => {
        if (!userId) return;
        await supabase.from('user_manga').upsert({
            user_id: userId,
            chapter_id: chapterId,
            is_read: true
        }, { onConflict: 'user_id, chapter_id' });
    };

    // --- 5. Auto-Mark when reaching bottom (Waterfall only) ---
    useEffect(() => {
        if (viewMode !== 'waterfall') return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loading && pages.length > 0) {
                    markAsRead();
                }
            },
            { threshold: 0.5 }
        );

        if (bottomRef.current) observer.observe(bottomRef.current);
        return () => observer.disconnect();
    }, [loading, pages, userId, viewMode]);

    // Navigation Helper
    const handleNav = (dir: 'next' | 'prev') => {
        if (dir === 'next') markAsRead();
        const nextId = dir === 'next' ? Number(chapterId) + 1 : Number(chapterId) - 1;
        router.push(`/manga/${nextId}`);
    };

    // --- BOOK MODE LOGIC (SMOOTH 3D FLIP) ---
    const flipPage = useCallback((dir: 'next' | 'prev') => {
        if (isFlipping) return;

        if (dir === 'next') {
            if (bookIndex < pages.length - 1) {
                playFlipSound(); // Play Sound
                setFlipDirection('next');
                setIsFlipping(true);

                // Matches CSS duration (600ms)
                setTimeout(() => {
                    setBookIndex(prev => prev + 2);
                    setIsFlipping(false);
                    setFlipDirection(null);
                }, 600);
            } else {
                markAsRead();
            }
        } else {
            if (bookIndex > 0) {
                playFlipSound(); // Play Sound
                setFlipDirection('prev');
                setIsFlipping(true);

                setTimeout(() => {
                    setBookIndex(prev => Math.max(0, prev - 2));
                    setIsFlipping(false);
                    setFlipDirection(null);
                }, 600);
            }
        }
    }, [bookIndex, pages.length, isFlipping]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (viewMode === 'book') {
                if (e.key === 'ArrowLeft') flipPage('next');
                if (e.key === 'ArrowRight') flipPage('prev');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [viewMode, flipPage]);


    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center overflow-x-hidden">

            {/* HEADER */}
            <div className="fixed top-0 left-0 right-0 h-16 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-between px-4 border-b border-white/10 shadow-xl">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/manga')} className="p-2 hover:bg-white/10 rounded-full text-white">
                        <ChevronLeft />
                    </button>
                    <span className="font-black italic uppercase text-white tracking-widest hidden md:block">Chapter {chapterId}</span>
                </div>
                <button onClick={() => router.push('/')} className="p-2 hover:bg-white/10 rounded-full text-white">
                    <Home size={20} />
                </button>
            </div>

            {/* VIEW MODE TOGGLE (Fixed Below Header) */}
            <div className="fixed top-20 right-4 z-40 flex bg-slate-800/90 backdrop-blur-sm rounded-full p-1 border border-white/10 shadow-lg">
                <button
                    onClick={() => setViewMode('waterfall')}
                    className={`px-4 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold uppercase transition-all ${viewMode === 'waterfall' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    <ScrollText size={14} /> <span className="hidden sm:inline">Scroll</span>
                </button>
                <button
                    onClick={() => { setViewMode('book'); setBookIndex(0); }}
                    className={`px-4 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold uppercase transition-all ${viewMode === 'book' ? 'bg-pink-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    <BookOpen size={14} /> <span className="hidden sm:inline">Book</span>
                </button>
            </div>

            {/* === READER CONTENT === */}
            <div className="w-full h-full min-h-screen pt-20 pb-32 flex flex-col items-center justify-center">

                {loading && (
                    <div className="flex flex-col items-center justify-center mt-20 gap-4">
                        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <div className="text-emerald-500 font-mono animate-pulse">DECRYPTING ARCHIVE...</div>
                    </div>
                )}

                {/* MODE 1: WATERFALL */}
                {!loading && viewMode === 'waterfall' && (
                    <>
                        <div className="w-full max-w-3xl flex flex-col gap-0">
                            {pages.map((page, index) => (
                                <img
                                    key={page.id}
                                    src={page.src}
                                    alt={page.id}
                                    className="w-full h-auto object-contain bg-slate-900"
                                    loading={index < 3 ? "eager" : "lazy"}
                                />
                            ))}
                        </div>
                        <div ref={bottomRef} className="h-10 w-full"></div>
                    </>
                )}

                {/* MODE 2: 3D BOOK (RTL FIXED) */}
                {!loading && viewMode === 'book' && pages.length > 0 && (
                    <div className="relative w-full h-[85vh] flex items-center justify-center select-none overflow-hidden">

                        {/* --- TAP ZONES --- */}
                        {/* Left Side = NEXT PAGE (Manga) */}
                        <div onClick={() => flipPage('next')} className="absolute left-0 top-0 w-1/4 h-full z-30 cursor-w-resize group flex items-center justify-start pl-4">
                            <div className="bg-black/50 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-white/10"><ArrowLeft className="text-white" /></div>
                        </div>
                        {/* Right Side = PREV PAGE (Manga) */}
                        <div onClick={() => flipPage('prev')} className="absolute right-0 top-0 w-1/4 h-full z-30 cursor-e-resize group flex items-center justify-end pr-4">
                            <div className="bg-black/50 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-white/10"><ArrowRight className="text-white" /></div>
                        </div>

                        {/* --- BOOK CONTAINER --- */}
                        <div className="relative w-full max-w-6xl h-full flex justify-center items-center" style={{ perspective: '2000px' }}>

                            {/* STATIC BASE LAYER (Corrected Order: [ P2 | P1 ]) */}
                            <div className="absolute flex w-full h-full justify-center items-center">
                                {/* LEFT SIDE (Visual Left) */}
                                <div className="w-1/2 h-full flex justify-end bg-slate-900 border-r border-white/5 relative">
                                    {isFlipping ? (
                                        flipDirection === 'next' ? (
                                            // IF FLIPPING NEXT: Show Page 4 underneath
                                            pages[bookIndex + 3] ? <img src={pages[bookIndex + 3].src} className="h-full w-auto object-contain mx-auto shadow-2xl" /> : null
                                        ) : (
                                            // IF FLIPPING PREV: Show Page 2 underneath (Returning)
                                            pages[bookIndex + 1] ? <img src={pages[bookIndex + 1].src} className="h-full w-auto object-contain mx-auto shadow-2xl" /> : null
                                        )
                                    ) : (
                                        // STATIC: Show Page 2
                                        pages[bookIndex + 1] ? <img src={pages[bookIndex + 1].src} className="h-full w-auto object-contain mx-auto shadow-2xl" /> : null
                                    )}
                                </div>

                                {/* RIGHT SIDE (Visual Right) */}
                                <div className="w-1/2 h-full flex justify-start bg-slate-900 border-l border-white/5 relative">
                                    {isFlipping ? (
                                        flipDirection === 'next' ? (
                                            // IF FLIPPING NEXT: Show Page 1 (Stay until covered)
                                            pages[bookIndex] ? <img src={pages[bookIndex].src} className="h-full w-auto object-contain mx-auto shadow-2xl" /> : null
                                        ) : (
                                            // IF FLIPPING PREV: Show Page -1? (Prev Page 2)
                                            pages[bookIndex - 2] ? <img src={pages[bookIndex - 2].src} className="h-full w-auto object-contain mx-auto shadow-2xl" /> : null
                                        )
                                    ) : (
                                        // STATIC: Show Page 1
                                        pages[bookIndex] ? <img src={pages[bookIndex].src} className="h-full w-auto object-contain mx-auto shadow-2xl" /> : null
                                    )}
                                </div>
                            </div>

                            {/* --- FLIPPER LAYER --- */}
                            {isFlipping && (
                                <div
                                    className="absolute h-full w-1/2"
                                    style={{
                                        transformStyle: 'preserve-3d',
                                        transformOrigin: flipDirection === 'next' ? 'right center' : 'left center',
                                        transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)', // Easing function for smoother "lag-free" flip
                                        transform: flipDirection === 'next' ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                        left: flipDirection === 'next' ? '0' : '50%',
                                        zIndex: 50,
                                        willChange: 'transform' // Performance optimization
                                    }}
                                >
                                    {/* FRONT FACE */}
                                    <div
                                        className="absolute inset-0 w-full h-full bg-slate-900 backface-hidden flex justify-center items-center border-r border-white/10"
                                        style={{ backfaceVisibility: 'hidden' }}
                                    >
                                        {flipDirection === 'next' ? (
                                            // FLIPPING NEXT: Front is Page 2 (Left Page)
                                            pages[bookIndex + 1] ? <img src={pages[bookIndex + 1].src} className="h-full w-auto object-contain shadow-2xl" /> : null
                                        ) : (
                                            // FLIPPING PREV: Front is Page 0 (Old Right Page)
                                            pages[bookIndex - 1] ? <img src={pages[bookIndex - 1].src} className="h-full w-auto object-contain shadow-2xl" /> : null
                                        )}
                                    </div>

                                    {/* BACK FACE */}
                                    <div
                                        className="absolute inset-0 w-full h-full bg-slate-900 backface-hidden flex justify-center items-center border-l border-white/10"
                                        style={{
                                            backfaceVisibility: 'hidden',
                                            transform: 'rotateY(180deg)'
                                        }}
                                    >
                                        {flipDirection === 'next' ? (
                                            // FLIPPING NEXT: Back is Page 3 (New Right Page)
                                            pages[bookIndex + 2] ? <img src={pages[bookIndex + 2].src} className="h-full w-auto object-contain shadow-2xl" /> : null
                                        ) : (
                                            // FLIPPING PREV: Back is Page 1 (Current Right Page)
                                            pages[bookIndex] ? <img src={pages[bookIndex].src} className="h-full w-auto object-contain shadow-2xl" /> : null
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* CENTER SPINE SHADOW */}
                            <div className="absolute left-1/2 top-0 bottom-0 w-8 -ml-4 bg-gradient-to-r from-transparent via-black/40 to-transparent z-40 pointer-events-none"></div>
                        </div>

                        {/* Progress Bar */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 px-4 py-2 rounded-full border border-white/10 z-40">
                            <span className="text-white font-mono text-xs">
                                {bookIndex + 1}-{Math.min(bookIndex + 2, pages.length)} / {pages.length}
                            </span>
                        </div>
                    </div>
                )}

                {/* STATIC NAVIGATION (Waterfall only) */}
                {viewMode === 'waterfall' && (
                    <div className="w-full max-w-3xl grid grid-cols-2 gap-4 mt-12 px-4">
                        <button
                            onClick={() => handleNav('prev')}
                            disabled={Number(chapterId) <= 1}
                            className="py-4 rounded-xl bg-slate-800 text-white font-bold uppercase tracking-widest hover:bg-emerald-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => handleNav('next')}
                            className="py-4 rounded-xl bg-emerald-500 text-white font-bold uppercase tracking-widest hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
                        >
                            Next Chapter
                        </button>
                    </div>
                )}
            </div>

            {/* Floating Nav - Always visible now */}
            {mounted && createPortal(
                <div className="fixed bottom-8 right-8 md:right-24 z-[100] flex items-center gap-2 pointer-events-auto">
                    <button
                        onClick={() => handleNav('prev')}
                        disabled={Number(chapterId) <= 1}
                        className="p-4 rounded-full bg-slate-800 text-white shadow-lg hover:bg-emerald-500 border-2 border-white/10 disabled:opacity-50 transition-all active:scale-95"
                        title="Previous Chapter"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={() => handleNav('next')}
                        className="p-4 rounded-full bg-emerald-500 text-white shadow-lg hover:bg-emerald-400 border-2 border-white/20 transition-all active:scale-95"
                        title="Next Chapter"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>,
                document.body
            )}
        </div>
    );
}