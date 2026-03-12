import type {
    CricketGameState,
    CricketPlayerState,
    CricketTarget,
    DartThrow,
    TargetValue,
} from './types';

const ALL_TARGETS: TargetValue[] = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    25,
];
const NUM_TARGETS = 7;
const MARKS_TO_CLOSE = 3;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function snapshot(state: CricketGameState): string {
    // Strip prevSnapshot recursively to keep size small
    const { currentTurnDarts, throwHistory, ...rest } = state;
    const cleanDarts = currentTurnDarts.map(({ prevSnapshot: _p, ...d }) => d);
    return JSON.stringify({ ...rest, currentTurnDarts: cleanDarts, throwHistory });
}

function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

export function initGame(playerNames: string[]): CricketGameState {
    if (playerNames.length < 2 || playerNames.length > 5) {
        throw new Error('A game requires 2 to 5 players.');
    }

    // Fisher-Yates shuffle then take first 7
    const pool = [...ALL_TARGETS];
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const secretValues = pool.slice(0, NUM_TARGETS);

    const targets: CricketTarget[] = secretValues.map(v => ({
        value: v,
        revealed: false,
    }));

    const players: CricketPlayerState[] = playerNames.map((name, idx) => ({
        id: `player-${idx}-${Date.now()}`,
        name,
        marks: Array(NUM_TARGETS).fill(0),
        score: 0,
    }));

    return {
        status: 'playing',
        targets,
        players,
        currentPlayerIndex: 0,
        currentTurnDarts: [],
        throwHistory: [],
        winnerId: null,
    };
}

// ---------------------------------------------------------------------------
// Throw a dart
// ---------------------------------------------------------------------------

export function throwDart(
    state: CricketGameState,
    value: TargetValue | 0,
    multiplier: 1 | 2 | 3,
): { nextState: CricketGameState; hit: boolean; shake: boolean } {
    if (state.status !== 'playing') return { nextState: state, hit: false, shake: false };
    if (state.currentTurnDarts.length >= 3) return { nextState: state, hit: false, shake: false };

    const snap = snapshot(state);
    const next = deepClone(state);
    const currentPlayer = next.players[next.currentPlayerIndex];
    const effectiveValue = multiplier > 1 && value === 0 ? 0 : value;

    // Find if this value is in the secret pool
    const targetIndex = next.targets.findIndex(t => t.value === effectiveValue);
    const isInPool = targetIndex !== -1;

    let marksAwarded = 0;
    let wasHit = false;

    if (isInPool && effectiveValue !== 0) {
        wasHit = true;
        const target = next.targets[targetIndex];

        // Reveal target if hidden
        if (!target.revealed) {
            target.revealed = true;
        }

        const newMarks = multiplier; // simple=1, double=2, triple=3
        const existingMarks = currentPlayer.marks[targetIndex];
        const totalMarks = existingMarks + newMarks;
        currentPlayer.marks[targetIndex] = totalMarks;
        marksAwarded = newMarks;

        // Cut-Throat scoring after closing:
        // If player is NOW closed (>=3) and had overflow marks, opponents score
        if (totalMarks >= MARKS_TO_CLOSE) {
            const overflowStart = Math.max(MARKS_TO_CLOSE, existingMarks);
            const overflowMarks = totalMarks - overflowStart;

            if (overflowMarks > 0) {
                // Opponents who don't have this target closed get points
                for (const p of next.players) {
                    if (p.id !== currentPlayer.id && p.marks[targetIndex] < MARKS_TO_CLOSE) {
                        p.score += overflowMarks * effectiveValue;
                    }
                }
            }
        }
    }

    const dart: DartThrow = {
        playerId: currentPlayer.id,
        value: effectiveValue,
        multiplier,
        wasHit,
        targetIndex: isInPool && effectiveValue !== 0 ? targetIndex : null,
        marksAwarded,
        prevSnapshot: snap,
    };

    next.currentTurnDarts.push(dart);

    const { prevSnapshot: _p, ...cleanDart } = dart;
    next.throwHistory.push(cleanDart);

    // Check for winner after each dart
    const winner = findWinner(next);
    if (winner) {
        next.winnerId = winner.id;
        next.status = 'finished';
    }

    return { nextState: next, hit: wasHit, shake: !wasHit && effectiveValue !== 0 };
}

// ---------------------------------------------------------------------------
// Advance to next player's turn
// ---------------------------------------------------------------------------

export function nextTurn(state: CricketGameState): CricketGameState {
    if (state.status !== 'playing') return state;
    const next = deepClone(state);
    next.currentTurnDarts = [];
    next.currentPlayerIndex = (next.currentPlayerIndex + 1) % next.players.length;
    return next;
}

// ---------------------------------------------------------------------------
// Undo last dart
// ---------------------------------------------------------------------------

export function undoLastDart(state: CricketGameState): CricketGameState {
    if (state.currentTurnDarts.length === 0) return state;
    const lastDart = state.currentTurnDarts[state.currentTurnDarts.length - 1];
    const restored: CricketGameState = JSON.parse(lastDart.prevSnapshot);
    // Re-attach the remaining turn darts (all except the last one), with their snapshots
    restored.currentTurnDarts = state.currentTurnDarts.slice(0, -1);
    // Trim throw history by one
    restored.throwHistory = state.throwHistory.slice(0, -1);
    return restored;
}

// ---------------------------------------------------------------------------
// Win condition
// ---------------------------------------------------------------------------

function findWinner(state: CricketGameState): CricketPlayerState | null {
    const allRevealed = state.targets.every(t => t.revealed);
    if (!allRevealed) return null; // can't win while targets are still hidden

    for (const player of state.players) {
        const closedAll = player.marks.every(m => m >= MARKS_TO_CLOSE);
        if (!closedAll) continue;

        const minScore = Math.min(...state.players.map(p => p.score));
        if (player.score === minScore) {
            return player;
        }
    }
    return null;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

export function isClosed(marks: number): boolean {
    return marks >= MARKS_TO_CLOSE;
}

export function getMarkSymbol(marks: number): string {
    const capped = Math.min(marks, 3);
    return ['', '/', 'X', '⊗'][capped];
}
