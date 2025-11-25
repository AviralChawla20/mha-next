'use client';

import React from 'react';
import { useRouter } from 'next/navigation'; // Changed from react-router-dom
import TimelineCard from '@/components/TimelineCard'; // Uses Next.js alias
import { animeData } from '@/data'; // See note below about this file!

export default function AnimePage() {
    const router = useRouter(); // Changed from useNavigate

    const handleEpisodeClick = (item: any) => {
        // 1. Convert "Season 1" to "s1"
        const seasonId = item.season.toLowerCase()
            .replace(/season\s*/g, 's') // Converts "Season 1" -> "s1"
            .replace(/the\s*movie/g, 'm') // Converts "The Movie" -> "movie"
            .replace(/\s/g, ''); // Removes remaining spaces

        // 2. Create the episode ID
        const episodeId = `e${item.episodeNumber}`;

        // 3. Navigate
        router.push(`/watch/${seasonId}/${episodeId}`);
    };

    return (
        <div className="max-w-2xl mx-auto py-24 px-4 space-y-4">
            {animeData.map((item: any, index: number) => (
                <TimelineCard
                    key={index}
                    item={item}
                    index={index}
                    themeColor="bg-yellow-400"
                    borderColor="border-yellow-400"
                    textColor="text-yellow-400"
                    shadowColor="shadow-yellow-400/50"
                    onClick={handleEpisodeClick}
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
};