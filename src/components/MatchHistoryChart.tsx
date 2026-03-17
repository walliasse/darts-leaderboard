import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Match, Player } from '../lib/storage';

const COLORS = [
    '#6366f1', // indigo-500
    '#f43f5e', // rose-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#06b6d4', // cyan-500
    '#d946ef', // fuchsia-500
    '#8b5cf6', // violet-500
    '#14b8a6', // teal-500
    '#f97316', // orange-500
    '#84cc16', // lime-500
];

export function MatchHistoryChart({
    matches,
    players
}: {
    matches: Match[],
    players: Player[]
}) {
    // Select top 5 players by default
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(
        () => players.slice(0, 5).map(p => p.id)
    );

    const togglePlayer = (playerId: string) => {
        setSelectedPlayerIds(prev => 
            prev.includes(playerId)
                ? prev.filter(id => id !== playerId)
                : [...prev, playerId]
        );
    };

    const chartData = useMemo(() => {
        if (!matches || matches.length === 0 || !players || players.length === 0) return [];

        const sortedMatches = [...matches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // 1. Array indexé des elos pour chaque joueur
        const playerElos: Record<string, number[]> = {};
        players.forEach(p => {
            playerElos[p.id] = [1000]; // Tout le monde commence à 1000
        });
        
        sortedMatches.forEach(match => {
            match.players.forEach(mp => {
                if (playerElos[mp.playerId]) {
                    playerElos[mp.playerId].push(mp.eloNouveau);
                }
            });
        });

        // 2. Trouver le nombre maximum de parties (axe X)
        let maxMatches = 0;
        players.forEach(p => {
            if (selectedPlayerIds.includes(p.id)) {
                if (playerElos[p.id].length > maxMatches) {
                    maxMatches = playerElos[p.id].length;
                }
            }
        });

        // 3. Construire le tableau formatté pour Recharts
        const data = [];
        for (let i = 0; i < maxMatches; i++) {
            const point: Record<string, string | number> = { matchIndex: i.toString() };
            players.forEach(p => {
                if (selectedPlayerIds.includes(p.id)) {
                    if (i < playerElos[p.id].length) {
                        point[p.id] = playerElos[p.id][i];
                    }
                }
            });
            data.push(point);
        }

        return data;
    }, [matches, players, selectedPlayerIds]);

    if (players.length === 0) {
        return <div className="p-8 text-center text-slate-400">Ajoutez des joueurs pour voir les graphiques.</div>;
    }

    return (
        <div className="p-4 space-y-4 pb-24 h-full flex flex-col">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 px-2 mt-2">
                Sélection des joueurs
            </h3>
            
            {/* Player Selection Pills */}
            <div className="flex flex-wrap gap-2 px-2">
                {players.map((p, index) => {
                    const isSelected = selectedPlayerIds.includes(p.id);
                    const color = COLORS[index % COLORS.length];
                    
                    return (
                        <button
                            key={p.id}
                            onClick={() => togglePlayer(p.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all outline-none border ${
                                isSelected 
                                    ? 'bg-slate-800 text-white' 
                                    : 'bg-slate-900/50 text-slate-500 border-slate-800 hover:bg-slate-800'
                            }`}
                            style={{
                                borderColor: isSelected ? color : undefined,
                                boxShadow: isSelected ? `0 0 10px ${color}40` : undefined
                            }}
                        >
                            <span 
                                className="inline-block w-2 h-2 rounded-full mr-2"
                                style={{ backgroundColor: isSelected ? color : '#334155' }}
                            />
                            {p.name}
                        </button>
                    );
                })}
            </div>

            <div className="w-full h-[350px] shrink-0 mt-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 pt-6">
                {matches.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                        Aucune partie enregistrée.
                    </div>
                ) : selectedPlayerIds.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                        Sélectionnez au moins un joueur.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis 
                                dataKey="matchIndex" 
                                stroke="#475569" 
                                fontSize={10} 
                                tickMargin={10}
                                minTickGap={20}
                            />
                            <YAxis 
                                stroke="#475569" 
                                fontSize={10}
                                tickFormatter={(val) => Math.round(val).toString()}
                                domain={['auto', 'auto']}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.75rem', fontSize: '12px' }}
                                itemStyle={{ fontWeight: 500 }}
                            />
                            {players.filter(p => selectedPlayerIds.includes(p.id)).map((p) => (
                                <Line 
                                    key={p.id}
                                    type="monotone" 
                                    dataKey={p.id} 
                                    name={p.name}
                                    stroke={COLORS[players.indexOf(p) % COLORS.length]} 
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                    connectNulls={false}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
