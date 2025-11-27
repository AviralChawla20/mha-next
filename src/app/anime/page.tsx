'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TimelineCard from '@/components/TimelineCard';
import { animeData } from '@/data';
import { createClient } from '@/utils/supabase/client';
import { CheckCircle, Trophy, BarChart3 } from 'lucide-react';

export default function AnimePage() {
    const router = useRouter();
    const supabase = createClient();

    // State for tracking
    const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set());
    const [lastInteractedId, setLastInteractedId] = useState<string | null>(null); // <--- New State
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Helper: Generate unique IDs (matches how we save them in the DB)
    const generateId = (item: any) => {
        if (!item.season || !item.episodeNumber) return null;
        // Logic must match watch page exactly: "s1-e1"
        const s = item.season.toLowerCase().replace(/season\s*/g, 's').replace(/the\s*movie/g, 'm').replace(/\s/g, '');
        const e = `e${item.episodeNumber}`;
        return `${s}-${e}`;
    };

    // Fetch Watched Data
    useEffect(() => {
        const fetchProgress = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);

                // CHANGED: Fetch ALL rows (watched OR in-progress) + last_watched timestamp
                const { data } = await supabase
                    .from('user_anime')
                    .select('episode_id, is_watched, last_watched');

                if (data && data.length > 0) {
                    // 1. Set Watched IDs (Only those marked as completed for the green checkmark)
                    const completed = data.filter((row: any) => row.is_watched).map((row: any) => row.episode_id);
                    setWatchedIds(new Set(completed));

                    // 2. Find the most recently interacted episode (Sort by last_watched date)
                    // This handles the "Paused" case. Even if is_watched is false, it has a recent timestamp.
                    const sortedByDate = [...data].sort((a: any, b: any) => {
                        const dateA = new Date(a.last_watched || 0).getTime();
                        const dateB = new Date(b.last_watched || 0).getTime();
                        return dateB - dateA; // Descending order (newest first)
                    });

                    if (sortedByDate.length > 0) {
                        setLastInteractedId(sortedByDate[0].episode_id);
                    }
                }
            }
            setLoading(false);
        };
        fetchProgress();
    }, [supabase]);

    // --- UPDATED: AUTO-SCROLL TO LAST INTERACTED ---
    useEffect(() => {
        // Scroll to the specific episode we found above
        if (!loading && lastInteractedId) {
            const element = document.getElementById(lastInteractedId);
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 500);
            }
        }
    }, [loading, lastInteractedId]);

    const handleEpisodeClick = (item: any) => {
        const seasonId = item.season.toLowerCase()
            .replace(/season\s*/g, 's')
            .replace(/the\s*movie/g, 'm')
            .replace(/\s/g, '');
        const episodeId = `e${item.episodeNumber}`;
        router.push(`/watch/${seasonId}/${episodeId}`);
    };

    // Calculate Stats
    const totalEpisodes = animeData.filter((i: any) => i.type === 'episode' || i.type === 'movie').length;
    const watchedCount = watchedIds.size;
    const progress = totalEpisodes > 0 ? Math.round((watchedCount / totalEpisodes) * 100) : 0;

    return (
        <div className="w-full min-h-screen relative">

            <div className="max-w-2xl mx-auto py-24 px-4 space-y-4">

                {/* --- PROGRESS BAR HEADER (NON-STICKY) --- */}
                {userId && (
                    <div className="relative mb-8 bg-slate-900/90 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl animate-[slideDown_0.5s_ease-out]">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <div className="flex items-center gap-2 text-yellow-400 mb-1">
                                    <BarChart3 size={16} />
                                    <span className="font-black uppercase tracking-widest text-xs">Timeline Sync</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-white italic">{progress}%</span>
                                    <span className="text-sm font-bold text-slate-500">SYNCHRONIZED</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="bg-slate-800 px-3 py-1 rounded-lg border border-white/5">
                                    <span className="text-white font-mono font-bold">{watchedCount} <span className="text-slate-500">/</span> {totalEpisodes}</span>
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar Track */}
                        <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                            {/* Animated Bar */}
                            <div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(250,204,21,0.5)]"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%,transparent_100%)] bg-[length:10px_10px] animate-[shimmer_1s_linear_infinite]"></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TIMELINE CARDS */}
                {animeData.map((item: any, index: number) => {
                    const id = generateId(item);
                    const isWatched = id ? watchedIds.has(id) : false;

                    return (
                        // WRAPPER DIV: This provides the anchor ID for scrolling
                        <div id={id || undefined} key={index}>
                            <TimelineCard
                                item={item}
                                index={index}
                                themeColor="bg-yellow-400"
                                borderColor="border-yellow-400"
                                textColor="text-yellow-400"
                                shadowColor="shadow-yellow-400/50"
                                isWatched={isWatched} // Pass the status
                                onClick={handleEpisodeClick}
                            />
                        </div>
                    );
                })}

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
        </div>
    );
};