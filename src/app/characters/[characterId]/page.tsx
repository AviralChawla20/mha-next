'use client';

import React, { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Zap, Activity, Users, Shield } from 'lucide-react';
import { characterData } from '@/data';

export default function CharacterProfile() {
    const params = useParams();
    const router = useRouter();
    const id = params.characterId as string;

    // Ensure char exists, fallback to first if not found to prevent crashes
    const char = characterData.find((c: any) => String(c.id) === id) || characterData[0];

    // Helper to extract the color name (e.g., "red" from "text-red-500") for background/glow utilities
    const colorName = char.color.split('-')[1] || 'slate';

    const [isHovered, setIsHovered] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const handleMouseEnter = () => {
        setIsHovered(true);
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.volume = 0.4;
            audioRef.current.play().catch(e => console.log("Audio play blocked", e));
        }
    };

    const primaryName = isHovered ? char.heroName : char.name;
    const secondaryName = isHovered ? char.name : char.heroName;

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans overflow-hidden relative selection:bg-cyan-500 selection:text-black">

            <audio ref={audioRef} src={char.sound} preload="auto" />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black z-0"></div>
            <div className="absolute inset-0 bg-[url('/hud.png')] opacity-5 mix-blend-screen pointer-events-none z-0 bg-cover"></div>

            <header className="fixed top-0 left-0 p-6 z-50">
                <button
                    onClick={() => router.push('/characters')}
                    className="flex items-center gap-2 bg-black/50 hover:bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 transition-all text-sm uppercase tracking-widest font-bold text-slate-300 hover:text-white group"
                >
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Database
                </button>
            </header>

            <main className="relative z-10 flex flex-col lg:flex-row h-screen pt-20 lg:pt-0">

                {/* --- LEFT: DATA COLUMN (Text Aligned Right towards center) --- */}
                <div className="flex-1 flex flex-col justify-center items-center lg:items-end p-6 lg:pr-20 overflow-y-auto hide-scrollbar z-20">

                    <div className="max-w-xl w-full flex flex-col gap-8 items-center lg:items-end text-center lg:text-right">

                        <div className="space-y-1 animate-[slideDown_0.5s_ease-out]">
                            <div className="flex items-center justify-center lg:justify-end gap-3 mb-2">
                                <span className={`px-3 py-1 rounded bg-slate-800 border border-white/10 text-xs font-mono uppercase tracking-wider ${char.color}`}>
                                    {char.affiliation}
                                </span>
                                <span className="text-slate-500 text-xs font-mono uppercase">ID: #{String(char.id).padStart(3, '0')}</span>
                            </div>

                            <h1 className="font-komyca text-5xl md:text-7xl font-black italic uppercase leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 transition-all duration-500 min-h-[80px]">
                                {primaryName}
                            </h1>

                            <h2 className="text-xl md:text-2xl font-bold text-slate-400 tracking-widest uppercase transition-all duration-500">
                                {secondaryName}
                            </h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full">
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                                <div className="flex items-center justify-center lg:justify-end gap-2 text-slate-400 text-xs uppercase mb-1 font-bold">
                                    <Zap size={14} className={char.color} /> Quirk
                                </div>
                                <div className="text-lg font-bold text-white">{char.quirk}</div>
                            </div>
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                                <div className="flex items-center justify-center lg:justify-end gap-2 text-slate-400 text-xs uppercase mb-1 font-bold">
                                    <Activity size={14} className={char.color} /> Blood Type
                                </div>
                                <div className="text-lg font-bold text-white">{char.bloodType}</div>
                            </div>
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                                <div className="flex items-center justify-center lg:justify-end gap-2 text-slate-400 text-xs uppercase mb-1 font-bold">
                                    <Shield size={14} className={char.color} /> Height
                                </div>
                                <div className="text-lg font-bold text-white">{char.height}</div>
                            </div>
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                                <div className="flex items-center justify-center lg:justify-end gap-2 text-slate-400 text-xs uppercase mb-1 font-bold">
                                    <Users size={14} className={char.color} /> Birthday
                                </div>
                                <div className="text-lg font-bold text-white">{char.birthday}</div>
                            </div>
                        </div>

                        <div className="w-full bg-slate-900/80 p-6 rounded-2xl border-l-0 lg:border-r-4 border-slate-700 relative text-left lg:text-right">
                            <p className="text-slate-300 leading-relaxed font-medium relative z-10">
                                {char.description}
                            </p>
                        </div>

                        <div className="space-y-3 w-full">
                            {Object.entries(char.stats).map(([key, val]) => (
                                <div key={key} className="flex items-center gap-4 text-xs font-mono uppercase justify-end">
                                    <span className="w-24 text-slate-400 text-right">{key}</span>
                                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden flex justify-end">
                                        <div
                                            className={`h-full ${char.color.replace('text-', 'bg-')}`}
                                            style={{
                                                width: val === 'S' ? '100%' : val === 'A' ? '85%' : val === 'B' ? '70%' : val === 'C' ? '50%' : '30%'
                                            }}
                                        ></div>
                                    </div>
                                    <span className="w-6 font-bold text-white text-left">{val as string}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* --- RIGHT: INTERACTIVE CHARACTER DISPLAY (Aligned Left towards center) --- */}
                <div className="lg:w-1/2 h-1/2 lg:h-full relative flex items-center justify-center lg:justify-start lg:pl-10 overflow-hidden">

                    <div
                        className="relative w-full h-full cursor-pointer group outline-none flex items-center justify-center lg:justify-start z-30"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        {/* Subtle floor gradient */}
                        <div className={`absolute inset-0 bg-gradient-to-t from-${colorName}-500/10 to-transparent transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}></div>

                        {/* --- STATE 1: CIVILIAN --- */}
                        <div className={`absolute inset-0 flex items-center justify-center lg:justify-start transition-all duration-700 ease-in-out
                            ${isHovered ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'}
                        `}>
                            {/* REMOVED: animate-[pulse_3s_infinite_ease-in-out] */}
                            <img
                                src={char.civilianImage}
                                alt="Civilian Form"
                                className="h-[75%] w-auto object-contain drop-shadow-2xl transition-transform duration-700"
                            />
                        </div>

                        {/* --- STATE 2: HERO --- */}
                        <div className={`absolute inset-0 flex items-center justify-center lg:justify-start transition-all duration-300 ease-out
                            ${isHovered ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-110 translate-y-10'}
                        `}>
                            {/* ADDED: Dynamic Aura Effect Behind Hero */}
                            <div className={`absolute top-1/2 left-1/2 lg:left-1/3 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] bg-${colorName}-500/30 rounded-full blur-[100px] mix-blend-screen pointer-events-none transition-all duration-1000
                                ${isHovered ? 'opacity-100 animate-pulse scale-100' : 'opacity-0 scale-50'}`}
                            ></div>

                            <img
                                src={char.heroImage}
                                alt="Hero Form"
                                className="h-[80%] w-auto object-contain filter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] relative z-10"
                            />
                        </div>

                    </div>
                </div>

            </main>
        </div>
    );
}