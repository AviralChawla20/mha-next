'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // <--- Import Link
import { Search, ChevronLeft, Zap, Shield, User } from 'lucide-react';

// Mock Character Data (You can replace this with a real DB fetch or extensive data file later)
const initialCharacters = [
    { id: 1, name: 'Izuku Midoriya', heroName: 'Deku', quirk: 'One For All', affiliation: 'U.A. High', image: 'https://i.ibb.co/kVfwwv7p/Izuku-Midoriya.png' },
    { id: 2, name: 'Katsuki Bakugo', heroName: 'Great Explosion Murder God Dynamight', quirk: 'Explosion', affiliation: 'U.A. High', image: 'https://i.ibb.co/0yXq2gq/Bakugo.png' },
    { id: 3, name: 'Shoto Todoroki', heroName: 'Shoto', quirk: 'Half-Cold Half-Hot', affiliation: 'U.A. High', image: 'https://i.ibb.co/5Gz1X1d/Todoroki.png' },
    { id: 4, name: 'Ochaco Uraraka', heroName: 'Uravity', quirk: 'Zero Gravity', affiliation: 'U.A. High', image: 'https://i.ibb.co/7jXq2gq/Uraraka.png' },
    { id: 5, name: 'Toshinori Yagi', heroName: 'All Might', quirk: 'One For All', affiliation: 'Pro Hero (Retired)', image: 'https://i.ibb.co/Y4mSbpt6/Adobe-Express-file.png' },
];

export default function CharactersPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [characters, setCharacters] = useState(initialCharacters);

    // Filter logic
    useEffect(() => {
        const filtered = initialCharacters.filter(char =>
            char.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            char.heroName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            char.quirk.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setCharacters(filtered);
    }, [searchTerm]);

    return (
        <div className="min-h-screen w-full bg-slate-950 flex flex-col relative overflow-hidden font-sans text-white">

            {/* Background Tech Layer */}
            <div className="absolute inset-0 bg-tech-grid opacity-10 pointer-events-none"></div>
            <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-900 to-black pointer-events-none"></div>

            {/* Header */}
            <div className="relative z-20 pt-24 pb-8 px-6 max-w-7xl mx-auto w-full">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                    <div>
                        <button
                            onClick={() => router.push('/')}
                            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-2 text-sm uppercase tracking-widest font-bold"
                        >
                            <ChevronLeft size={16} /> Return to Dashboard
                        </button>
                        <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                            Hero <span className="text-cyan-400">Encyclopedia</span>
                        </h1>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full md:w-96">
                        <input
                            type="text"
                            placeholder="Search Database..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900/80 border border-cyan-500/30 rounded-full py-3 pl-12 pr-6 text-white focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all placeholder-slate-500"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500" size={20} />
                    </div>
                </div>

                {/* Character Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                    {characters.map((char) => (
                        // WRAPPER LINK
                        <Link key={char.id} href={`/characters/${char.id}`} className="block group">
                            <div className="group relative bg-slate-900 border border-white/10 rounded-2xl overflow-hidden hover:border-cyan-400/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] h-full flex flex-col">

                                {/* Image Area */}
                                <div className="h-64 w-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-950 relative overflow-hidden flex items-end justify-center">
                                    <div className="absolute inset-0 bg-tech-grid opacity-20"></div>
                                    <img
                                        src={char.image}
                                        alt={char.name}
                                        className="h-[110%] w-auto object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-2xl"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                    {/* Name Overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 to-transparent p-6 pt-20">
                                        <h2 className="text-2xl font-black italic uppercase text-white leading-none">{char.heroName}</h2>
                                        <p className="text-cyan-400 font-bold text-sm tracking-wide">{char.name}</p>
                                    </div>
                                </div>

                                {/* Stats / Info */}
                                <div className="p-6 bg-slate-900/50 backdrop-blur-sm border-t border-white/5 space-y-3 flex-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2 text-slate-400"><Zap size={16} className="text-yellow-400" /> Quirk</span>
                                        <span className="font-bold text-white text-right">{char.quirk}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2 text-slate-400"><Shield size={16} className="text-emerald-400" /> Affiliation</span>
                                        <span className="font-bold text-white text-right">{char.affiliation}</span>
                                    </div>

                                    {/* Decorative Bar */}
                                    <div className="w-full h-1 bg-slate-800 rounded-full mt-4 overflow-hidden">
                                        <div className="h-full bg-cyan-500 w-[60%] group-hover:w-full transition-all duration-700"></div>
                                    </div>
                                </div>

                            </div>
                        </Link>
                    ))}
                </div>

                {characters.length === 0 && (
                    <div className="text-center py-20 text-slate-500 font-mono">
                        <p className="text-xl">NO RECORDS FOUND</p>
                        <p className="text-sm">Adjust search parameters</p>
                    </div>
                )}

            </div>
        </div>
    );
}