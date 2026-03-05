import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, AlertCircle, Save, Plus, Minus, X } from 'lucide-react';
import { recordMatch, editMatch } from '../lib/storage';
import type { Player, MatchInputPlayer, Match } from '../lib/storage';

export function MatchEntry({
    players,
    onMatchRecorded,
    editingMatch,
    onCancelEdit
}: {
    players: Player[],
    onMatchRecorded: () => void,
    editingMatch?: Match | null,
    onCancelEdit?: () => void
}) {
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

    // States of ranks and scores map playerId -> number | undefined
    const [ranks, setRanks] = useState<Record<string, number>>({});
    const [scores, setScores] = useState<Record<string, number>>({});

    useEffect(() => {
        if (editingMatch) {
            const ids = editingMatch.players.map(p => p.playerId);
            setSelectedPlayerIds(ids);

            const r: Record<string, number> = {};
            const s: Record<string, number> = {};

            editingMatch.players.forEach(p => {
                r[p.playerId] = p.rank;
                s[p.playerId] = p.score;
            });

            setRanks(r);
            setScores(s);
        } else {
            setSelectedPlayerIds([]);
            setRanks({});
            setScores({});
        }
    }, [editingMatch]);

    const togglePlayer = (id: string) => {
        setSelectedPlayerIds(prev => {
            if (prev.includes(id)) {
                const next = prev.filter(p => p !== id);
                // clean up temp
                const { [id]: _, ...restRanks } = ranks;
                setRanks(restRanks);
                const { [id]: __, ...restScores } = scores;
                setScores(restScores);
                return next;
            } else {
                if (prev.length >= 5) return prev; // max 5
                setRanks(r => ({ ...r, [id]: prev.length + 1 })); // auto assign next rank
                return [...prev, id];
            }
        });
    };

    const setRank = (id: string, rank: number) => {
        setRanks(prev => ({ ...prev, [id]: Math.max(1, rank) }));
    };

    const setScore = (id: string, val: string) => {
        const num = parseInt(val, 10);
        setScores(prev => ({ ...prev, [id]: isNaN(num) ? 0 : num }));
    };

    const isFormValid = selectedPlayerIds.length >= 2 && selectedPlayerIds.every(id => ranks[id] !== undefined && ranks[id] >= 1);

    const handleSubmit = () => {
        if (!isFormValid) return;
        const matchData: MatchInputPlayer[] = selectedPlayerIds.map(id => ({
            playerId: id,
            rank: ranks[id],
            score: scores[id] || 0
        }));

        if (editingMatch) {
            editMatch(editingMatch.id, matchData);
        } else {
            recordMatch(matchData);
        }
        onMatchRecorded();
    };

    if (players.length < 2) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 h-full mt-20">
                <AlertCircle className="w-12 h-12 mb-4 text-slate-600" />
                <p>Il faut au moins 2 joueurs pour jouer.</p>
                <p className="text-sm mt-1">Allez dans "Joueurs" pour en ajouter.</p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6 pb-24">

            {editingMatch && (
                <div className="bg-indigo-600/20 border border-indigo-500/30 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Mode Édition</span>
                    <button onClick={onCancelEdit} className="p-1 hover:bg-white/10 rounded-lg transition-all">
                        <X className="w-4 h-4 text-indigo-400" />
                    </button>
                </div>
            )}

            {/* 1. Sélection Joueurs */}
            <div>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 px-1 flex justify-between items-center">
                    <span>Présents (2-5)</span>
                    <span className="text-indigo-400 font-black">{selectedPlayerIds.length}/5</span>
                </h2>
                <div className="flex flex-wrap gap-2">
                    {players.map(p => {
                        const isSelected = selectedPlayerIds.includes(p.id);
                        return (
                            <button
                                key={p.id}
                                onClick={() => togglePlayer(p.id)}
                                className={`flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all active:scale-95 text-sm font-bold shadow-sm ${isSelected
                                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-900/50'
                                        : 'bg-slate-900 border-slate-700/50 text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                {isSelected ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                                {p.name}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 2. Saisie Score / Rangs */}
            {selectedPlayerIds.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1 px-1 mt-6">
                        Résultats
                    </h2>

                    {selectedPlayerIds.map(id => {
                        const p = players.find(x => x.id === id)!;
                        const rank = ranks[id] || 0;
                        const score = scores[id] !== undefined ? scores[id] : '';

                        return (
                            <div key={id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-4 shadow-xl shadow-black/20">
                                <h3 className="font-bold text-lg text-white">{p.name}</h3>

                                <div className="flex gap-4 items-center">

                                    {/* Rang */}
                                    <div className="flex-1 space-y-1">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Rang final</label>
                                        <div className="flex items-center gap-1 bg-slate-950 rounded-xl border border-slate-800 p-1 relative overflow-hidden">
                                            <button
                                                onClick={() => setRank(id, rank - 1)}
                                                className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg active:scale-95 transition-all outline-none"
                                            >
                                                <Minus className="w-5 h-5" />
                                            </button>

                                            <div className="flex-1 text-center font-black text-xl text-white">
                                                {rank > 0 ? rank : '-'}
                                            </div>

                                            <button
                                                onClick={() => setRank(id, rank === 0 ? 1 : rank + 1)}
                                                className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg active:scale-95 transition-all outline-none"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>

                                            {rank === 1 && (
                                                <div className="absolute inset-0 border-2 border-amber-500/50 rounded-xl pointer-events-none" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Score */}
                                    <div className="flex-[0.8] space-y-1">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Points</label>
                                        <input
                                            type="number"
                                            value={score}
                                            onChange={e => setScore(id, e.target.value)}
                                            placeholder="0"
                                            min="0"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 flex items-center outline-none focus:border-indigo-500 transition-all text-center font-black text-xl text-white placeholder:text-slate-700 h-[56px] appearance-none"
                                        />
                                    </div>

                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 3. Validation */}
            {selectedPlayerIds.length > 0 && (
                <button
                    onClick={handleSubmit}
                    disabled={!isFormValid}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none text-white font-bold py-4 rounded-2xl flex justify-center items-center gap-2 active:scale-95 transition-all mt-6 shadow-xl shadow-indigo-600/20"
                >
                    <Save className="w-5 h-5" />
                    {editingMatch ? 'Mettre à jour le match' : 'Enregistrer le match'}
                </button>
            )}

        </div>
    );
}
