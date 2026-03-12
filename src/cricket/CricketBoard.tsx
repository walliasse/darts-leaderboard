import { useState, useCallback, useEffect, useRef } from 'react';
import { Undo2, ArrowRight, Eye } from 'lucide-react';
import { throwDart, nextTurn, undoLastDart, getMarkSymbol, isClosed } from './engine';
import type { CricketGameState } from './types';

interface Props {
    state: CricketGameState;
    onChange: (state: CricketGameState) => void;
}

// ─── Animation state ────────────────────────────────────────────────────────

type CellAnim = {
    type: 'reveal' | 'mark' | 'shake';
    key: number;
};

// ─── Main component ──────────────────────────────────────────────────────────

export function CricketBoard({ state, onChange }: Props) {
    const [multiplier, setMultiplier] = useState<1 | 2 | 3>(1);
    const [cellAnims, setCellAnims] = useState<Record<string, CellAnim>>({});
    const [shakeKeypad, setShakeKeypad] = useState(false);
    const animKeyRef = useRef(0);

    const currentPlayer = state.players[state.currentPlayerIndex];
    const dartsLeft = 3 - state.currentTurnDarts.length;
    const canUndo = state.currentTurnDarts.length > 0;
    const canAdvance = dartsLeft === 0 || state.currentTurnDarts.length > 0;

    // ── Trigger an animation on a cell
    const triggerCellAnim = useCallback((cellId: string, type: CellAnim['type']) => {
        const key = ++animKeyRef.current;
        setCellAnims(prev => ({ ...prev, [cellId]: { type, key } }));
        setTimeout(() => {
            setCellAnims(prev => {
                const { [cellId]: _, ...rest } = prev;
                return rest;
            });
        }, 700);
    }, []);

    // ── Handle a dart throw
    const handleThrow = useCallback((value: number) => {
        if (state.status !== 'playing' || dartsLeft <= 0) return;

        const { nextState, hit, shake } = throwDart(state, value, multiplier);

        // Determine which target was affected
        if (hit && nextState.currentTurnDarts.length > 0) {
            const last = nextState.currentTurnDarts[nextState.currentTurnDarts.length - 1];
            if (last.targetIndex !== null) {
                const wasHidden = !state.targets[last.targetIndex].revealed;
                triggerCellAnim(
                    `${last.targetIndex}-${currentPlayer.id}`,
                    wasHidden ? 'reveal' : 'mark',
                );
            }
        }

        if (shake) {
            setShakeKeypad(true);
            setTimeout(() => setShakeKeypad(false), 600);
        }

        // Reset multiplier after each throw
        setMultiplier(1);
        onChange(nextState);
    }, [state, multiplier, dartsLeft, currentPlayer.id, triggerCellAnim, onChange]);

    // ── Advance to next player
    const handleNext = useCallback(() => {
        if (state.currentTurnDarts.length === 0) return;
        onChange(nextTurn(state));
        setMultiplier(1);
    }, [state, onChange]);

    // ── Undo last dart
    const handleUndo = useCallback(() => {
        const prev = undoLastDart(state);
        onChange(prev);
        setMultiplier(1);
    }, [state, onChange]);

    // ── Keyboard support (optional convenience)
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Backspace') handleUndo();
            if (e.key === 'Enter') handleNext();
            const n = parseInt(e.key);
            if (!isNaN(n) && n >= 1 && n <= 9) handleThrow(n);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleUndo, handleNext, handleThrow]);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* ── SCOREBOARD ─────────────────────────────────────────────── */}
            <div className="flex-none overflow-x-auto border-b border-white/5 bg-slate-950">
                <table className="w-full min-w-[280px] text-sm border-collapse">
                    <thead>
                        <tr className="border-b border-white/5">
                            {/* Target column header */}
                            <th className="py-2 px-3 text-left text-xs text-slate-600 font-bold uppercase tracking-widest w-14">
                                Cible
                            </th>
                            {state.players.map((p, pi) => {
                                const isActive = pi === state.currentPlayerIndex;
                                return (
                                    <th key={p.id} className={`py-2 px-2 text-center transition-colors ${isActive ? 'bg-violet-500/10' : ''}`}>
                                        <div className={`text-xs font-black truncate max-w-[60px] mx-auto ${isActive ? 'text-violet-300' : 'text-slate-400'}`}>
                                            {p.name}
                                        </div>
                                        <div className={`font-mono font-black text-base ${isActive ? 'text-white' : 'text-slate-500'}`}>
                                            {p.score}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {state.targets.map((target, ti) => (
                            <tr key={ti} className="border-b border-white/[0.03]">
                                {/* Target name cell */}
                                <td className="py-2 px-3 w-14">
                                    <TargetCell target={target} index={ti} />
                                </td>
                                {/* Mark cells */}
                                {state.players.map((p, pi) => {
                                    const marks = target.revealed ? p.marks[ti] : null;
                                    const isActive = pi === state.currentPlayerIndex;
                                    const cellId = `${ti}-${p.id}`;
                                    const anim = cellAnims[cellId];

                                    return (
                                        <td key={p.id} className={`py-2 px-2 text-center transition-colors ${isActive ? 'bg-violet-500/5' : ''}`}>
                                            <MarkCell
                                                marks={marks}
                                                anim={anim}
                                                closed={marks !== null && isClosed(marks)}
                                            />
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── CURRENT TURN INFO ──────────────────────────────────────── */}
            <div className={`flex-none px-4 py-2.5 flex items-center justify-between bg-slate-900/50 border-b border-white/5 transition-colors ${state.currentPlayerIndex % 2 === 0 ? 'bg-slate-900/50' : 'bg-slate-950/50'
                }`}>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                    <span className="text-sm font-bold text-white">{currentPlayer.name}</span>
                </div>
                <div className="flex gap-1.5 items-center">
                    {[...Array(3)].map((_, i) => {
                        const thrown = state.currentTurnDarts[i];
                        return (
                            <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black border transition-all ${thrown
                                    ? thrown.wasHit
                                        ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                                        : 'bg-rose-500/15 border-rose-500/20 text-rose-400'
                                    : 'bg-white/5 border-white/10 text-slate-600'
                                }`}>
                                {thrown
                                    ? thrown.wasHit
                                        ? (thrown.multiplier > 1 ? `×${thrown.multiplier}` : thrown.value === 25 ? '🎯' : thrown.value)
                                        : '✕'
                                    : '·'}
                            </div>
                        );
                    })}
                    {canUndo && (
                        <button
                            onClick={handleUndo}
                            className="ml-1 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg active:scale-95 transition-all"
                        >
                            <Undo2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* ── KEYPAD ─────────────────────────────────────────────────── */}
            <div className={`flex-1 flex flex-col justify-start p-3 gap-3 overflow-hidden ${shakeKeypad ? 'animate-shake' : ''}`}>

                {/* Modifier row */}
                <div className="flex gap-2">
                    {([1, 2, 3] as const).map(m => (
                        <button
                            key={m}
                            onClick={() => setMultiplier(prev => prev === m ? 1 : m)}
                            className={`flex-1 py-2.5 rounded-xl font-black text-sm transition-all active:scale-95 border ${multiplier === m
                                    ? m === 1
                                        ? 'bg-slate-500/30 border-slate-400/50 text-white'
                                        : m === 2
                                            ? 'bg-sky-500/30 border-sky-400/50 text-sky-200'
                                            : 'bg-amber-500/30 border-amber-400/50 text-amber-200'
                                    : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            {m === 1 ? 'Simple' : m === 2 ? 'Double' : 'Triple'}
                        </button>
                    ))}
                </div>

                {/* Number grid 1-20 */}
                <div className="grid grid-cols-5 gap-1.5 flex-1">
                    {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                        <button
                            key={n}
                            onClick={() => handleThrow(n)}
                            disabled={dartsLeft === 0}
                            className={`
                                flex items-center justify-center rounded-xl font-black text-base
                                transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed
                                border touch-manipulation outline-none
                                ${multiplier === 2
                                    ? 'bg-sky-900/30 border-sky-700/40 text-sky-200 hover:bg-sky-800/40'
                                    : multiplier === 3
                                        ? 'bg-amber-900/30 border-amber-700/40 text-amber-200 hover:bg-amber-800/40'
                                        : 'bg-slate-800 border-slate-700/50 text-slate-200 hover:bg-slate-700'
                                }
                            `}
                        >
                            {n}
                        </button>
                    ))}
                </div>

                {/* Bull + Miss + Next turn row */}
                <div className="flex gap-1.5">
                    <button
                        onClick={() => handleThrow(25)}
                        disabled={dartsLeft === 0}
                        className={`flex-1 py-3 rounded-xl font-black text-sm transition-all active:scale-95 border disabled:opacity-30 disabled:cursor-not-allowed ${multiplier === 2
                                ? 'bg-sky-900/30 border-sky-700/40 text-sky-200 hover:bg-sky-800/40'
                                : multiplier === 3
                                    ? 'bg-amber-900/30 border-amber-700/40 text-amber-200 hover:bg-amber-800/40'
                                    : 'bg-violet-900/40 border-violet-700/40 text-violet-300 hover:bg-violet-800/40'
                            }`}
                    >
                        🎯 Bull
                    </button>

                    <button
                        onClick={() => handleThrow(0)}
                        disabled={dartsLeft === 0}
                        className="flex-1 py-3 rounded-xl font-black text-sm transition-all active:scale-95 border border-rose-800/40 bg-rose-900/20 text-rose-400 hover:bg-rose-800/30 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        ✕ Miss
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={!canAdvance || state.currentTurnDarts.length === 0}
                        className="flex-1 py-3 rounded-xl font-black text-sm transition-all active:scale-95 border border-violet-600/50 bg-violet-600/20 text-violet-300 hover:bg-violet-600/30 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                    >
                        Suivant
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Target cell with flip reveal animation ───────────────────────────────────

function TargetCell({ target, index: _index }: { target: { value: number; revealed: boolean }; index: number }) {
    const [wasRevealed, setWasRevealed] = useState(target.revealed);
    const [flipping, setFlipping] = useState(false);

    useEffect(() => {
        if (target.revealed && !wasRevealed) {
            setFlipping(true);
            setTimeout(() => {
                setWasRevealed(true);
                setFlipping(false);
            }, 400);
        }
    }, [target.revealed, wasRevealed]);

    const displayValue = target.revealed || wasRevealed
        ? (target.value === 25 ? 'Bull' : String(target.value))
        : '???';

    return (
        <div className={`
            relative font-mono font-black text-xs transition-all duration-400
            ${flipping ? 'animate-flip-reveal' : ''}
            ${target.revealed
                ? 'text-violet-300 bg-violet-500/10 border border-violet-500/25 rounded-lg px-1.5 py-0.5 text-center'
                : 'text-slate-600 text-center'
            }
        `}>
            <span className="flex items-center gap-1">
                {target.revealed && <Eye className="w-2.5 h-2.5 shrink-0 opacity-60" />}
                {displayValue}
            </span>
        </div>
    );
}

// ─── Mark cell ────────────────────────────────────────────────────────────────

function MarkCell({ marks, anim, closed }: { marks: number | null; anim?: CellAnim; closed: boolean }) {
    if (marks === null) {
        return <div className="text-slate-700 text-xs select-none">·</div>;
    }

    const symbol = getMarkSymbol(marks);

    return (
        <div className={`
            text-sm font-black select-none transition-all
            ${anim?.type === 'reveal' ? 'animate-flip-reveal' : ''}
            ${anim?.type === 'mark' ? 'scale-125' : 'scale-100'}
            ${closed
                ? 'text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]'
                : marks > 0
                    ? 'text-slate-300'
                    : 'text-slate-700'
            }
        `}>
            {symbol || '·'}
        </div>
    );
}
