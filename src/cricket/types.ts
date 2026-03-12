// Target value: 1-20 or 25 (Bull)
export type TargetValue = number;

// Number of marks a player has on a target (0-3+, but 3+ means closed)
export type Marks = number;

// State of a single target slot in the game
export interface CricketTarget {
    value: TargetValue;   // the secret number
    revealed: boolean;    // has it been discovered yet?
}

// Per-player state
export interface CricketPlayerState {
    id: string;
    name: string;
    // marks[i] = number of marks on target index i (0..6)
    marks: Marks[];
    // score accumulated FROM others (cut-throat: points are bad)
    score: number;
}

// A single dart throw stored for undo and display purposes
export interface DartThrow {
    playerId: string;
    value: TargetValue | 0; // 0 = explicit miss button
    multiplier: 1 | 2 | 3;
    wasHit: boolean;        // true if value was in the secret pool
    targetIndex: number | null; // index in targets[], null on miss
    marksAwarded: number;
    // snapshot of state BEFORE this throw, used for undo
    prevSnapshot: string; // JSON stringified CricketGameState (without prevSnapshot fields)
}

export type GameStatus = 'setup' | 'playing' | 'finished';

export interface CricketGameState {
    status: GameStatus;
    // 7 secret targets in order (first discovered = top row)
    targets: CricketTarget[];
    players: CricketPlayerState[];
    // index into players[] for whose turn it is
    currentPlayerIndex: number;
    // darts thrown in the CURRENT turn (max 3)
    currentTurnDarts: DartThrow[];
    // flat history of all confirmed darts (for future reference)
    throwHistory: Omit<DartThrow, 'prevSnapshot'>[];
    winnerId: string | null;
}
