'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom'; // <--- 1. Import Portal
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';

export default function MangaReader() {
    const params = useParams();
    const router = useRouter();
    const chapterId = params.chapterId as string;

    const [pages, setPages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false); // <--- 2. Mount state for Portal

    // --- CONFIGURATION ---
    const IMAGEKIT_ENDPOINT = "https://ik.imagekit.io/mha/MHA";

    // Helper to pad numbers with zeros (e.g., 1 -> "001")
    const pad = (num: string | number, size: number) => {
        const s = "000000000" + num;
        return s.substr(s.length - size);
    };

    useEffect(() => {
        setMounted(true); // <--- 3. Enable Portal after mount

        const loadChapter = () => {
            const tempPages = [];

            // Logic: Try to load up to 50 pages. 
            for (let i = 1; i <= 50; i++) {

                const folder = `ch${chapterId}`;
                const fileName = `${pad(chapterId, 4)}-${pad(i, 3)}.png`;
                const url = `${IMAGEKIT_ENDPOINT}/${folder}/${fileName}?tr=q-100`;

                tempPages.push(url);
            }
            setPages(tempPages);
            setLoading(false);
        };

        loadChapter();
    }, [chapterId, IMAGEKIT_ENDPOINT]);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center">

            {/* HEADER */}
            <div className="fixed top-0 left-0 right-0 h-16 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-between px-4 border-b border-white/10 shadow-xl">
                <button onClick={() => router.push('/manga')} className="p-2 hover:bg-white/10 rounded-full text-white">
                    <ChevronLeft />
                </button>
                <span className="font-black italic uppercase text-white tracking-widest">
                    Chapter {chapterId}
                </span>
                <button onClick={() => router.push('/')} className="p-2 hover:bg-white/10 rounded-full text-white">
                    <Home size={20} />
                </button>
            </div>

            {/* READER (Waterfall) */}
            <div className="w-full max-w-3xl pt-20 pb-32 min-h-screen flex flex-col items-center">
                {loading ? (
                    <div className="text-cyan-500 text-center mt-20 font-mono animate-pulse">LOADING ARCHIVE...</div>
                ) : (
                    <div className="flex flex-col gap-1 w-full">
                        {pages.map((src, index) => (
                            <img
                                key={index}
                                src={src}
                                alt={`Page ${index + 1}`}
                                className="w-full h-auto object-contain bg-slate-900"
                                loading="lazy"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* STATIC NAVIGATION (At the bottom of the list) */}
                <div className="w-full grid grid-cols-2 gap-4 mt-12 px-4">
                    <button
                        onClick={() => router.push(`/manga/${Number(chapterId) - 1}`)}
                        disabled={Number(chapterId) <= 1}
                        className="py-4 rounded-xl bg-slate-800 text-white font-bold uppercase tracking-widest hover:bg-emerald-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => router.push(`/manga/${Number(chapterId) + 1}`)}
                        className="py-4 rounded-xl bg-emerald-500 text-white font-bold uppercase tracking-widest hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                        Next Chapter
                    </button>
                </div>
            </div>

            {/* FLOATING NAVIGATION (PORTALED to Body) */}
            {/* Using Portal escapes the 'perspective' CSS of the parent layout, fixing the 'stuck' issue */}
            {mounted && createPortal(
                <div className="fixed bottom-8 right-24 z-[100] flex items-center gap-2 pointer-events-auto">
                    <button
                        onClick={() => router.push(`/manga/${Number(chapterId) - 1}`)}
                        disabled={Number(chapterId) <= 1}
                        className="p-4 rounded-full bg-slate-800 text-white shadow-lg transition-all duration-300 hover:bg-emerald-500 hover:scale-110 active:scale-95 border-2 border-white/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-slate-800"
                        title="Previous Chapter"
                    >
                        <ChevronLeft size={24} strokeWidth={3} />
                    </button>

                    <button
                        onClick={() => router.push(`/manga/${Number(chapterId) + 1}`)}
                        className="p-4 rounded-full bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all duration-300 hover:bg-emerald-400 hover:scale-110 active:scale-95 border-2 border-white/20"
                        title="Next Chapter"
                    >
                        <ChevronRight size={24} strokeWidth={3} />
                    </button>
                </div>,
                document.body
            )}

        </div>
    );
}