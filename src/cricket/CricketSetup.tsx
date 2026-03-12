import { useState } from 'react';
import { Crosshair, UserPlus, Play, RotateCcw } from 'lucide-react';
import type { CricketGameState } from './types';

interface Props {
    savedGame: CricketGameState | null;
    onStart: (playerNames: string[]) => void;
    onResume: () => void;
}

export function CricketSetup({ savedGame, onStart, onResume }: Props) {
    const [count, setCount] = useState(2);
    const [names, setNames] = useState<string[]>(['', '']);

    const handleCountChange = (n: number) => {
        setCount(n);
        setNames(prev => {
            const next = [...prev];
            while (next.length < n) next.push('');
            return next.slice(0, n);
        });
    };

    const setName = (i: number, val: string) => {
        setNames(prev => {
            const next = [...prev];
            next[i] = val;
            return next;
        });
    };

    const canStart = names.every(n => n.trim().length > 0);

    const handleStart = () => {
        if (!canStart) return;
        onStart(names.map(n => n.trim()));
    };

    return (
        <div className="p-4 space-y-6 pb-24">
            {/* Header */}
            <div className="flex items-center gap-3 pt-2">
                <div className="bg-violet-500/20 p-3 rounded-2xl">
                    <Crosshair className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-white tracking-tight">Hidden Cricket</h2>
                    <p className="text-xs text-slate-500 font-medium">Cut-Throat · Fog of War</p>
                </div>
            </div>

            {/* Resume saved game */}
            {savedGame && savedGame.status === 'playing' && (
                <button
                    onClick={onResume}
                    className="w-full bg-violet-600/20 border border-violet-500/40 text-violet-300 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-violet-600/30"
                >
                    <RotateCcw className="w-5 h-5" />
                    Reprendre la partie en cours
                    <span className="ml-1 text-xs text-violet-400 font-normal">
                        ({savedGame.players.map(p => p.name).join(', ')})
                    </span>
                </button>
            )}

            {/* Player count */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-violet-400" />
                    Nombre de joueurs
                </h3>
                <div className="flex gap-2">
                    {[2, 3, 4, 5].map(n => (
                        <button
                            key={n}
                            onClick={() => handleCountChange(n)}
                            className={`flex-1 py-3 rounded-xl font-black text-lg transition-all active:scale-95 ${count === n
                                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            {n}
                        </button>
                    ))}
                </div>
            </div>

            {/* Player names */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Joueurs</h3>
                {Array.from({ length: count }, (_, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-black text-sm shrink-0">
                            {i + 1}
                        </div>
                        <input
                            type="text"
                            value={names[i] || ''}
                            onChange={e => setName(i, e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleStart()}
                            placeholder={`Joueur ${i + 1}`}
                            className="flex-1 bg-slate-950 border border-slate-700/50 rounded-xl px-4 py-3 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-medium placeholder:text-slate-600 text-base text-white"
                        />
                    </div>
                ))}
            </div>

            {/* Rules summary */}
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-4 space-y-2 text-xs text-slate-500">
                <p className="text-slate-400 font-bold mb-1">Règles du Hidden Cricket</p>
                <p>🎯 7 cibles <strong className="text-slate-300">secrètes</strong> — révélées uniquement si vous les touchez.</p>
                <p>✂️ <strong className="text-slate-300">Cut-Throat</strong> : une fois une cible fermée, vos touches supplémentaires donnent des points à vos adversaires.</p>
                <p>🏆 Gagne : le premier à fermer les 7 cibles avec le score le plus bas.</p>
            </div>

            {/* Start button */}
            <button
                onClick={handleStart}
                disabled={!canStart}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-violet-600/20 disabled:shadow-none"
            >
                <Play className="w-5 h-5" />
                Nouvelle partie
            </button>
        </div>
    );
}
