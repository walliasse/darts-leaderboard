import { Trophy, RotateCcw, Home } from 'lucide-react';
import type { CricketGameState } from './types';

interface Props {
    state: CricketGameState;
    onNewGame: () => void;
    onHome: () => void;
}

export function CricketWinner({ state, onNewGame, onHome }: Props) {
    // Sort players by score ascending (lowest = best in Cut-Throat)
    const ranked = [...state.players].sort((a, b) => a.score - b.score);
    const winner = state.players.find(p => p.id === state.winnerId) ?? ranked[0];

    const medalColors = [
        'bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-amber-500/20',
        'bg-slate-300/20 text-slate-300 border-slate-300/30',
        'bg-amber-700/20 text-amber-600 border-amber-700/30',
    ];

    return (
        <div className="p-4 space-y-6 pb-24 flex flex-col items-center">
            {/* Banner */}
            <div className="w-full bg-gradient-to-br from-violet-600/30 to-indigo-600/10 border border-violet-500/30 rounded-2xl p-6 flex flex-col items-center text-center space-y-2 shadow-xl shadow-violet-600/10">
                <div className="bg-amber-500/20 p-4 rounded-full mb-2 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                    <Trophy className="w-8 h-8 text-amber-400" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">Victoire !</h2>
                <p className="text-violet-300 font-bold text-lg">{winner.name}</p>
                <p className="text-slate-500 text-xs">a fermé toutes les cibles avec le score le plus bas</p>
            </div>

            {/* Final Rankings */}
            <div className="w-full space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">Classement final</h3>
                {ranked.map((p, i) => (
                    <div
                        key={p.id}
                        className={`bg-slate-900 border rounded-2xl p-4 flex items-center gap-4 ${p.id === winner.id ? 'border-amber-500/30 shadow-lg shadow-amber-500/10' : 'border-slate-800'
                            }`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shrink-0 border ${i < 3 ? medalColors[i] : 'bg-white/5 text-slate-500 border-white/10'
                            } ${i === 0 ? 'shadow-lg' : ''}`}>
                            {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-white truncate">{p.name}</p>
                            <p className="text-xs text-slate-500">
                                {p.marks.filter(m => m >= 3).length} / 7 cibles fermées
                            </p>
                        </div>
                        <div className="text-right">
                            <div className={`font-mono font-black text-xl ${p.score === 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}>
                                {p.score}
                            </div>
                            <div className="text-[10px] text-slate-500 uppercase font-bold">pts reçus</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Reveal what the targets were */}
            <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Les 7 cibles secrètes</h3>
                <div className="flex flex-wrap gap-2">
                    {state.targets.map(t => (
                        <span
                            key={t.value}
                            className="bg-violet-500/20 text-violet-300 border border-violet-500/30 px-3 py-1.5 rounded-xl font-mono font-black text-sm"
                        >
                            {t.value === 25 ? 'Bull' : t.value}
                        </span>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="w-full flex gap-3">
                <button
                    onClick={onHome}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                    <Home className="w-5 h-5" />
                    Accueil
                </button>
                <button
                    onClick={onNewGame}
                    className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-violet-600/20"
                >
                    <RotateCcw className="w-5 h-5" />
                    Rejouer
                </button>
            </div>
        </div>
    );
}
