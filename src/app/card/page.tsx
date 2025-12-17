'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Star, Quote, Fingerprint, Calendar, Ruler, Droplet } from 'lucide-react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHandFist } from "@fortawesome/free-solid-svg-icons";
import { Rajdhani, Bebas_Neue } from 'next/font/google';

export default function TradingCardPage() {
    const router = useRouter();
    const [isHovered, setIsHovered] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const sound = '/sounds/shimmer.mp3';
    

    // --- AUDIO LOGIC ---
    useEffect(() => {
        if (isHovered && audioRef.current) {
            audioRef.current.volume = 1.0;
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch((e) => console.log("Audio play failed:", e));
        }
    }, [isHovered]);

    // --- CONFIG ---
    const cardData = {
        id: "01-001",
        rarity: "SR",
        type: "MELEE",
        quirk: "One For All",
        stats: {
            power: 5,
            speed: 4,
            technique: 4,
            intelligence: 4,
            aura: 1
        },
        colors: {
            primary: "text-emerald-400",
            border: "border-emerald-500",
            bg: "bg-emerald-950",
            chartFill: "rgba(52, 211, 153, 0.4)",
            chartStroke: "#34d399"
        },
        images: {
            civilian: "/izuku-civilian.png",
            hero: "https://i.ibb.co/kVfwwv7p/Izuku-Midoriya.png"
        },
        // --- DATA STATES (Student vs Hero) ---
        student: {
            name: "IZUKU MIDORIYA",
            subName: "MIDORIYA",
            quote: "A smiling, dependable, cool hero... That's what I want to be!",
            description: "Born without a Quirk in a world where they are the norm, he inherited One For All from All Might. Though timid, his analysis skills and determination are top-tier."
        },
        hero: {
            name: "DEKU",
            subName: "DEKU",
            quote: "I have to work harder than anyone else to make it! SMASH!!",
            description: "Harnessing the stockpile of power from One For All, Deku utilizes 'Full Cowling' to boost his mobility. He saves everyone with a smile, regardless of the cost to himself."
        },
        bio: {
            age: "16",
            height: "166 cm",
            birthday: "July 15",
            bloodType: "O"
        }
    };

    // Radar Chart Calculation
    const calculatePoint = (value: number, index: number, total: number) => {
        const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
        const radius = (value / 5) * 45;
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);
        return `${x},${y}`;
    };

    const statsArray = [
        cardData.stats.power,
        cardData.stats.speed,
        cardData.stats.intelligence,
        cardData.stats.aura,
        cardData.stats.technique
    ];

    const polygonPoints = statsArray.map((val, i) => calculatePoint(val, i, 5)).join(" ");
    const fullPoints = [5, 5, 5, 5, 5].map((val, i) => calculatePoint(val, i, 5)).join(" ");

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden font-sans">

            <audio ref={audioRef} src={sound} preload="auto" />

            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[url('/hud.png')] opacity-20 pointer-events-none bg-cover"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-black via-slate-900/90 to-slate-900/50 pointer-events-none"></div>

            {/* Header */}
            <div className="absolute top-6 left-6 z-50">
                <button onClick={() => router.push('/')} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors uppercase font-bold tracking-widest text-xs">
                    <ChevronLeft size={16} /> Exit Card View
                </button>
            </div>

            {/* --- MAIN LAYOUT CONTAINER --- */}
            {/* Added scale-90 to fit the larger card on standard 1080p screens, remove scale if you want it huge */}
            <div className="flex flex-row items-center justify-center gap-20 w-full max-w-[1600px] z-10 p-12 scale-90">

                {/* === LEFT PANEL (Description & Details) === */}
                <div className="w-[500px] text-white space-y-8 animate-in slide-in-from-left-10 duration-700 fade-in">

                    {/* 1. Header & Dynamic Name */}
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-2 opacity-50">
                            <div className={`h-[2px] transition-all duration-500 ease-out ${isHovered ? 'bg-emerald-400 w-24' : 'bg-white w-12'}`}></div>
                            <span className="text-xs font-bold tracking-[0.3em] uppercase">
                                {isHovered ? 'HERO DATA LOG' : 'STUDENT FILE'}
                            </span>
                        </div>

                        {/* Name Swap Container */}
                        <div className="relative h-32">
                            {/* Civilian Name */}
                            <h1 className={`text-7xl font-black italic uppercase leading-none tracking-tighter absolute top-0 left-0 transition-all duration-500 origin-bottom-left ${isHovered ? 'opacity-0 translate-y-8 rotate-3 blur-sm' : 'opacity-100 translate-y-0 rotate-0 blur-0'}`}>
                                IZUKU<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">MIDORIYA</span>
                            </h1>

                            {/* Hero Name */}
                            <h1 className={`text-8xl font-black italic uppercase leading-none tracking-tighter text-emerald-400 absolute top-0 left-0 transition-all duration-500 origin-bottom-left ${isHovered ? 'opacity-100 translate-y-0 rotate-0 blur-0' : 'opacity-0 -translate-y-8 -rotate-3 blur-sm'}`}>
                                
                                <span className="text-white drop-shadow-[0_0_25px_rgba(52,211,153,0.6)]">DEKU</span>
                            </h1>
                        </div>
                    </div>

                    {/* 2. DYNAMIC QUOTE */}
                    <div className={`relative pl-6 py-4 border-l-4 transition-all duration-500 ${isHovered ? 'border-emerald-400 bg-emerald-950/30' : 'border-slate-600'}`}>
                        <Quote size={24} className={`absolute -top-3 -left-3 bg-slate-950 p-1 transition-colors duration-500 ${isHovered ? 'text-emerald-400' : 'text-slate-600'}`} />

                        <div className="relative min-h-[4rem]">
                            {/* Student Quote */}
                            <p className={`text-2xl italic font-serif text-white/90 leading-relaxed absolute top-0 left-0 transition-all duration-500 ${isHovered ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
                                "{cardData.student.quote}"
                            </p>
                            {/* Hero Quote */}
                            <p className={`text-2xl italic font-serif text-emerald-100 leading-relaxed absolute top-0 left-0 transition-all duration-500 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                                "{cardData.hero.quote}"
                            </p>
                        </div>
                    </div>

                    {/* 3. DYNAMIC DESCRIPTION */}
                    <div className="relative min-h-[5rem]">
                        <p className={`text-slate-400 leading-relaxed text-xl absolute top-0 left-0 transition-all duration-500 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
                            {cardData.student.description}
                        </p>
                        <p className={`text-emerald-100/80 leading-relaxed text-xl absolute top-0 left-0 transition-all duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                            {cardData.hero.description}
                        </p>
                    </div>

                    {/* 4. Personal Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                        {/* Age */}
                        <div className="flex items-center gap-3 group/stat">
                            <div className={`p-2 rounded transition-colors duration-300 ${isHovered ? 'bg-emerald-900/50 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                                <Fingerprint size={18} />
                            </div>
                            <div>
                                <p className="text-[20px] uppercase tracking-widest text-slate-500">Age</p>
                                <p className="font-bold font-mono text-2xl">{cardData.bio.age}</p>
                            </div>
                        </div>

                        {/* Birthday */}
                        <div className="flex items-center gap-3 group/stat">
                            <div className={`p-2 rounded transition-colors duration-300 ${isHovered ? 'bg-emerald-900/50 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                                <Calendar size={18} />
                            </div>
                            <div>
                                <p className="text-[20px] uppercase tracking-widest text-slate-500">Birthday</p>
                                <p className="font-bold font-mono text-2xl">{cardData.bio.birthday}</p>
                            </div>
                        </div>

                        {/* Height */}
                        <div className="flex items-center gap-3 group/stat">
                            <div className={`p-2 rounded transition-colors duration-300 ${isHovered ? 'bg-emerald-900/50 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                                <Ruler size={18} />
                            </div>
                            <div>
                                <p className="text-[20px] uppercase tracking-widest text-slate-500">Height</p>
                                <p className="font-bold font-mono text-2xl">{cardData.bio.height}</p>
                            </div>
                        </div>

                        {/* Blood Type */}
                        <div className="flex items-center gap-3 group/stat">
                            <div className={`p-2 rounded transition-colors duration-300 ${isHovered ? 'bg-emerald-900/50 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                                <Droplet size={18} />
                            </div>
                            <div>
                                <p className="text-[20px] uppercase tracking-widest text-slate-500">Blood Type</p>
                                <p className="font-bold font-mono text-2xl">{cardData.bio.bloodType}</p>
                            </div>
                        </div>
                    </div>
                </div>


                {/* === RIGHT PANEL (Trading Card) === */}
                {/* RESTORED SIZE: w-[600px] h-[900px] */}
                <div
                    className="relative w-[600px] h-[900px] rounded-[2rem] transition-all duration-500 transform hover:scale-[1.02] hover:rotate-1 perspective-container group cursor-pointer"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {/* 1. CARD BORDER & FRAME */}
                    <div className={`absolute inset-0 rounded-[2rem] border-[12px] ${cardData.colors.border} bg-slate-900 overflow-hidden shadow-2xl z-0`}>

                        {/* Background Burst Lines */}
                        <div className="absolute inset-0 bg-white opacity-5 z-0">
                            <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0_deg,white_10deg,transparent_20deg)] animate-[spin_20s_linear_infinite] opacity-20 scale-150"></div>
                        </div>

                        {/* --- 2. CHARACTER IMAGE LAYER (z-10) --- */}
                        <div className="absolute inset-4 bottom-28 z-10 flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-white/10">
                            <img
                                src={cardData.images.civilian}
                                alt="Civilian"
                                className={`absolute w-full h-full object-cover object-top top-10 transition-all duration-500 ${isHovered ? 'opacity-0 scale-110' : 'opacity-100 scale-80'}`}
                            />
                            <img
                                src={cardData.images.hero}
                                alt="Hero"
                                className={`absolute w-full h-full object-cover object-top top-10 transition-all duration-500 ${isHovered ? 'opacity-100 scale-105' : 'opacity-0 scale-100'}`}
                            />
                        </div>

                        {/* --- 3. UI OVERLAYS --- */}
                        <div className="absolute top-10 left-10 z-30">
                            <div className="w-24 h-24 bg-slate-200 text-slate-900 clip-hexagon flex items-center justify-center border-[5px] border-slate-900 shadow-lg">
                                <FontAwesomeIcon icon={faHandFist} size="4x" />
                            </div>
                        </div>

                        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
                            <div className="flex gap-2 mb-2">
                                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={20} className="fill-yellow-400 text-yellow-400 stroke-[3px] paint-order-stroke" />)}
                            </div>
                            <div className="bg-slate-900 text-white text-sm font-black px-6 py-1.5 rounded-full border border-white/20 uppercase tracking-widest">
                                Type: {cardData.type}
                            </div>
                        </div>

                        {/* Dynamic Name Banner (Card Version) */}
                        <div className="absolute top-16 rotate-[-10deg] right-0 z-11 flex flex-col items-end pointer-events-none">
                            <div className="bg-white skew-x-[-12deg] mr-[-20px] pl-20 pr-14 py-4 border-b-[8px] border-l-[8px] border-slate-900 shadow-lg relative z-10 min-w-[100px] flex justify-end">
                                <div className="relative text-right -z-10">
                                    <h1 className={`text-7xl font-black -z-10 italic uppercase text-slate-900 leading-[0.85] tracking-tighter transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 hidden'}`}>
                                        {cardData.hero.name}
                                    </h1>
                                    <h1 className={`text-6xl font-black italic uppercase text-slate-900 leading-[0.85] tracking-tighter transition-all duration-300 ${!isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 hidden'}`}>
                                        IZUKU
                                    </h1>
                                </div>
                            </div>
                            <div className="mt-[-5px] mr-10 bg-slate-900 border-2 border-white/20 skew-x-[-12deg] px-8 py-1.5 shadow-md relative z-0">
                                <span className="block text-white font-mono text-base font-bold tracking-widest">
                                    {cardData.id} <span className="text-yellow-400 ml-2">{cardData.rarity}</span>
                                </span>
                            </div>
                        </div>

                        {/* --- 4. BOTTOM SECTION --- */}
                        <div className="absolute bottom-10 left-0 z-30 w-2/3 pointer-events-none rotate-[-10deg]">
                            <div className="bg-slate-900/95 border-t-[4px] border-r-[4px] border-white/20 skew-x-[-12deg] ml-[-20px] pl-16 pr-12 py-8 shadow-xl">
                                <div>
                                    <div className="flex items-center gap-3 mb-1 ">
                                        <span className=" text-yellow-400 font-black text-xl italic tracking-widest">QUIRK</span>
                                        <div className="h-1.5 w-16 bg-white/20 rounded-full"></div>
                                    </div>
                                    <h2 className="text-5xl font-black text-white uppercase italic leading-none drop-shadow-md">
                                        {cardData.quirk}
                                    </h2>
                                </div>
                            </div>
                        </div>

                        {/* Radar Chart */}
                        <div className="absolute bottom-10 right-10 z-30 w-40 h-40">
                            <div className="relative w-full h-full bg-slate-900/95 rounded-full border-4 border-white/20 shadow-xl">
                                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                                    <polygon points={fullPoints} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                                    <polygon points={fullPoints} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" transform="scale(0.8) translate(10,10)" />
                                    <polygon points={fullPoints} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" transform="scale(0.6) translate(20,20)" />

                                    <line x1="50" y1="50" x2="50" y2="5" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                                    <line x1="50" y1="50" x2="93" y2="36" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                                    <line x1="50" y1="50" x2="79" y2="90" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                                    <line x1="50" y1="50" x2="21" y2="90" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                                    <line x1="50" y1="50" x2="7" y2="36" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />

                                    <polygon points={polygonPoints} fill={cardData.colors.chartFill} stroke={cardData.colors.chartStroke} strokeWidth="2" className="drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                                    {statsArray.map((val, i) => {
                                        const [cx, cy] = calculatePoint(val, i, 5).split(',');
                                        return <circle key={i} cx={cx} cy={cy} r="2" fill="white" />;
                                    })}
                                </svg>
                                {/* RESTORED LABELS */}
                                <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-black bg-black text-white px-1.5 rounded">PWR</span>
                                <span className="absolute top-[25%] -right-4 text-[9px] font-black bg-black text-white px-1.5 rounded">SPD</span>
                                <span className="absolute bottom-[10%] -right-2 text-[9px] font-black bg-black text-white px-1.5 rounded">INT</span>
                                <span className="absolute bottom-[10%] -left-2 text-[9px] font-black bg-black text-white px-1.5 rounded">AUR</span>
                                <span className="absolute top-[25%] -left-4 text-[9px] font-black bg-black text-white px-1.5 rounded">TCH</span>
                            </div>
                        </div>

                    </div>

                    {/* 5. FOIL OVERLAY */}
                    <div className="absolute inset-0 z-40 rounded-[2rem] pointer-events-none bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay"></div>
                    <div className="absolute inset-0 z-40 rounded-[2rem] pointer-events-none bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.4)_45%,rgba(255,255,255,0.0)_50%)] bg-[length:250%_250%] opacity-0 group-hover:opacity-50 animate-[shimmer_3s_infinite] mix-blend-color-dodge"></div>
                </div>

            </div>
        </div>
    );
}