import { useState } from 'react';
import { UserPlus, User, Trash2 } from 'lucide-react';
import { addPlayer, deletePlayer } from '../lib/storage';
import type { Player } from '../lib/storage';

export function PlayerManager({ players, onPlayerAdded }: { players: Player[], onPlayerAdded: () => void }) {
    const [name, setName] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        await addPlayer(name.trim());
        setName('');
        onPlayerAdded();
    };

    const handleDelete = async (id: string, playerName: string) => {
        if (confirm(`Veux-tu vraiment supprimer ${playerName} ?`)) {
            if (await deletePlayer(id)) {
                onPlayerAdded(); // repurpose to just refresh
            }
        }
    };

    return (
        <div className="p-4 space-y-6 pb-24 h-full">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl shadow-black/20">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                    <UserPlus className="w-5 h-5 text-indigo-400" />
                    Ajouter un Joueur
                </h2>
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Nom du coloc..."
                        className="flex-[2] bg-slate-950 border border-slate-700/50 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium placeholder:text-slate-600 text-base text-white"
                    />
                    <button
                        type="submit"
                        disabled={!name.trim()}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-50 disabled:active:scale-100 text-white font-bold px-2 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                    >
                        Ajouter
                    </button>
                </form>
            </div>

            <div className="flex-1 min-h-0">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 px-2 flex items-center justify-between">
                    <span>Joueurs Enregistrés</span>
                    <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{players.length}</span>
                </h3>

                {players.length === 0 ? (
                    <div className="text-center p-8 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                        Aucun joueur pour l'instant.
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {players.map(p => (
                            <div key={p.id} className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                                    <User className="w-4 h-4 text-slate-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="font-bold text-slate-200 truncate block text-sm">{p.name}</span>
                                    <span className="text-[10px] font-mono font-bold text-indigo-400">
                                        {Math.round(p.elo)} Elo
                                    </span>
                                </div>
                                {p.matchesPlayed === 0 && (
                                    <button
                                        onClick={() => handleDelete(p.id, p.name)}
                                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg active:scale-95 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
