import { supabase } from "./supabase";
import { calculateMatchElo } from "./elo";
import type { EloPlayerInput } from "./elo";

export interface Player {
    id: string;
    name: string;
    elo: number;
    matchesPlayed: number;
    wins: number;
    pointsReceivedTotal: number;
    lastTrend: number;
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
    date: string;
    players: MatchPlayerResult[];
}

export async function getPlayers(): Promise<Player[]> {
    const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('elo', { ascending: false });

    if (error) {
        console.error("Error fetching players:", error);
        return [];
    }

    return data.map(p => ({
        id: p.id,
        name: p.name,
        elo: p.elo,
        matchesPlayed: p.matches_played,
        wins: p.wins,
        pointsReceivedTotal: p.points_total,
        lastTrend: p.last_trend,
    }));
}

export async function addPlayer(name: string): Promise<Player | null> {
    const { data, error } = await supabase
        .from('players')
        .insert([{ name, elo: 1000, matches_played: 0, wins: 0, points_total: 0, last_trend: 0 }])
        .select()
        .single();

    if (error) {
        console.error("Error adding player:", error);
        return null;
    }

    return {
        id: data.id,
        name: data.name,
        elo: data.elo,
        matchesPlayed: data.matches_played,
        wins: data.wins,
        pointsReceivedTotal: data.points_total,
        lastTrend: data.last_trend,
    };
}

export async function getMatches(): Promise<Match[]> {
    const { data, error } = await supabase
        .from('matches')
        .select(`
            id,
            date,
            match_results (
                player_id,
                rank,
                score,
                elo_ancien,
                variation,
                elo_nouveau
            )
        `)
        .order('date', { ascending: false });

    if (error) {
        console.error("Error fetching matches:", error);
        return [];
    }

    return data.map((m: any) => ({
        id: m.id,
        date: m.date,
        players: m.match_results.map((r: any) => ({
            playerId: r.player_id,
            rank: r.rank,
            score: r.score,
            eloAncien: r.elo_ancien,
            variationTotale: r.variation,
            eloNouveau: r.elo_nouveau,
        })),
    }));
}

export interface MatchInputPlayer {
    playerId: string;
    rank: number;
    score: number;
}

export async function recordMatch(inputPlayers: MatchInputPlayer[]) {
    const players = await getPlayers();

    const eloInputs: EloPlayerInput[] = inputPlayers.map(ip => {
        const p = players.find(p => p.id === ip.playerId);
        if (!p) throw new Error(`Player ${ip.playerId} not found`);
        return {
            id: p.id,
            eloAncien: p.elo,
            rang: ip.rank
        };
    });

    const eloOutputs = calculateMatchElo(eloInputs);

    // 1. Insert Match
    const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .insert([{}])
        .select()
        .single();

    if (matchError) throw matchError;

    // 2. Insert Match Results
    const resultsToInsert = inputPlayers.map(ip => {
        const out = eloOutputs.find(o => o.id === ip.playerId)!;
        return {
            match_id: matchData.id,
            player_id: ip.playerId,
            rank: ip.rank,
            score: ip.score,
            elo_ancien: out.eloAncien,
            variation: out.variationTotale,
            elo_nouveau: out.eloNouveau,
        };
    });

    const { error: resultsError } = await supabase
        .from('match_results')
        .insert(resultsToInsert);

    if (resultsError) throw resultsError;

    // 3. Update Players Stats
    for (const result of resultsToInsert) {
        const p = players.find(p => p.id === result.player_id);
        if (p) {
            const { error: pError } = await supabase
                .from('players')
                .update({
                    elo: result.elo_nouveau,
                    matches_played: p.matchesPlayed + 1,
                    wins: p.wins + (result.rank === 1 ? 1 : 0),
                    points_total: p.pointsReceivedTotal + result.score,
                    last_trend: result.variation
                })
                .eq('id', result.player_id);

            if (pError) console.error("Error updating player stats:", pError);
        }
    }
}

export async function deletePlayer(playerId: string): Promise<boolean> {
    // Check if player has matches
    const { count, error: countError } = await supabase
        .from('match_results')
        .select('*', { count: 'exact', head: true })
        .eq('player_id', playerId);

    if (countError) {
        console.error("Error checking player matches:", countError);
        return false;
    }

    if (count && count > 0) return false;

    const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId);

    if (error) {
        console.error("Error deleting player:", error);
        return false;
    }

    return true;
}

export async function recalculateAllElos() {
    const { data: playersData, error: pError } = await supabase.from('players').select('*');
    if (pError) throw pError;

    const { data: matchesData, error: mError } = await supabase
        .from('matches')
        .select(`
            id,
            date,
            match_results (
                id,
                player_id,
                rank,
                score
            )
        `)
        .order('date', { ascending: true });

    if (mError) throw mError;

    const players = playersData.map(p => ({
        id: p.id,
        name: p.name,
        elo: 1000,
        matchesPlayed: 0,
        wins: 0,
        pointsTotal: 0,
        lastTrend: 0
    }));

    for (const match of matchesData) {
        const eloInputs: EloPlayerInput[] = match.match_results.map((mp: any) => {
            const p = players.find(p => p.id === mp.player_id);
            if (!p) throw new Error("Player missing during recalculation");
            return { id: p.id, eloAncien: p.elo, rang: mp.rank };
        });

        const eloOutputs = calculateMatchElo(eloInputs);

        for (const out of eloOutputs) {
            const mp = match.match_results.find((r: any) => r.player_id === out.id)!;

            // Update match_result in DB
            await supabase
                .from('match_results')
                .update({
                    elo_ancien: out.eloAncien,
                    variation: out.variationTotale,
                    elo_nouveau: out.eloNouveau
                })
                .eq('id', mp.id);

            // Update local player state for next match iteration
            const p = players.find(p => p.id === out.id)!;
            p.elo = out.eloNouveau;
            p.matchesPlayed += 1;
            if (mp.rank === 1) p.wins += 1;
            p.pointsTotal += mp.score;
            p.lastTrend = out.variationTotale;
        }
    }

    // Push final player states to DB
    for (const p of players) {
        await supabase
            .from('players')
            .update({
                elo: p.elo,
                matches_played: p.matchesPlayed,
                wins: p.wins,
                points_total: p.pointsTotal,
                last_trend: p.lastTrend
            })
            .eq('id', p.id);
    }
}

export async function deleteMatch(matchId: string) {
    const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId);

    if (error) throw error;
    await recalculateAllElos();
}

export async function editMatch(matchId: string, inputPlayers: MatchInputPlayer[]) {
    // 1. Delete old results
    await supabase.from('match_results').delete().eq('match_id', matchId);

    // 2. Insert new "raw" results (temporary, recalculateAllElos fixes Elos)
    const results = inputPlayers.map(ip => ({
        match_id: matchId,
        player_id: ip.playerId,
        rank: ip.rank,
        score: ip.score,
        elo_ancien: 0,
        variation: 0,
        elo_nouveau: 0,
    }));

    await supabase.from('match_results').insert(results);

    // 3. Trigger global recalc
    await recalculateAllElos();
}
