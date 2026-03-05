import { calculateMatchElo } from "./elo";
import type { EloPlayerInput } from "./elo";

export interface Player {
    id: string;
    name: string;
    elo: number;
    matchesPlayed: number;
    wins: number;
    pointsReceivedTotal: number;
    lastTrend: number; // The variation from the last match
}

export interface MatchPlayerResult {
    playerId: string;
    rank: number;
    score: number;
    eloAncien: number;
    variationTotale: number;
    eloNouveau: number;
}

export interface Match {
    id: string;
    date: string; // ISO string
    players: MatchPlayerResult[];
}

const PLAYERS_KEY = "darts_players";
const MATCHES_KEY = "darts_matches";

export function getPlayers(): Player[] {
    const data = localStorage.getItem(PLAYERS_KEY);
    return data ? JSON.parse(data) : [];
}

export function savePlayers(players: Player[]) {
    localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
}

export function addPlayer(name: string): Player {
    const players = getPlayers();
    const newPlayer: Player = {
        id: crypto.randomUUID(),
        name,
        elo: 1000,
        matchesPlayed: 0,
        wins: 0,
        pointsReceivedTotal: 0,
        lastTrend: 0,
    };
    players.push(newPlayer);
    savePlayers(players);
    return newPlayer;
}

export function getMatches(): Match[] {
    const data = localStorage.getItem(MATCHES_KEY);
    return data ? JSON.parse(data) : [];
}

export interface MatchInputPlayer {
    playerId: string;
    rank: number;
    score: number;
}

export function recordMatch(inputPlayers: MatchInputPlayer[]) {
    const players = getPlayers();

    // Prepare input for Elo calculator
    const eloInputs: EloPlayerInput[] = inputPlayers.map(ip => {
        const p = players.find(p => p.id === ip.playerId);
        if (!p) throw new Error(`Player ${ip.playerId} not found`);
        return {
            id: p.id,
            eloAncien: p.elo,
            rang: ip.rank
        };
    });

    // Calculate new Elos
    const eloOutputs = calculateMatchElo(eloInputs);

    // Construct match record
    const matchResults: MatchPlayerResult[] = inputPlayers.map(ip => {
        const out = eloOutputs.find(o => o.id === ip.playerId)!;
        return {
            playerId: ip.playerId,
            rank: ip.rank,
            score: ip.score,
            eloAncien: out.eloAncien,
            variationTotale: out.variationTotale,
            eloNouveau: out.eloNouveau,
        };
    });

    const newMatch: Match = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        players: matchResults
    };

    const matches = getMatches();
    matches.push(newMatch);
    localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));

    // Update players stats
    for (const result of matchResults) {
        const p = players.find(p => p.id === result.playerId);
        if (p) {
            p.elo = result.eloNouveau;
            p.matchesPlayed += 1;
            if (result.rank === 1) p.wins += 1;
            p.pointsReceivedTotal += result.score;
            p.lastTrend = result.variationTotale;
        }
    }

    savePlayers(players);
}

export function deletePlayer(playerId: string): boolean {
    const players = getPlayers();
    const player = players.find(p => p.id === playerId);
    if (!player || player.matchesPlayed > 0) return false; // Cannot delete if played

    const newPlayers = players.filter(p => p.id !== playerId);
    savePlayers(newPlayers);
    return true;
}

export function recalculateAllElos() {
    const players = getPlayers();
    const matches = getMatches();

    // Reset all stats
    players.forEach(p => {
        p.elo = 1000;
        p.matchesPlayed = 0;
        p.wins = 0;
        p.pointsReceivedTotal = 0;
        p.lastTrend = 0;
    });

    // Replay chronological matches
    matches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (const match of matches) {
        // prepare input
        const eloInputs: import('./elo').EloPlayerInput[] = match.players.map(mp => {
            const p = players.find(p => p.id === mp.playerId);
            if (!p) throw new Error("Player missing during recalculation");
            return { id: p.id, eloAncien: p.elo, rang: mp.rank };
        });

        // We can't use simple import here because of circular dependency resolution in this specific file structure without refactoring.
        // However, calculateMatchElo is exported. I should add `import { calculateMatchElo } from './elo'` at the top. It is already imported at the top!
        // But since it's already imported at the top, I can just use calculateMatchElo directly.
        const eloOutputs = calculateMatchElo(eloInputs);

        // Update match with new calculations
        match.players = match.players.map(mp => {
            const out = eloOutputs.find(o => o.id === mp.playerId)!;
            return {
                ...mp,
                eloAncien: out.eloAncien,
                variationTotale: out.variationTotale,
                eloNouveau: out.eloNouveau
            };
        });

        // Update players
        for (const result of match.players) {
            const p = players.find(p => p.id === result.playerId);
            if (p) {
                p.elo = result.eloNouveau;
                p.matchesPlayed += 1;
                if (result.rank === 1) p.wins += 1;
                p.pointsReceivedTotal += result.score;
                p.lastTrend = result.variationTotale;
            }
        }
    }

    savePlayers(players);
    localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
}

export function deleteMatch(matchId: string) {
    const matches = getMatches();
    const filteredMatches = matches.filter(m => m.id !== matchId);
    localStorage.setItem(MATCHES_KEY, JSON.stringify(filteredMatches));
    recalculateAllElos();
}

export function editMatch(matchId: string, inputPlayers: MatchInputPlayer[]) {
    const matches = getMatches();
    const matchIndex = matches.findIndex(m => m.id === matchId);
    if (matchIndex === -1) return;

    // We temporarily update with raw data (Elo will be fixed by recalculate)
    matches[matchIndex].players = inputPlayers.map(ip => ({
        playerId: ip.playerId,
        rank: ip.rank,
        score: ip.score,
        eloAncien: 0,
        variationTotale: 0,
        eloNouveau: 0
    }));

    localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
    recalculateAllElos();
}
