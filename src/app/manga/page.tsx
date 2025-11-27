'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TimelineCard from '@/components/TimelineCard';
import { mangaData } from '@/data'; // Assuming this exists with basic chapter info
import { createClient } from '@/utils/supabase/client';
import { BarChart3 } from 'lucide-react';

export default function MangaPage() {
    const router = useRouter();
    const supabase = createClient();

    // State
    const [readIds, setReadIds] = useState<Set<string>>(new Set());
    const [lastReadId, setLastReadId] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch Read Data
    useEffect(() => {
        const fetchProgress = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                // Fetch read chapters
                const { data } = await supabase
                    .from('user_manga')
                    .select('chapter_id, created_at')
                    .eq('is_read', true)
                    .order('created_at', { ascending: false }); // Newest first for "last read" logic

                if (data && data.length > 0) {
                    setReadIds(new Set(data.map(row => row.chapter_id)));
                    setLastReadId(data[0].chapter_id); // The most recently marked chapter
                }
            }
            setLoading(false);
        };
        fetchProgress();
    }, [supabase]);

    // Auto-scroll to last read
    useEffect(() => {
        if (!loading && lastReadId) {
            const element = document.getElementById(`ch-${lastReadId}`);
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 500);
            }
        }
    }, [loading, lastReadId]);

    const handleChapterClick = (item: any) => {
        // Use the ID or Chapter number from your data
        router.push(`/manga/${item.id}`);
    };

    // Stats
    const totalChapters = mangaData.length;
    const readCount = readIds.size;
    const progress = totalChapters > 0 ? Math.round((readCount / totalChapters) * 100) : 0;

    return (
        <div className="w-full min-h-screen relative">
            <div className="max-w-2xl mx-auto py-24 px-4 space-y-4">

                {/* PROGRESS HEADER */}
                {userId && (
                    <div className="relative mb-8 bg-slate-900/90 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl animate-[slideDown_0.5s_ease-out]">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                                    <BarChart3 size={16} />
                                    <span className="font-black uppercase tracking-widest text-xs">Manga Progress</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-white italic">{progress}%</span>
                                    <span className="text-sm font-bold text-slate-500">READ</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="bg-slate-800 px-3 py-1 rounded-lg border border-white/5">
                                    <span className="text-white font-mono font-bold">{readCount} <span className="text-slate-500">/</span> {totalChapters}</span>
                                </div>
                            </div>
                        </div>

                        <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                            <div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%,transparent_100%)] bg-[length:10px_10px] animate-[shimmer_1s_linear_infinite]"></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* CHAPTER CARDS */}
                {mangaData.map((item: any, index: number) => {
                    const isRead = readIds.has(String(item.id)); // Ensure ID types match

                    return (
                        <div id={`ch-${item.id}`} key={index}>
                            <TimelineCard
                                item={item}
                                index={index}
                                themeColor="bg-emerald-500"
                                borderColor="border-emerald-500"
                                textColor="text-emerald-500"
                                shadowColor="shadow-emerald-500/50"
                                isWatched={isRead} // Reuse the "Watched" visual logic for "Read"
                                onClick={handleChapterClick}
                            />
                        </div>
                    );
                })}

                <div className="h-64 flex flex-col items-center justify-center text-slate-500 gap-4 opacity-50">
                    <p className="text-sm font-bold uppercase tracking-widest">End of Archives</p>
                    <button onClick={() => router.push('/')} className="text-xs border border-slate-600 px-4 py-2 rounded-full hover:bg-slate-800 hover:text-white transition-colors">Back to Home</button>
                </div>
            </div>
        </div>
    );
};