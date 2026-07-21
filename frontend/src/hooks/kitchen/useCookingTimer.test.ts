import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useCookingTimer from './useCookingTimer';

// ── Helpers ──────────────────────────────────────────────────────────────

/** Advance Jest/Vitest timers by the given number of ms and flush pending
 *  micro-tasks so that React state updates inside setInterval callbacks are
 *  processed before we assert on them. */
const advanceTimersBy = (ms: number) => {
    act(() => {
        vi.advanceTimersByTime(ms);
    });
};

// ── Setup ─────────────────────────────────────────────────────────────────

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

// ── Initial state ─────────────────────────────────────────────────────────

describe('initial state', () => {
    it('starts in idle state with zero values', () => {
        const { result } = renderHook(() => useCookingTimer());

        expect(result.current.timerState).toBe('idle');
        expect(result.current.remainingSeconds).toBe(0);
        expect(result.current.totalSeconds).toBe(0);
        expect(result.current.formattedTime).toBe('00:00');
        expect(result.current.progressPercent).toBe(0);
    });

    it('accepts no options', () => {
        const { result } = renderHook(() => useCookingTimer());
        expect(result.current.timerState).toBe('idle');
    });
});

// ── start() ───────────────────────────────────────────────────────────────

describe('start()', () => {
    it('sets timerState to running and initialises remaining/total seconds', () => {
        const { result } = renderHook(() => useCookingTimer());

        act(() => {
            result.current.start(5); // 5 minutes
        });

        expect(result.current.timerState).toBe('running');
        expect(result.current.totalSeconds).toBe(300); // 5 * 60
        expect(result.current.remainingSeconds).toBe(300);
    });

    it('formats remaining time correctly after start', () => {
        const { result } = renderHook(() => useCookingTimer());

        act(() => {
            result.current.start(10); // 10 minutes
        });

        expect(result.current.formattedTime).toBe('10:00');
    });

    it('progressPercent is 0 immediately after start', () => {
        const { result } = renderHook(() => useCookingTimer());

        act(() => {
            result.current.start(10);
        });

        expect(result.current.progressPercent).toBe(0);
    });

    it('can start with 1 minute', () => {
        const { result } = renderHook(() => useCookingTimer());

        act(() => {
            result.current.start(1);
        });

        expect(result.current.totalSeconds).toBe(60);
        expect(result.current.remainingSeconds).toBe(60);
    });

    it('can start with 180 minutes (max)', () => {
        const { result } = renderHook(() => useCookingTimer());

        act(() => {
            result.current.start(180);
        });

        expect(result.current.totalSeconds).toBe(10800);
        expect(result.current.remainingSeconds).toBe(10800);
    });
});

// ── pause() / resume() ────────────────────────────────────────────────────

describe('pause() / resume()', () => {
    it('pauses the timer and preserves remaining time', () => {
        const { result } = renderHook(() => useCookingTimer());

        act(() => {
            result.current.start(5);
        });

        // Let 2 seconds elapse
        advanceTimersBy(2000);

        act(() => {
            result.current.pause();
        });

        expect(result.current.timerState).toBe('paused');
        expect(result.current.remainingSeconds).toBe(298); // 300 - 2
    });

    it('resumes the timer and countdown continues', () => {
        const { result } = renderHook(() => useCookingTimer());

        act(() => {
            result.current.start(5);
        });

        advanceTimersBy(2000);

        act(() => {
            result.current.pause();
        });

        act(() => {
            result.current.resume();
        });

        expect(result.current.timerState).toBe('running');

        // Let another 3 seconds elapse after resume
        advanceTimersBy(3000);

        expect(result.current.remainingSeconds).toBe(295); // 300 - 2 - 3
    });

    it('progressPercent freezes when paused and resumes advancing when resumed', () => {
        const { result } = renderHook(() => useCookingTimer());

        act(() => {
            result.current.start(10); // 600 seconds
        });

        advanceTimersBy(5000); // 5 seconds elapsed → ~1%

        const pctBeforePause = result.current.progressPercent;
        expect(pctBeforePause).toBe(1);

        act(() => {
            result.current.pause();
        });

        advanceTimersBy(5000); // 5 more seconds — paused, should NOT advance

        expect(result.current.progressPercent).toBe(pctBeforePause);

        act(() => {
            result.current.resume();
        });

        advanceTimersBy(5000); // 5 seconds after resume

        expect(result.current.progressPercent).toBeGreaterThan(pctBeforePause);
    });

    it('pausing twice in a row does not cause errors', () => {
        const { result } = renderHook(() => useCookingTimer());

        act(() => {
            result.current.start(5);
        });

        act(() => {
            result.current.pause();
        });

        // Second pause should be a no-op
        act(() => {
            result.current.pause();
        });

        expect(result.current.timerState).toBe('paused');
    });
});

