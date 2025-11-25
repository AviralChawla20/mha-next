'use client'; // <--- Critical: Required for Hooks and IntersectionObserver

import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Tv, Star, Zap, Circle, Film, Book, AlertCircle, Play } from 'lucide-react';

// Define the shape of your Item data to satisfy TypeScript
interface TimelineItem {
    type: string;
    title: string;
    theme?: string;
    season?: string;
    episodeNumber?: string | number;
    detail?: string;
    sub?: string;
    note?: boolean;
    [key: string]: any; // Allows for other properties
}

interface TimelineCardProps {
    item: TimelineItem;
    index: number;
    borderColor: string;
    textColor: string;
    shadowColor: string;
    themeColor: string;
    onClick?: (item: TimelineItem) => void;
}

const TimelineCard = ({
    item,
    index,
    borderColor,
    textColor,
    shadowColor,
    themeColor,
    onClick
}: TimelineCardProps) => {

    const cardRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [scrollScale, setScrollScale] = useState(0.85);
    const [scrollOpacity, setScrollOpacity] = useState(0.4);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const ratio = entry.intersectionRatio;
                    if (ratio > 0.6) {
                        setIsVisible(true);
                        setScrollScale(1.05);
                        setScrollOpacity(1);
                    } else if (ratio > 0.3) {
                        setIsVisible(false);
                        setScrollScale(0.95);
                        setScrollOpacity(0.7);
                    } else {
                        setIsVisible(false);
                        setScrollScale(0.85);
                        setScrollOpacity(0.4);
                    }
                });
            },
            {
                root: null,
                rootMargin: '-10% 0px -10% 0px',
                threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
            }
        );

        const currentRef = cardRef.current;
        if (currentRef) observer.observe(currentRef);
        return () => { if (currentRef) observer.unobserve(currentRef); };
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'movie': return <Film size={18} />;
            case 'season': return <Tv size={18} />;
            case 'episode': return <Play size={18} fill="currentColor" />;
            case 'volume': return <Book size={18} />;
            case 'saga': return <Zap size={18} />;
            case 'special': return <Star size={18} />;
            case 'spin-off': return <AlertCircle size={18} />;
            case 'novel': return <BookOpen size={18} />;
            default: return <Circle size={18} />;
        }
    };

    const getThemeMap = (theme: string) => {
        // Returns a set of colors for a specific theme
        const maps: Record<string, any> = {
            'blue': { border: 'border-blue-500', shadow: 'shadow-blue-500/50', bg: 'bg-blue-500', badge: 'bg-blue-500 border-blue-400', text: 'text-blue-400' },
            'red': { border: 'border-red-600', shadow: 'shadow-red-600/50', bg: 'bg-red-600', badge: 'bg-red-600 border-red-400', text: 'text-red-500' },
            'emerald': { border: 'border-emerald-500', shadow: 'shadow-emerald-500/50', bg: 'bg-emerald-500', badge: 'bg-emerald-500 border-emerald-400', text: 'text-emerald-400' },
            'purple': { border: 'border-purple-500', shadow: 'shadow-purple-500/50', bg: 'bg-purple-500', badge: 'bg-purple-600 border-purple-400', text: 'text-purple-400' },
            'zinc': { border: 'border-slate-500', shadow: 'shadow-slate-500/50', bg: 'bg-slate-500', badge: 'bg-slate-600 border-slate-400', text: 'text-slate-400' },
            'orange': { border: 'border-orange-500', shadow: 'shadow-orange-500/50', bg: 'bg-orange-500', badge: 'bg-orange-500 border-orange-300', text: 'text-orange-400' },
            'pink': { border: 'border-pink-500', shadow: 'shadow-pink-500/50', bg: 'bg-pink-500', badge: 'bg-pink-500 border-pink-300', text: 'text-pink-400' },
            'lime': { border: 'border-lime-500', shadow: 'shadow-lime-500/50', bg: 'bg-lime-500', badge: 'bg-lime-500 border-lime-300', text: 'text-lime-400' },
            'yellow': { border: 'border-yellow-400', shadow: 'shadow-yellow-400/50', bg: 'bg-yellow-400', badge: 'bg-yellow-500 border-yellow-300', text: 'text-yellow-400' },
        };
        return maps[theme] || null;
    };

    // Determine active colors: Use Item Theme if exists, otherwise fall back to Parent Props
    const itemThemeColors = item.theme ? getThemeMap(item.theme) : null;

    const activeBorderColor = itemThemeColors ? itemThemeColors.border : borderColor;
    const activeShadowColor = itemThemeColors ? itemThemeColors.shadow : shadowColor;
    const activeBgColor = itemThemeColors ? itemThemeColors.bg : themeColor;
    const activeTextColor = itemThemeColors ? itemThemeColors.text : textColor;

    // Function to determine badge style, allowing overrides from item.theme
    const getBadgeColor = (type: string, themeOverride?: string) => {
        // Maps defined themes to Tailwind classes
        const themeMap: Record<string, string> = {
            'blue': 'bg-blue-500 text-white border-blue-400',
            'red': 'bg-red-600 text-white border-red-400',
            'emerald': 'bg-emerald-500 text-white border-emerald-400',
            'purple': 'bg-purple-600 text-white border-purple-400',
            'zinc': 'bg-slate-600 text-white border-slate-400',
            'orange': 'bg-orange-500 text-white border-orange-300',
            'yellow': 'bg-yellow-500 text-black border-yellow-300',
            'pink': 'bg-pink-500 text-white border-pink-400',
            'lime': 'bg-lime-500 text-white border-lime-400'
        };

        if (themeOverride && themeMap[themeOverride]) {
            return themeMap[themeOverride];
        }

        switch (type) {
            case 'movie': return 'bg-lime-600 text-white border-lime-400';
            case 'season': return 'bg-blue-600 text-white border-blue-400';
            case 'episode': return 'bg-yellow-500 text-black border-yellow-300';
            case 'volume': return 'bg-slate-700 text-white border-slate-500';
            case 'saga': return 'bg-yellow-500 text-black border-yellow-300';
            case 'special': return 'bg-pink-600 text-white border-pink-400';
            case 'spin-off': return 'bg-orange-600 text-white border-orange-400';
            case 'novel': return 'bg-pink-600 text-white border-pink-400';
            default: return 'bg-gray-600 text-white';
        }
    };

    const getTextColor = (theme: string) => {
        const map: Record<string, string> = {
            'blue': 'text-blue-400',
            'red': 'text-red-500',
            'emerald': 'text-emerald-400',
            'purple': 'text-purple-400',
            'zinc': 'text-slate-400',
            'orange': 'text-orange-400',
            'yellow': 'text-yellow-400',
        };
        return map[theme] || textColor;
    }

    const currentScale = isHovered ? 1.15 : scrollScale;
    const currentOpacity = isHovered ? 1 : scrollOpacity;
    const currentZIndex = isHovered ? 50 : (isVisible ? 10 : 0);

    const activeStyle = (isVisible || isHovered)
        ? `border-4 ${activeBorderColor} ${activeShadowColor} shadow-[0_0_50px_-10px_rgba(0,0,0,0.3)] bg-slate-900`
        : 'border border-white/10 bg-slate-900/50 grayscale-[0.5]';

    const isPlayable = item.type === 'episode' || item.type === 'movie' || item.type === 'special';
    const cursorClass = isPlayable ? 'cursor-pointer' : 'cursor-default';

    // Use custom text color if theme is present on episode, otherwise fallback to prop
    const displayTextColor = item.theme ? getTextColor(item.theme) : textColor;

    return (
        <div
            ref={cardRef}
            onClick={() => isPlayable && onClick && onClick(item)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`relative transition-all duration-300 ease-out flex items-center justify-center my-4 ${cursorClass}`}
            style={{
                transform: `scale(${currentScale})`,
                opacity: currentOpacity,
                zIndex: currentZIndex
            }}
        >
            <div
                className={`w-full p-6 rounded-3xl relative overflow-hidden group ${activeStyle} transition-colors duration-300`}
            >
                {(isVisible || isHovered) && (
                    <div className="absolute top-0 right-0 w-32 h-32 opacity-10 bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-white to-transparent" style={{ backgroundSize: '4px 4px' }}></div>
                )}

                <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-4">
                    <div className={`text-4xl font-black italic opacity-20 ${displayTextColor} absolute -top-2 -right-2 select-none`}>
                        #{String(index + 1).padStart(3, '0')}
                    </div>

                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border-2 ${getBadgeColor(item.type, item.theme)} transition-transform duration-500 ${(isVisible || isHovered) ? 'rotate-[-10deg] scale-110' : 'rotate-0'}`}>
                        {getIcon(item.type)}
                    </div>

                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`text-[10px] uppercase font-bold tracking-wider py-0.5 px-2 rounded border ${getBadgeColor(item.type, item.theme)}`}>
                                {item.type === 'episode' ? item.season : item.type}
                            </span>

                            {isPlayable && isHovered && (
                                <span className="text-[10px] uppercase font-bold tracking-wider py-0.5 px-2 rounded bg-white text-black animate-pulse">
                                    Click to Watch
                                </span>
                            )}

                            {item.note && (
                                <span className="text-[10px] uppercase font-bold tracking-wider py-0.5 px-2 rounded border border-yellow-500/50 text-yellow-500 animate-pulse">
                                    Note
                                </span>
                            )}
                        </div>

                        <h3 className={`text-xl md:text-2xl font-black uppercase tracking-tight leading-none mb-1 ${(isVisible || isHovered) ? 'text-white' : 'text-slate-300'}`}>
                            {item.title}
                        </h3>

                        {item.type === 'episode' ? (
                            <p className={`font-medium ${(isVisible || isHovered) ? displayTextColor : 'text-slate-500'}`}>
                                Episode {item.episodeNumber}
                            </p>
                        ) : (
                            <p className={`font-medium ${(isVisible || isHovered) ? textColor : 'text-slate-500'}`}>
                                {item.detail}
                            </p>
                        )}

                        {item.sub && (
                            <p className="text-sm text-slate-400 mt-1 font-mono">
                                {item.sub}
                            </p>
                        )}
                    </div>
                </div>

                {/* Bottom Shimmer Bar */}
                {(isVisible || isHovered) && (
                    <div className={`absolute bottom-0 left-0 h-1 w-full ${activeBgColor} animate-[shimmer_2s_infinite]`}></div>
                )}
            </div>
        </div>
    );
};

export default TimelineCard;