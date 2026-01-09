'use client';

import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, SkipBack, SkipForward, LayoutTemplate } from 'lucide-react';
import { animeData } from '@/data';
import { createClient } from '@/utils/supabase/client';

// --- Constants ---
const VJS_CSS_URL = 'https://vjs.zencdn.net/8.10.0/video-js.css';
const VJS_SCRIPT_URL = 'https://vjs.zencdn.net/8.10.0/video.min.js';
const OCTOPUS_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/libass-wasm@4.1.0/dist/js/subtitles-octopus.min.js';

// Local files in public/lib/
const OCTOPUS_WORKER_URL = '/lib/subtitles-octopus-worker.js';
const OCTOPUS_WASM_URL = '/lib/subtitles-octopus-worker.wasm';

interface AnimeEpisode {
    title: string;
    season: string;
    episodeNumber: number;
    videoUrl?: string;
    subtitleUrl?: string;
    theme?: string;
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
    const supabase = createClient();

    const seasonParam = params.seasonParam as string;
    const episodeParam = params.episodeParam as string;

    const [userId, setUserId] = useState<string | null>(null);

    // --- Refs ---
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);
    const octopusRef = useRef<any>(null);
    const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const stylesInjectedRef = useRef(false);

    // Track subtitles state for the 'C' key toggle
    const isSubsOnRef = useRef(true);

    // --- State ---
    const [areLibsLoaded, setAreLibsLoaded] = useState(false);
    const [savedTime, setSavedTime] = useState(0);
    const [hasResumed, setHasResumed] = useState(false);
    const [showResumeToast, setShowResumeToast] = useState(false);
    const [isIframeMode, setIsIframeMode] = useState(false);
    const [showNextEpPopup, setShowNextEpPopup] = useState(false);

    // --- Data Calculation ---
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

    const episode = animeData[currentEpisodeIndex] as AnimeEpisode;
    const currentUniqueId = `${seasonParam}-${episodeParam}`;

    const getStreamUrl = (rawUrl: string) => {
        let fileId = "";
        if (rawUrl.includes('/d/')) {
            fileId = rawUrl.split('/d/')[1]?.split('/')[0];
        } else if (rawUrl.includes('id=')) {
            fileId = rawUrl.split('id=')[1]?.split('&')[0];
        }
        return fileId ? `/api/stream?fileId=${fileId}` : "";
    };

    // --- 0. Inject Custom CSS ---
    useEffect(() => {
        if (stylesInjectedRef.current) return;
        const style = document.createElement('style');
        style.innerHTML = `
            .video-js.vjs-user-inactive.vjs-playing .vjs-control-bar {
                opacity: 0 !important;
                transition: opacity 1s ease;
                pointer-events: none;
            }
            .vjs-custom-cc-button {
                font-family: sans-serif;
                font-weight: bold;
                cursor: pointer;
                width: 3em !important; 
                display: flex !important;
                align-items: center;
                justify-content: center;
            }
            .vjs-custom-cc-button.cc-on {
                color: #facc15 !important;
                text-shadow: 0 0 5px rgba(250, 204, 21, 0.5);
            }
            .vjs-custom-cc-button.cc-off {
                color: #9ca3af !important;
            }
        `;
        document.head.appendChild(style);
        stylesInjectedRef.current = true;
    }, []);

    // --- 1. Load External Scripts ---
    useEffect(() => {
        let vjsLoaded = false;
        let octopusLoaded = false;
        const checkReady = () => { if (vjsLoaded && octopusLoaded) setAreLibsLoaded(true); };

        if (!document.querySelector(`link[href="${VJS_CSS_URL}"]`)) {
            const link = document.createElement('link');
            link.href = VJS_CSS_URL;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }

        if ((window as any).videojs) { vjsLoaded = true; checkReady(); }
        else {
            const script = document.createElement('script');
            script.src = VJS_SCRIPT_URL;
            script.async = true;
            script.onload = () => { vjsLoaded = true; checkReady(); };
            document.body.appendChild(script);
        }

        if ((window as any).SubtitlesOctopus) { octopusLoaded = true; checkReady(); }
        else {
            const script = document.createElement('script');
            script.src = OCTOPUS_SCRIPT_URL;
            script.async = true;
            script.onload = () => { octopusLoaded = true; checkReady(); };
            document.body.appendChild(script);
        }
    }, []);

    // --- 2. DB Progress Fetching ---
    useEffect(() => {
        const fetchProgress = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                const { data } = await supabase.from('user_anime').select('progress').eq('episode_id', currentUniqueId).maybeSingle();
                if (data && data.progress > 10) {
                    setSavedTime(data.progress);
                    // We DO NOT set hasResumed to false here immediately, 
                    // we handle that in the player init to ensure fresh seek
                }
            }
        };
        fetchProgress();
    }, [currentUniqueId, supabase]);

    const saveProgress = useCallback(async (time: number, totalDuration: number, completed: boolean = false) => {
        if (!userId) return;
        const payload = {
            user_id: userId,
            episode_id: currentUniqueId,
            progress: Math.floor(time),
            duration: Math.floor(totalDuration),
            last_watched: new Date().toISOString(),
            ...(completed ? { is_watched: true } : {})
        };
        await supabase.from('user_anime').upsert(payload, { onConflict: 'user_id, episode_id' });
    }, [userId, currentUniqueId, supabase]);

    // --- 3. Keyboard Shortcuts ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!playerRef.current) return;
            const player = playerRef.current;

            // Ignore if user is typing in an input (not likely here, but good practice)
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

            switch (e.key.toLowerCase()) {
                case ' ':
                case 'k':
                    e.preventDefault(); // Prevent page scroll
                    player.paused() ? player.play() : player.pause();
                    break;
                case 'arrowleft':
                case 'j':
                    e.preventDefault();
                    player.currentTime(Math.max(0, player.currentTime() - 5));
                    break;
                case 'arrowright':
                case 'l':
                    e.preventDefault();
                    player.currentTime(Math.min(player.duration(), player.currentTime() + 5));
                    break;
                case 'f':
                    e.preventDefault();
                    player.isFullscreen() ? player.exitFullscreen() : player.requestFullscreen();
                    break;
                case 'c':
                    e.preventDefault();
                    // Toggle Subtitles via ref
                    const btn = document.querySelector('.vjs-custom-cc-button') as HTMLButtonElement;
                    if (btn) btn.click(); // Reuse the click logic we defined in player init
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);


    // --- 4. Initialize Player & Octopus ---
    // --- 4. Initialize Player & Octopus ---
    useEffect(() => {
        if (!areLibsLoaded || !episode || !videoContainerRef.current || isIframeMode || playerRef.current) return;

        // Reset resume state for new episode
        setHasResumed(false);

        console.log('Initializing Video.js + Octopus...');

        const videoElement = document.createElement("video-js");
        videoElement.classList.add('vjs-big-play-centered', 'vjs-fluid');
        videoContainerRef.current.appendChild(videoElement);

        const streamUrl = getStreamUrl(episode.videoUrl || "");

        const player = (window as any).videojs(videoElement, {
            controls: true,
            autoplay: false,
            preload: 'auto', // changed to 'auto' to help metadata load faster
            fluid: true,
            playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
            inactivityTimeout: 2000,
            sources: [{ src: streamUrl, type: 'video/mp4' }]
        }, () => {
            console.log('Video.js Player Ready');

            // --- UI: Custom CC Button (Only add if subtitles exist) ---
            if (episode.subtitleUrl && episode.subtitleUrl.trim() !== '') {
                const controlBar = player.controlBar.el();
                const ccBtn = document.createElement('button');
                ccBtn.className = 'vjs-custom-cc-button vjs-control vjs-button cc-on';
                ccBtn.innerHTML = '<span aria-hidden="true">CC</span>';
                ccBtn.title = "Toggle Subtitles (C)";

                ccBtn.onclick = () => {
                    isSubsOnRef.current = !isSubsOnRef.current;
                    if (isSubsOnRef.current) {
                        ccBtn.classList.remove('cc-off');
                        ccBtn.classList.add('cc-on');
                    } else {
                        ccBtn.classList.remove('cc-on');
                        ccBtn.classList.add('cc-off');
                    }
                    const canvas = videoElement.parentElement?.querySelector('canvas');
                    if (canvas) canvas.style.display = isSubsOnRef.current ? 'block' : 'none';
                };

                const fsButton = controlBar.querySelector('.vjs-fullscreen-control');
                if (fsButton) controlBar.insertBefore(ccBtn, fsButton);
                else controlBar.appendChild(ccBtn);
            }
        });

        playerRef.current = player;

        // --- CRITICAL FIX: Robust Metadata Handler ---
        player.on('loadedmetadata', () => {
            const videoWidth = player.videoWidth();
            const videoHeight = player.videoHeight();
            const videoDuration = player.duration();

            console.log(`Metadata: ${videoWidth}x${videoHeight}, ${videoDuration}s`);

            // FIX: Only init subtitles if:
            // 1. We have a valid URL (not empty string)
            // 2. The video has reported actual dimensions (prevents "width is 0" crash)
            const hasValidSubs = episode.subtitleUrl && episode.subtitleUrl.trim() !== '';
            const hasDimensions = videoWidth > 0 && videoHeight > 0;

            if (hasValidSubs && hasDimensions && (window as any).SubtitlesOctopus && !octopusRef.current) {
                try {
                    console.log('Starting Subtitles...');
                    const videoNode = player.tech().el();
                    const options = {
                        video: videoNode,
                        subUrl: episode.subtitleUrl,
                        workerUrl: OCTOPUS_WORKER_URL,
                        wasmUrl: OCTOPUS_WASM_URL,
                        debug: false
                    };
                    octopusRef.current = new (window as any).SubtitlesOctopus(options);
                } catch (err) {
                    console.warn('Subtitle Init Skipped:', err);
                }
            } else if (!hasValidSubs) {
                console.log('No subtitles for this episode.');
            }

            // Resume Logic
            if (savedTime > 10) {
                player.currentTime(savedTime - 5);
                setHasResumed(true);
                setShowResumeToast(true);
                setTimeout(() => setShowResumeToast(false), 3000);
            }
        });

        // --- Event Listeners ---
        player.on('timeupdate', () => {
            const current = player.currentTime();
            const duration = player.duration();
            if (duration && current && duration - current <= 30 && duration - current > 0) {
                setShowNextEpPopup(true);
            } else {
                setShowNextEpPopup(false);
            }
        });

        player.on('play', () => {
            if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
            saveIntervalRef.current = setInterval(() => {
                const current = player.currentTime();
                const duration = player.duration();
                if (current && duration) saveProgress(current, duration);
            }, 10000);
        });

        player.on('pause', () => {
            if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
        });

        player.on('ended', () => {
            const duration = player.duration();
            if (duration) saveProgress(duration, duration, true);
            setShowNextEpPopup(false);
        });

        return () => {
            if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
            // Strict cleanup order
            if (octopusRef.current) {
                try { octopusRef.current.dispose(); } catch (e) { }
                octopusRef.current = null;
            }
            if (player && !player.isDisposed()) {
                player.dispose();
                playerRef.current = null;
            }
        };
    }, [areLibsLoaded, episode, isIframeMode, currentUniqueId, savedTime]);

    const handleNavigate = (direction: 'next' | 'prev') => {
        const nextIndex = direction === 'next' ? currentEpisodeIndex + 1 : currentEpisodeIndex - 1;
        if (nextIndex >= 0 && nextIndex < animeData.length) {
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
            default: return { text: 'text-yellow-400', bg: 'bg-yellow-500', hoverBg: 'hover:bg-yellow-400', shadow: 'shadow-yellow-500/20' };
        }
    };

    if (!episode) return null;
    const themeColors = getThemeClasses(episode.theme || 'default');

    let iframeSrc = episode.videoUrl;
    if (iframeSrc && iframeSrc.includes('/view')) {
        iframeSrc = iframeSrc.replace('/view', '/preview');
    }

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
                <div className="w-full max-w-5xl aspect-video relative rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-slate-950">
                    {isIframeMode ? (
                        <iframe src={iframeSrc} className={`w-full h-full border-0 ${themeColors.shadow}`} allow="autoplay; fullscreen" allowFullScreen title={episode.title} />
                    ) : (
                        <div className="w-full h-full bg-black relative">
                            {!areLibsLoaded && <div className="absolute inset-0 flex items-center justify-center text-white z-10">Loading Player...</div>}

                            <div ref={videoContainerRef} className="w-full h-full" />

                            {showNextEpPopup && currentEpisodeIndex < animeData.length - 1 && (
                                <div
                                    className="absolute bottom-20 right-4 z-[50] bg-slate-900/90 border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-md max-w-xs cursor-pointer hover:bg-slate-800/90 transition-colors group/popup animate-in slide-in-from-right-10"
                                    onClick={(e) => { e.stopPropagation(); handleNavigate('next'); }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Up Next</p>
                                            <p className="text-white font-bold text-sm line-clamp-1 group-hover/popup:text-yellow-400 transition-colors">{(animeData[currentEpisodeIndex + 1] as AnimeEpisode).title}</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover/popup:bg-yellow-400 group-hover/popup:text-black transition-all">
                                            <SkipForward size={20} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {showResumeToast && (
                                <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-2 rounded-full border border-yellow-400/30 shadow-[0_0_20px_rgba(250,204,21,0.3)] animate-in fade-in slide-in-from-top-4 duration-500 flex items-center gap-3 backdrop-blur-md z-[50]">
                                    <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                                    <span className="font-bold text-sm tracking-wide">Resumed at {Math.floor(savedTime / 60)}:{Math.floor(savedTime % 60).toString().padStart(2, '0')}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-4 flex justify-between items-start w-full max-w-5xl">
                    <h1 className="text-white font-black uppercase italic text-xl hidden md:block">{episode.title}</h1>
                    <button
                        onClick={() => {
                            if (playerRef.current) { playerRef.current.dispose(); playerRef.current = null; }
                            if (octopusRef.current) { octopusRef.current.dispose(); octopusRef.current = null; }
                            setIsIframeMode(!isIframeMode);
                        }}
                        className="flex items-center gap-2 text-xs text-slate-500 hover:text-white underline decoration-slate-600 underline-offset-4 ml-auto"
                    >
                        <LayoutTemplate size={14} />
                        {isIframeMode ? "Switch to Custom Player" : "Switch to Fallback Player"}
                    </button>
                </div>
            </div>

            <div className="w-full bg-slate-900 border-t border-white/10 p-4 md:p-6 z-20 mt-auto">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                    <button onClick={() => handleNavigate('prev')} disabled={currentEpisodeIndex === 0} className="flex items-center gap-2 px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                        <SkipBack size={20} /> <span className="hidden md:inline font-bold text-sm uppercase">Previous Ep</span>
                    </button>

                    <div className="text-center hidden md:block">
                        <span className="block text-slate-400 text-[10px] uppercase tracking-widest font-bold">Now Watching</span>
                        <span className="block text-white font-black text-lg uppercase italic truncate max-w-[200px] md:max-w-md">{episode.title}</span>
                    </div>

                    <button onClick={() => handleNavigate('next')} disabled={currentEpisodeIndex === animeData.length - 1} className={`flex items-center gap-2 px-4 py-3 rounded-lg ${themeColors.bg} ${themeColors.hoverBg} text-white transition-all active:scale-95 shadow-lg ${themeColors.shadow} disabled:opacity-50 disabled:cursor-not-allowed`}>
                        <span className="hidden md:inline font-bold text-sm uppercase">Next Ep</span> <SkipForward size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
}