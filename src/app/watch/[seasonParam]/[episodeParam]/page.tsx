'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, AlertCircle, SkipBack, SkipForward } from 'lucide-react';
import { animeData } from '@/data';

// --- 1. DEFINE THE SHAPE OF YOUR DATA ---
// This tells TypeScript: "videoUrl is optional (?)"
interface AnimeEpisode {
    title: string;
    season: string;
    episodeNumber: number;
    videoUrl?: string; // <--- The ? makes it optional
    theme?: string;
    // This line below allows any other properties (like detail, type, etc.) without errors
    [key: string]: any;
}

interface ThemeColors {
    text: string;
    bg: string;
    hoverBg: string;
    shadow: string;
}

export default function WatchPage() {
    const router = useRouter();
    const params = useParams();
    const seasonParam = params.seasonParam as string;
    const episodeParam = params.episodeParam as string;

    const formatSeasonToId = (seasonString: string) => {
        if (!seasonString) return '';
        return seasonString.toLowerCase()
            .replace(/season\s*/g, 's')
            .replace(/the\s*movie/g, 'movie')
            .replace(/\s/g, '');
    };

    const currentEpisodeIndex = useMemo(() => {
        if (!seasonParam || !episodeParam) return -1;

        return animeData.findIndex((ep: any) => {
            const epSeasonId = formatSeasonToId(ep.season);
            const epNumString = `e${ep.episodeNumber}`;
            const paramEpMatch = episodeParam === epNumString || episodeParam === String(ep.episodeNumber);
            return epSeasonId === seasonParam && paramEpMatch;
        });
    }, [seasonParam, episodeParam]);

    // --- 2. CAST THE DATA TO THE INTERFACE ---
    // We treat 'episode' as 'AnimeEpisode' so TypeScript knows videoUrl might exist
    const episode = animeData[currentEpisodeIndex] as AnimeEpisode;

    useEffect(() => {
        if (seasonParam && episodeParam && currentEpisodeIndex === -1) {
            router.push('/anime');
        }
    }, [currentEpisodeIndex, seasonParam, episodeParam, router]);

    if (!episode) return null;

    // Now TypeScript is happy because we told it videoUrl is a string | undefined
    let embedUrl = episode.videoUrl;

    if (embedUrl && embedUrl.includes('drive.google.com') && embedUrl.includes('/view')) {
        embedUrl = embedUrl.replace('/view', '/preview');
    }

    const handleNavigate = (direction: 'next' | 'prev') => {
        const nextIndex = direction === 'next' ? currentEpisodeIndex + 1 : currentEpisodeIndex - 1;

        if (nextIndex >= 0 && nextIndex < animeData.length) {
            // We also cast the next episode here to avoid errors on .season/.episodeNumber
            const nextEp = animeData[nextIndex] as AnimeEpisode;

            const nextSeasonId = formatSeasonToId(nextEp.season);
            const nextEpId = `e${nextEp.episodeNumber}`;

            router.push(`/watch/${nextSeasonId}/${nextEpId}`);
        }
    };

    const getThemeClasses = (theme: string): ThemeColors => {
        switch (theme) {
            case 'blue': return { text: 'text-blue-400', bg: 'bg-blue-500', hoverBg: 'hover:bg-blue-400', shadow: 'shadow-blue-500/20' };
            case 'red': return { text: 'text-red-500', bg: 'bg-red-600', hoverBg: 'hover:bg-red-500', shadow: 'shadow-red-600/20' };
            case 'emerald': return { text: 'text-emerald-400', bg: 'bg-emerald-500', hoverBg: 'hover:bg-emerald-400', shadow: 'shadow-emerald-500/20' };
            case 'purple': return { text: 'text-purple-400', bg: 'bg-purple-500', hoverBg: 'hover:bg-purple-400', shadow: 'shadow-purple-500/20' };
            case 'pink': return { text: 'text-pink-400', bg: 'bg-pink-500', hoverBg: 'hover:bg-pink-400', shadow: 'shadow-pink-500/20' };
            case 'orange': return { text: 'text-orange-400', bg: 'bg-orange-500', hoverBg: 'hover:bg-orange-400', shadow: 'shadow-orange-500/20' };
            default: return { text: 'text-yellow-400', bg: 'bg-yellow-500', hoverBg: 'hover:bg-yellow-400', shadow: 'shadow-yellow-500/20' };
        }
    };

    const themeColors = getThemeClasses(episode.theme || 'default');

    return (
        <div className="min-h-screen w-full flex flex-col bg-black overflow-y-auto">
            <div className="w-full p-4 z-50 flex justify-between items-center bg-slate-900 border-b border-white/10 sticky top-0 shadow-lg">
                <button
                    onClick={() => router.push('/anime')}
                    className={`flex items-center gap-2 text-white/80 hover:${themeColors.text} transition-colors`}
                >
                    <ChevronLeft size={24} />
                    <span className="font-bold uppercase text-sm tracking-widest">Back to Timeline</span>
                </button>
                <div className="text-right">
                    <h2 className={`${themeColors.text} font-black uppercase italic text-lg`}>{episode.season}</h2>
                    <p className="text-white font-bold text-sm hidden md:block">{episode.title}</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center w-full py-8 px-4 md:px-8">
                {embedUrl ? (
                    <div className="w-full max-w-5xl aspect-video relative rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                        <iframe
                            src={embedUrl}
                            className={`w-full h-full border-0 ${themeColors.shadow}`}
                            allow="autoplay; fullscreen"
                            allowFullScreen
                            title={episode.title}
                        ></iframe>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500 gap-4 p-8 border-2 border-slate-700 border-dashed rounded-xl m-10">
                        <AlertCircle size={48} />
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-slate-300 mb-1">Stream Unavailable</h3>
                            <p className="text-sm">The video source for this episode hasn&apos;t been added to the archives yet.</p>
                        </div>
                    </div>
                )}
                <h1 className="md:hidden text-white font-black uppercase italic text-xl mt-6 text-center">{episode.title}</h1>
            </div>

            <div className="w-full bg-slate-900 border-t border-white/10 p-4 md:p-6 z-20 mt-auto">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                    <button
                        onClick={() => handleNavigate('prev')}
                        disabled={currentEpisodeIndex === 0}
                        className="flex items-center gap-2 px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <SkipBack size={20} />
                        <span className="hidden md:inline font-bold text-sm uppercase">Previous Ep</span>
                    </button>

                    <div className="text-center hidden md:block">
                        <span className="block text-slate-400 text-[10px] uppercase tracking-widest font-bold">Now Watching</span>
                        <span className="block text-white font-black text-lg uppercase italic truncate max-w-[200px] md:max-w-md">
                            {episode.title}
                        </span>
                    </div>

                    <button
                        onClick={() => handleNavigate('next')}
                        disabled={currentEpisodeIndex === animeData.length - 1}
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg ${themeColors.bg} ${themeColors.hoverBg} text-white transition-all active:scale-95 shadow-lg ${themeColors.shadow} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <span className="hidden md:inline font-bold text-sm uppercase">Next Ep</span>
                        <SkipForward size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};