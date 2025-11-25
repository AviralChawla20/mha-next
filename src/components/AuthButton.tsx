'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation'; // <--- 1. IMPORT ROUTER

interface AuthButtonProps {
    allowSignIn?: boolean;
    className?: string;
}

export default function AuthButton({ allowSignIn = true, className = '' }: AuthButtonProps) {
    const [user, setUser] = useState<User | null>(null);
    const supabase = createClient();
    const router = useRouter(); // <--- 2. INITIALIZE ROUTER

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${location.origin}/auth/callback`,
            },
        });
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/'); // <--- 3. REDIRECT TO HOME
        router.refresh(); // <--- 4. FORCE REFRESH (Optional, clears server cache)
    };

    if (user) {
        return (
            <div className={`flex items-center gap-3 ${className}`}>
                <div className="hidden md:flex flex-col text-right">
                    <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest">Hero</span>
                    <span className="text-sm font-bold text-white">{user.user_metadata.full_name?.split(' ')[0]}</span>
                </div>

                {user.user_metadata.avatar_url ? (
                    <img
                        src={user.user_metadata.avatar_url}
                        alt="Profile"
                        className="w-10 h-10 rounded-full border-2 border-yellow-400"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-500">
                        <UserIcon size={18} />
                    </div>
                )}

                <button
                    onClick={handleLogout}
                    className="p-2 rounded-full bg-slate-800 hover:bg-red-600 hover:text-white text-slate-400 transition-colors border border-white/10"
                    title="Sign Out"
                >
                    <LogOut size={18} />
                </button>
            </div>
        );
    }

    if (allowSignIn) {
        return (
            <div className={className}>
                <button
                    onClick={handleLogin}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-full font-bold text-sm hover:bg-yellow-400 hover:scale-105 transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                >
                    <img src="https://authjs.dev/img/providers/google.svg" className="w-4 h-4" alt="G" />
                    <span>Sign In</span>
                </button>
            </div>
        );
    }

    return null;
}