// ── reset() ───────────────────────────────────────────────────────────────

describe('reset()', () => {
    it('resets all state to idle defaults', () => {
        const { result } = renderHook(() => useCookingTimer());

        act(() => {
            result.current.start(10);
        });

        advanceTimersBy(3000);

        act(() => {
            result.current.reset();
        });

        expect(result.current.timerState).toBe('idle');
        expect(result.current.remainingSeconds).toBe(0);
        expect(result.current.totalSeconds).toBe(0);
        expect(result.current.formattedTime).toBe('00:00');
        expect(result.current.progressPercent).toBe(0);
    });

    it('reset from paused works', () => {
        const { result } = renderHook(() => useCookingTimer());

        act(() => {
            result.current.start(5);
        });

        act(() => {
            result.current.pause();
        });

        act(() => {
            result.current.reset();
        });

        expect(result.current.timerState).toBe('idle');
    });

    it('reset from completed works', () => {
        const { result } = renderHook(() => useCookingTimer());

        act(() => {
            result.current.start(1);
        });

        // Wait for timer to expire
        advanceTimersBy(61000); // 61 seconds > 1 minute

        expect(result.current.timerState).toBe('completed');

        act(() => {
            result.current.reset();
        });

        expect(result.current.timerState).toBe('idle');
        expect(result.current.remainingSeconds).toBe(0);
    });
});

// ── Countdown progression ─────────────────────────────────────────────────

describe('countdown progression', () => {
    it('decrements remaining seconds each second', () => {
        const { result } = renderHook(() => useCookingTimer());

        act(() => {
            result.current.start(2); // 2 minutes = 120 seconds
        });

        advanceTimersBy(1000);
        expect(result.current.remainingSeconds).toBe(119);

        advanceTimersBy(1000);
        expect(result.current.remainingSeconds).toBe(118);

        advanceTimersBy(5000);
        expect(result.current.remainingSeconds).toBe(113);
    });

    it('formattedTime updates as countdown progresses', () => {
        const { result } = renderHook(() => useCookingTimer());

        act(() => {
            result.current.start(1); // 1 minute = 60 seconds
        });

        expect(result.current.formattedTime).toBe('01:00');

        advanceTimersBy(15000); // 15 seconds elapsed
        expect(result.current.formattedTime).toBe('00:45');
    });

    it('progressPercent increases as time elapses', () => {
        const { result } = renderHook(() => useCookingTimer());

        act(() => {
            result.current.start(10); // 600 seconds
        });

        // After 60 seconds → 10%
        advanceTimersBy(60000);
        expect(result.current.progressPercent).toBe(10);

        // After 300 seconds → 50%
        advanceTimersBy(240000); // total 300 seconds
        expect(result.current.progressPercent).toBe(50);
    });
});

// ── onComplete callback ───────────────────────────────────────────────────

