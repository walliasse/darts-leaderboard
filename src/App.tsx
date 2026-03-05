import { useState, useEffect } from 'react';
import { Trophy, Crosshair, Users, History } from 'lucide-react';
import { Leaderboard } from './components/Leaderboard';
import { MatchEntry } from './components/MatchEntry';
import { PlayerManager } from './components/PlayerManager';
import { MatchHistory } from './components/MatchHistory';
import { getPlayers, getMatches } from './lib/storage';
import type { Player, Match } from './lib/storage';

type Tab = 'leaderboard' | 'match' | 'players' | 'history';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('leaderboard');
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  const refreshData = () => {
    const freshPlayers = getPlayers();
    freshPlayers.sort((a, b) => b.elo - a.elo);
    setPlayers(freshPlayers);

    const freshMatches = getMatches();
    setMatches(freshMatches);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleEditMatch = (match: Match) => {
    setEditingMatch(match);
    setActiveTab('match');
  };

  const handleMatchRecorded = () => {
    setEditingMatch(null);
    refreshData();
    setActiveTab('leaderboard');
  };

  return (
    <div className="max-w-md mx-auto min-h-[100dvh] flex flex-col bg-slate-950 text-slate-50 relative selection:bg-indigo-500/30 font-sans">
      <header className="px-6 py-5 flex items-center justify-between sticky top-0 bg-slate-950/80 backdrop-blur-md z-10 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-500/20 p-2 rounded-xl">
            <Trophy className="w-5 h-5 text-indigo-400" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent tracking-tight">
            Cut-Throat Elo
          </h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden relative w-full h-full flex flex-col">
        {activeTab === 'leaderboard' && <Leaderboard players={players} />}
        {activeTab === 'match' && (
          <MatchEntry
            players={players}
            editingMatch={editingMatch}
            onCancelEdit={() => { setEditingMatch(null); setActiveTab('history'); }}
            onMatchRecorded={handleMatchRecorded}
          />
        )}
        {activeTab === 'players' && <PlayerManager players={players} onPlayerAdded={refreshData} />}
        {activeTab === 'history' && (
          <MatchHistory
            matches={matches}
            players={players}
            onRefresh={refreshData}
            onEdit={handleEditMatch}
          />
        )}
      </main>

      <nav className="sticky bottom-0 border-t border-white/5 bg-slate-950/80 backdrop-blur-xl pb-safe pt-2 px-2 z-10">
        <div className="flex gap-1 mb-2">
          <TabButton
            active={activeTab === 'leaderboard'}
            onClick={() => setActiveTab('leaderboard')}
            icon={<Trophy className="w-5 h-5" />}
            label="Classement"
          />
          <TabButton
            active={activeTab === 'match'}
            onClick={() => setActiveTab('match')}
            icon={<Crosshair className="w-5 h-5" />}
            label={editingMatch ? "Modifier" : "Match"}
          />
          <TabButton
            active={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
            icon={<History className="w-5 h-5" />}
            label="Historique"
          />
          <TabButton
            active={activeTab === 'players'}
            onClick={() => setActiveTab('players')}
            icon={<Users className="w-5 h-5" />}
            label="Amis"
          />
        </div>
      </nav>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-2xl transition-all active:scale-95 touch-manipulation outline-none
        ${active
          ? 'bg-white/10 text-white font-medium shadow-inner'
          : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
        }
      `}
    >
      <div className={`transition-transform duration-300 ${active ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : ''}`}>
        {icon}
      </div>
      <span className="text-[10px] tracking-wide uppercase font-bold">{label}</span>
    </button>
  );
}

export default App;
