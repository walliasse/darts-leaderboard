import { Trash2, Edit2, Calendar, History } from 'lucide-react';
import { deleteMatch } from '../lib/storage';
import type { Match, Player } from '../lib/storage';

export function MatchHistory({
    matches,
    players,
    onRefresh,
    onEdit
}: {
    matches: Match[],
    players: Player[],
    onRefresh: () => void,
    onEdit: (match: Match) => void
}) {
    const handleDelete = (matchId: string) => {
        if (confirm("Supprimer ce match et recalculer tout l'Elo ?")) {
            deleteMatch(matchId);
            onRefresh();
        }
    };

    const sortedMatches = [...matches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (sortedMatches.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 h-full mt-20">
                <History className="w-12 h-12 mb-4 text-slate-600" />
                <p>Aucun match joué.</p>
                <p className="text-sm mt-1">Allez dans "Nouveau" pour démarrer.</p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-3 pb-24 h-full">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 px-2 flex items-center justify-between mt-2">
                <span>Historique complet</span>
                <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{sortedMatches.length}</span>
            </h3>

            {sortedMatches.map(match => {
                const date = new Date(match.date);
                const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                // Sort players in this match by rank
                const sortedMatchPlayers = [...match.players].sort((a, b) => a.rank - b.rank);

                return (
                    <div key={match.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-500 border-b border-slate-800/50 pb-2">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formattedDate}
                            </span>
                            <div className="flex gap-1">
                                <button onClick={() => onEdit(match)} className="p-1 hover:text-indigo-400 active:scale-95 transition-all outline-none">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(match.id)} className="p-1 hover:text-rose-500 active:scale-95 transition-all outline-none">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {sortedMatchPlayers.map((mp) => {
                                const globalPlayer = players.find(p => p.id === mp.playerId);
                                const isWinner = mp.rank === 1;
                                return (
                                    <div key={mp.playerId} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-5 text-center font-black ${isWinner ? 'text-amber-500' : 'text-slate-500'}`}>
                                                {mp.rank}
                                            </span>
                                            <span className={`font-medium ${isWinner ? 'text-white' : 'text-slate-300'}`}>
                                                {globalPlayer?.name || 'Inconnu'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-slate-500 text-[10px] w-8 text-right">
                                                {mp.score}pts
                                            </span>
                                            <span className={`font-bold font-mono text-right w-12 ${mp.variationTotale > 0 ? 'text-emerald-400' : mp.variationTotale < 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                                                {mp.variationTotale > 0 ? '+' : ''}{mp.variationTotale}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