describe('onComplete callback', () => {
    it('calls onComplete when timer reaches 0', () => {
        const onComplete = vi.fn();
        const { result } = renderHook(() => useCookingTimer({ onComplete }));

        act(() => {
            result.current.start(1); // 1 minute
        });

        advanceTimersBy(60000); // exactly 1 minute

        expect(onComplete).toHaveBeenCalledOnce();
        expect(result.current.timerState).toBe('completed');
        expect(result.current.remainingSeconds).toBe(0);
    });

    it('calls onComplete only once', () => {
        const onComplete = vi.fn();
        const { result } = renderHook(() => useCookingTimer({ onComplete }));

        act(() => {
            result.current.start(1);
        });

        advanceTimersBy(120000); // 2 minutes — well past expiry

        expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('does not call onComplete before timer expires', () => {
        const onComplete = vi.fn();
        const { result } = renderHook(() => useCookingTimer({ onComplete }));

        act(() => {
            result.current.start(5);
        });

        advanceTimersBy(5000);

        expect(onComplete).not.toHaveBeenCalled();
    });

    it('onComplete is optional', () => {
        const { result } = renderHook(() => useCookingTimer());

        act(() => {
            result.current.start(1);
        });

        advanceTimersBy(60000);

        expect(result.current.timerState).toBe('completed');
    });

    it('pause prevents onComplete, resume continues', () => {
        const onComplete = vi.fn();
        const { result } = renderHook(() => useCookingTimer({ onComplete }));

        act(() => {
            result.current.start(1);
        });

        act(() => {
            result.current.pause();
        });

        // Advance well past expiry while paused
        advanceTimersBy(120000);

        // Should NOT have completed while paused
        expect(onComplete).not.toHaveBeenCalled();
        expect(result.current.timerState).toBe('paused');

        // Resume
        act(() => {
            result.current.resume();
        });

        // Timer should pick up and reach 0
        advanceTimersBy(60000);

        expect(onComplete).toHaveBeenCalledOnce();
        expect(result.current.timerState).toBe('completed');
    });
});

// ── Initialization from existing cooking data ─────────────────────────────

describe('initialization from existing cooking data', () => {
    it('starts running when cookingStartedAt and estimatedMinutes are provided', () => {
        const now = Date.now();
        const cookingStartedAt = new Date(now - 10000).toISOString(); // 10 seconds ago

        const { result } = renderHook(() =>
            useCookingTimer({
                estimatedMinutes: 5,
                cookingStartedAt,
            }),
        );

        expect(result.current.timerState).toBe('running');
        expect(result.current.totalSeconds).toBe(300); // 5 * 60
        // Approximately 290 remaining (300 - 10)
        expect(result.current.remainingSeconds).toBe(290);
    });

    it('shows correct progress when initialized with partial elapsed time', () => {
        const now = Date.now();
        const cookingStartedAt = new Date(now - 60000).toISOString(); // 60 seconds ago

        const { result } = renderHook(() =>
            useCookingTimer({
                estimatedMinutes: 10,
                cookingStartedAt,
            }),
        );

        // 60 / 600 = 10%
        expect(result.current.progressPercent).toBeCloseTo(10, -1);
    });

    it('completes immediately if cooking time has already elapsed', () => {
        const now = Date.now();
        const cookingStartedAt = new Date(now - 600000).toISOString(); // 10 minutes ago

        const { result } = renderHook(() =>
            useCookingTimer({
                estimatedMinutes: 5, // only 5 minutes estimated
                cookingStartedAt,
            }),
        );

        expect(result.current.timerState).toBe('completed');
        expect(result.current.remainingSeconds).toBe(0);
        expect(result.current.progressPercent).toBe(100);
    });

    it('ignores initialization if estimatedMinutes is 0', () => {
        const { result } = renderHook(() =>
            useCookingTimer({
                estimatedMinutes: 0,
                cookingStartedAt: new Date().toISOString(),
            }),
        );

        expect(result.current.timerState).toBe('idle');
    });

    it('ignores initialization if cookingStartedAt is null', () => {
        const { result } = renderHook(() =>
            useCookingTimer({
                estimatedMinutes: 10,
                cookingStartedAt: null,
            }),
        );

        expect(result.current.timerState).toBe('idle');
    });

    it('ignores initialization if cookingStartedAt is undefined', () => {
        const { result } = renderHook(() =>
            useCookingTimer({
                estimatedMinutes: 10,
            }),
        );

        expect(result.current.timerState).toBe('idle');
    });
});

// ── progressPercent edge cases ────────────────────────────────────────────

describe('progressPercent edge cases', () => {
    it('returns 100 for completed timer', () => {
        const { result } = renderHook(() => useCookingTimer());

        act(() => {
            result.current.start(1);
        });

        advanceTimersBy(60000);

        expect(result.current.timerState).toBe('completed');
        expect(result.current.progressPercent).toBe(100);
    });

    it('returns 0 when totalSeconds is 0 (never started)', () => {
        const { result } = renderHook(() => useCookingTimer());
        expect(result.current.progressPercent).toBe(0);
    });

    it('progressPercent never exceeds 100', () => {
        const { result } = renderHook(() => useCookingTimer());

        act(() => {
            result.current.start(1);
        });

        // Advance well past expiry
        advanceTimersBy(120000);

        expect(result.current.progressPercent).toBeLessThanOrEqual(100);
    });

    it('progressPercent never goes below 0', () => {
        const { result } = renderHook(() => useCookingTimer());
        expect(result.current.progressPercent).toBeGreaterThanOrEqual(0);
    });
});

// ── formattedTime edge cases ──────────────────────────────────────────────

describe('formattedTime edge cases', () => {
    it('formats as MM:SS with leading zeros', () => {
        const { result } = renderHook(() => useCookingTimer());

        act(() => {
            result.current.start(1);
        });

        advanceTimersBy(10000); // 50 seconds remaining
        expect(result.current.formattedTime).toBe('00:50');

        advanceTimersBy(10000); // 40 seconds remaining
        expect(result.current.formattedTime).toBe('00:40');
    });

    it('shows 00:00 when timer reaches 0', () => {
        const { result } = renderHook(() => useCookingTimer());

        act(() => {
            result.current.start(1);
        });

        advanceTimersBy(60000);

        expect(result.current.formattedTime).toBe('00:00');
    });

    it('formats hours as minutes (no hours display)', () => {
        const { result } = renderHook(() => useCookingTimer());

        act(() => {
            result.current.start(180); // 3 hours = 10800 seconds
        });

        expect(result.current.formattedTime).toBe('180:00');
    });
});

// ── Multiple start/stop cycles ────────────────────────────────────────────

describe('multiple start/stop cycles', () => {
    it('can start, pause, resume multiple times', () => {
        const { result } = renderHook(() => useCookingTimer());

        act(() => result.current.start(5)); // Cycle 1
        advanceTimersBy(10000);
        act(() => result.current.pause());
        act(() => result.current.resume());
        advanceTimersBy(10000);
        act(() => result.current.pause());

        const remainingAfterCycle1 = result.current.remainingSeconds;

        act(() => result.current.reset());

        act(() => result.current.start(3)); // Cycle 2
        expect(result.current.totalSeconds).toBe(180);
        expect(result.current.remainingSeconds).not.toBe(remainingAfterCycle1);
        expect(result.current.timerState).toBe('running');
    });

    it('reset followed by start works correctly', () => {
        const { result } = renderHook(() => useCookingTimer());

        act(() => result.current.start(5));
        advanceTimersBy(30000);
        act(() => result.current.reset());
        act(() => result.current.start(10));

        expect(result.current.totalSeconds).toBe(600);
        expect(result.current.remainingSeconds).toBe(600);
        expect(result.current.timerState).toBe('running');
    });
});
