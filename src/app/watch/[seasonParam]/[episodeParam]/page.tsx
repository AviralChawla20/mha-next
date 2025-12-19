'use client';

import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import Script from 'next/script';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, AlertCircle, SkipBack, SkipForward, Play, Pause, Maximize, Volume2, VolumeX, RefreshCw, Settings, LayoutTemplate } from 'lucide-react';
import { animeData } from '@/data';
import { createClient } from '@/utils/supabase/client';

interface AnimeEpisode {
    title: string;
    season: string;
    episodeNumber: number;
    videoUrl?: string;
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

    // --- PLAYER STATE ---
    const videoRef = useRef<HTMLVideoElement>(null);
    const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [showControls, setShowControls] = useState(true);

    const [savedTime, setSavedTime] = useState(0);
    const [hasResumed, setHasResumed] = useState(false);

    const [isIframeMode, setIsIframeMode] = useState(false);
    const [videoError, setVideoError] = useState(false);

    const currentUniqueId = `${seasonParam}-${episodeParam}`;

    // --- HELPERS ---
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

    // --- DB OPERATIONS ---
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

    useEffect(() => {
        const fetchProgress = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                const { data } = await supabase
                    .from('user_anime')
                    .select('progress')
                    .eq('episode_id', currentUniqueId)
                    .maybeSingle();

                if (data && data.progress > 10) {
                    setSavedTime(data.progress);
                    setHasResumed(false);
                }
            }
        };
        fetchProgress();
    }, [currentUniqueId, supabase]);

    // --- PLAYER LOGIC ---
    useEffect(() => {
        if (isPlaying) {
            saveIntervalRef.current = setInterval(() => {
                if (videoRef.current) {
                    saveProgress(videoRef.current.currentTime, videoRef.current.duration);
                }
            }, 10000);
        } else {
            if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
        }
        return () => { if (saveIntervalRef.current) clearInterval(saveIntervalRef.current); };
    }, [isPlaying, saveProgress]);

    const togglePlay = useCallback(() => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play();
                setIsPlaying(true);
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
            }
        }
    }, []);

    // --- KEYBOARD SHORTCUTS ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!videoRef.current) return;

            switch (e.key) {
                case 'ArrowLeft':
                    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
                    break;
                case 'ArrowRight':
                    videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 5);
                    break;
                case ' ':
                case 'Spacebar':
                    e.preventDefault(); // Prevent page scroll
                    togglePlay();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePlay]); // Dependency on togglePlay

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const total = videoRef.current.duration || 1;
            setCurrentTime(current);
            setProgress((current / total) * 100);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (videoRef.current) {
            const seekTime = (Number(e.target.value) / 100) * videoRef.current.duration;
            videoRef.current.currentTime = seekTime;
            setProgress(Number(e.target.value));
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVol = Number(e.target.value);
        setVolume(newVol);
        if (videoRef.current) {
            videoRef.current.volume = newVol;
            videoRef.current.muted = newVol === 0;
            setIsMuted(newVol === 0);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            const newMuted = !isMuted;
            videoRef.current.muted = newMuted;
            setIsMuted(newMuted);
            if (!newMuted && volume === 0) {
                setVolume(0.5);
                videoRef.current.volume = 0.5;
            }
        }
    };

    const cyclePlaybackSpeed = () => {
        const speeds = [1.0, 1.25, 1.5, 2.0];
        const nextSpeedIndex = (speeds.indexOf(playbackRate) + 1) % speeds.length;
        const nextSpeed = speeds[nextSpeedIndex];
        setPlaybackRate(nextSpeed);
        if (videoRef.current) {
            videoRef.current.playbackRate = nextSpeed;
        }
    };

    const toggleFullscreen = () => {
        if (videoRef.current && videoRef.current.parentElement) {
            if (!document.fullscreenElement) {
                videoRef.current.parentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        }
    };

    const handleVideoEnded = () => {
        setIsPlaying(false);
        if (videoRef.current) {
            saveProgress(videoRef.current.duration, videoRef.current.duration, true);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
            setVideoError(false);

            if (savedTime > 0 && !hasResumed) {
                const safeResumeTime = Math.max(0, savedTime - 5);
                videoRef.current.currentTime = safeResumeTime;
                setHasResumed(true);
            }
        }
    };

    useEffect(() => {
        if (seasonParam && episodeParam && currentEpisodeIndex === -1) {
            router.push('/anime');
        }
    }, [currentEpisodeIndex, seasonParam, episodeParam, router]);

    useEffect(() => {
        setVideoError(false);
        setIsPlaying(false);
        setProgress(0);
        setHasResumed(false);
        setSavedTime(0);
        setIsIframeMode(false);
    }, [episode]);

    if (!episode) return null;

    let videoSource = "";
    let fileId = "";
    const rawUrl = episode.videoUrl || "";

    if (rawUrl.includes('/d/')) {
        fileId = rawUrl.split('/d/')[1]?.split('/')[0];
    } else if (rawUrl.includes('id=')) {
        fileId = rawUrl.split('id=')[1]?.split('&')[0];
    }

    if (fileId) {
        videoSource = `/api/stream?fileId=${fileId}`;
    }

    let iframeSrc = episode.videoUrl;
    if (iframeSrc && iframeSrc.includes('/view')) {
        iframeSrc = iframeSrc.replace('/view', '/preview');
    }

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

    const themeColors = getThemeClasses(episode.theme || 'default');

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

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

                <Script src="https://iamcdn.net/players/replace-domain.js" strategy="lazyOnload" />

                <div className="w-full max-w-5xl aspect-video relative rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-slate-950 group">

                    {isIframeMode ? (
                        <iframe
                            src={iframeSrc}
                            className={`w-full h-full border-0 ${themeColors.shadow}`}
                            allow="autoplay; fullscreen"
                            allowFullScreen
                            title={episode.title}
                        ></iframe>
                    ) : (
                        <div
                            className="relative w-full h-full bg-black"
                            onMouseEnter={() => setShowControls(true)}
                            onMouseLeave={() => isPlaying && setShowControls(false)}
                        >
                            <video
                                ref={videoRef}
                                src={videoSource}
                                className="w-full h-full object-contain"
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleLoadedMetadata}
                                onEnded={handleVideoEnded}
                                onClick={togglePlay}
                                onError={() => {
                                    console.log("Video Load Error. Auto-switching to Iframe.");
                                    setVideoError(true);
                                    setIsIframeMode(true);
                                }}
                            />

                            {/* Next Episode Popup */}
                            {(() => {
                                const nextIndex = currentEpisodeIndex + 1;
                                const hasNextEp = nextIndex < animeData.length;
                                const timeLeft = duration - currentTime;
                                const showPopup = hasNextEp && timeLeft <= 30 && timeLeft > 0 && !videoError;

                                if (showPopup) {
                                    const nextEp = animeData[nextIndex] as AnimeEpisode;
                                    return (
                                        <div
                                            className="absolute bottom-24 right-4 z-50 bg-slate-900/90 border border-white/10 p-6 rounded-xl shadow-2xl backdrop-blur-md max-w-sm animate-slide-in-right cursor-pointer hover:bg-slate-800/90 transition-colors group/popup"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleNavigate('next');
                                            }}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="flex-1">
                                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Up Next</p>
                                                    <p className="text-white font-bold text-lg line-clamp-2 leading-tight group-hover/popup:text-yellow-400 transition-colors">
                                                        {nextEp.title}
                                                    </p>
                                                    <p className="text-slate-500 text-sm mt-1">
                                                        {nextEp.season} - Episode {nextEp.episodeNumber}
                                                    </p>
                                                </div>
                                                <div className="mt-1">
                                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover/popup:bg-yellow-400 group-hover/popup:text-black transition-all">
                                                        <SkipForward size={24} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="absolute top-2 right-2">
                                                {/* Optional: Close button could go here if needed, but clicking outside or waiting is fine for now */}
                                            </div>
                                            {/* Progress bar for auto-play could go here */}
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'} ${videoError ? 'hidden' : ''}`}>

                                <div className="flex items-center gap-4 mb-4">
                                    <span className="text-xs font-mono text-slate-300 w-12 text-right">{formatTime(currentTime)}</span>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={progress}
                                        onChange={handleSeek}
                                        className="flex-1 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-yellow-400 hover:h-2 transition-all"
                                    />
                                    <span className="text-xs font-mono text-slate-300 w-12">{formatTime(duration)}</span>
                                </div>

                                <div className="flex items-center justify-between text-white">
                                    <div className="flex items-center gap-6">
                                        <button onClick={togglePlay} className="hover:text-yellow-400 transition-colors transform active:scale-95">
                                            {isPlaying ? <Pause size={28} /> : <Play size={28} fill="currentColor" />}
                                        </button>

                                        <div className="flex items-center gap-2 group/volume">
                                            <button onClick={toggleMute} className="hover:text-yellow-400 transition-colors">
                                                {isMuted || volume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}
                                            </button>
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.1"
                                                value={isMuted ? 0 : volume}
                                                onChange={handleVolumeChange}
                                                className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300 h-1 bg-slate-600 rounded-lg accent-white cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={cyclePlaybackSpeed}
                                            className="text-xs font-bold font-mono bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors w-12"
                                        >
                                            {playbackRate}x
                                        </button>

                                        <button onClick={toggleFullscreen} className="hover:text-yellow-400 transition-colors">
                                            <Maximize size={22} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {!isPlaying && !videoError && (
                                <div
                                    onClick={togglePlay}
                                    className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20 hover:bg-black/10 transition-colors"
                                >
                                    <div className="w-20 h-20 rounded-full bg-yellow-400/90 flex items-center justify-center shadow-lg hover:scale-110 transition-transform backdrop-blur-sm">
                                        <Play size={40} className="text-black ml-2" fill="currentColor" />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-4 flex justify-between items-start w-full max-w-5xl">
                    <h1 className="text-white font-black uppercase italic text-xl hidden md:block">{episode.title}</h1>
                    <button
                        onClick={() => {
                            setHasResumed(false); // Allow re-seeking if they switch back
                            setIsIframeMode(!isIframeMode);
                        }}
                        className="flex items-center gap-2 text-xs text-slate-500 hover:text-white underline decoration-slate-600 underline-offset-4 ml-auto"
                    >
                        <LayoutTemplate size={14} />
                        {isIframeMode ? "Switch to Custom Player" : "Video not loading? Switch to Fallback"}
                    </button>
                </div>
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