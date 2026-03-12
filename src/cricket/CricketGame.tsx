import { useState, useEffect, useCallback } from 'react';
import { CricketSetup } from './CricketSetup';
import { CricketBoard } from './CricketBoard';
import { CricketWinner } from './CricketWinner';
import { initGame } from './engine';
import { saveCricketGame, loadCricketGame, clearCricketGame } from './storage';
import type { CricketGameState } from './types';

type Screen = 'setup' | 'playing' | 'finished';

export function CricketGame() {
    const [screen, setScreen] = useState<Screen>('setup');
    const [gameState, setGameState] = useState<CricketGameState | null>(null);
    const [savedGame, setSavedGame] = useState<CricketGameState | null>(null);

    // Load any persisted game on mount
    useEffect(() => {
        const loaded = loadCricketGame();
        setSavedGame(loaded);
    }, []);

    const handleStart = useCallback((playerNames: string[]) => {
        clearCricketGame();
        const state = initGame(playerNames);
        saveCricketGame(state);
        setGameState(state);
        setScreen('playing');
    }, []);

    const handleResume = useCallback(() => {
        const loaded = loadCricketGame();
        if (!loaded) return;
        setGameState(loaded);
        setScreen(loaded.status === 'finished' ? 'finished' : 'playing');
    }, []);

    const handleStateChange = useCallback((newState: CricketGameState) => {
        saveCricketGame(newState);
        setGameState(newState);
        if (newState.status === 'finished') {
            setScreen('finished');
        }
    }, []);

    const handleNewGame = useCallback(() => {
        clearCricketGame();
        setGameState(null);
        setSavedGame(null);
        setScreen('setup');
    }, []);

    if (screen === 'playing' && gameState) {
        return (
            <CricketBoard
                state={gameState}
                onChange={handleStateChange}
            />
        );
    }

    if (screen === 'finished' && gameState) {
        return (
            <CricketWinner
                state={gameState}
                onNewGame={handleNewGame}
                onHome={handleNewGame}
            />
        );
    }

    return (
        <CricketSetup
            savedGame={savedGame}
            onStart={handleStart}
            onResume={handleResume}
        />
    );
}
