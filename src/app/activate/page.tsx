'use client';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Smartphone, Zap, Check } from 'lucide-react';
import AuthButton from '@/components/AuthButton';

export default function ActivatePage() {
    const supabase = createClient();
    const [code, setCode] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleActivate = async () => {
        setStatus('loading');

        // 1. Get MY current session (on the phone)
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            alert("You must be logged in on this device first!");
            setStatus('idle');
            return;
        }

        // 2. Send BOTH tokens to the TV
        const { error } = await supabase
            .from('tv_codes')
            .update({
                refresh_token: session.refresh_token,
                access_token: session.access_token // <--- NOW SENDING THIS
            })
            .eq('code', code.toUpperCase());

        if (error) {
            console.error(error);
            setStatus('error');
        } else {
            setStatus('success');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-slate-900 border border-cyan-500/30 p-8 rounded-2xl text-center">
                <Smartphone className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                <h1 className="text-2xl font-black text-white italic uppercase mb-2">Device Uplink</h1>

                {status === 'success' ? (
                    <div className="text-green-400 animate-pulse flex flex-col items-center gap-2">
                        <Check size={40} />
                        <p>UPLINK ESTABLISHED. CHECK YOUR TV.</p>
                    </div>
                ) : (
                    <>
                        <p className="text-slate-400 mb-6 text-sm">Enter the code displayed on your TV screen.</p>

                        {/* Show login button if not logged in on phone yet */}
                        <div className="mb-6"><AuthButton /></div>

                        <input
                            type="text"
                            maxLength={6}
                            className="w-full bg-slate-950 border border-slate-700 text-white text-3xl font-mono text-center p-4 rounded-lg tracking-widest uppercase focus:border-yellow-400 outline-none mb-4"
                            placeholder="CODE"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                        />

                        <button
                            onClick={handleActivate}
                            disabled={status === 'loading'}
                            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg uppercase tracking-wider flex items-center justify-center gap-2"
                        >
                            {status === 'loading' ? 'SYNCING...' : 'ACTIVATE'} <Zap size={18} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}