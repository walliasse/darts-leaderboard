import type { Player } from '../lib/storage';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function Leaderboard({ players }: { players: Player[] }) {
    if (players.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 h-full mt-20">
                <p>Aucun joueur enregistré.</p>
                <p className="text-sm mt-1">Allez dans "Joueurs" pour en ajouter.</p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-3 pb-24">
            {players.map((p, i) => {
                const winRate = p.matchesPlayed > 0 ? Math.round((p.wins / p.matchesPlayed) * 100) : 0;
                const avgScore = p.matchesPlayed > 0 ? Math.round(p.pointsReceivedTotal / p.matchesPlayed) : 0;

                return (
                    <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 transition-transform active:scale-[0.98]">
                        {/* Rank */}
                        <div className={`
              w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shrink-0
              ${i === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]' :
                                i === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/30' :
                                    i === 2 ? 'bg-amber-700/20 text-amber-600 border border-amber-700/30' :
                                        'bg-white/5 text-slate-500 border border-white/10'}
            `}>
                            {i + 1}
                        </div>

                        {/* Context */}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                                <h3 className="font-bold text-lg truncate pr-2 text-white">{p.name}</h3>
                                <span className="font-mono text-xl font-black text-indigo-400">{Math.round(p.elo)}</span>
                            </div>
                            <div className="flex items-center text-[11px] text-slate-400 gap-3 font-medium">
                                <span className="bg-slate-950 px-1.5 py-0.5 rounded">{p.matchesPlayed} M</span>
                                <span className="bg-slate-950 px-1.5 py-0.5 rounded">{winRate}% WR</span>
                                <span className="bg-slate-950 px-1.5 py-0.5 rounded">{avgScore} pts/M</span>
                            </div>
                        </div>

                        {/* Trend */}
                        <div className="flex flex-col items-end justify-center shrink-0">
                            <TrendIndicator trend={p.lastTrend} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function TrendIndicator({ trend }: { trend: number }) {
    if (trend > 0) {
        return (
            <div className="flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg text-xs font-bold">
                <TrendingUp className="w-3 h-3" />
                +{Math.round(trend)}
            </div>
        );
    }
    if (trend < 0) {
        return (
            <div className="flex items-center gap-1 text-rose-400 bg-rose-400/10 px-2 py-1 rounded-lg text-xs font-bold">
                <TrendingDown className="w-3 h-3" />
                {Math.round(trend)}
            </div>
        );
    }
    return (
        <div className="flex items-center gap-1 text-slate-500 bg-slate-500/10 px-2 py-1 rounded-lg text-xs font-bold">
            <Minus className="w-3 h-3" />
            0
        </div>
    );
}
