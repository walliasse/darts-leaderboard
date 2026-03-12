import type { CricketGameState } from './types';

const STORAGE_KEY = 'cricket_game';

export function saveCricketGame(state: CricketGameState): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadCricketGame(): CricketGameState | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as CricketGameState;
    } catch {
        return null;
    }
}

export function clearCricketGame(): void {
    localStorage.removeItem(STORAGE_KEY);
}
