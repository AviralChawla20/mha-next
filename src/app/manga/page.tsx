'use client';

import React from 'react';
import { useRouter } from 'next/navigation'; // Changed from react-router-dom
import TimelineCard from '@/components/TimelineCard'; // Uses Next.js alias
import { mangaData } from '@/data'; // Uses Next.js alias

export default function MangaPage() {
    const router = useRouter(); // Changed from useNavigate

    return (
        <div className="max-w-2xl mx-auto py-24 px-4 space-y-4">
            {mangaData.map((item: any, index: number) => (
                <TimelineCard
                    key={index}
                    item={item}
                    index={index}
                    themeColor="bg-emerald-500"
                    borderColor="border-emerald-500"
                    textColor="text-emerald-500"
                    shadowColor="shadow-emerald-500/50"
                // Manga usually doesn't need onClick for video playback
                />
            ))}

            <div className="h-64 flex flex-col items-center justify-center text-slate-500 gap-4 opacity-50">
                <p className="text-sm font-bold uppercase tracking-widest">End of Timeline</p>
                <button
                    onClick={() => router.push('/')}
                    className="text-xs border border-slate-600 px-4 py-2 rounded-full hover:bg-slate-800 hover:text-white transition-colors"
                >
                    Back to Home
                </button>
            </div>
        </div>
    );
}