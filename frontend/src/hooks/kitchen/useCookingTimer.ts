import { useCallback, useEffect, useRef, useState } from 'react';

export type TimerState = 'idle' | 'running' | 'paused' | 'completed';

interface UseCookingTimerOptions {
    estimatedMinutes?: number | null;
    cookingStartedAt?: string | null;
    onComplete?: () => void;
}

interface UseCookingTimerReturn {
    /** Current timer state */
    timerState: TimerState;
    /** Remaining time in seconds */
    remainingSeconds: number;
    /** Total time in seconds (estimatedMinutes * 60) */
    totalSeconds: number;
    /** Formatted remaining time as MM:SS */
    formattedTime: string;
    /** Progress percentage 0–100, computed from wall-clock time when running */
    progressPercent: number;
    /** Start the countdown with the given minutes */
    start: (minutes: number) => void;
    /** Pause the countdown */
    pause: () => void;
    /** Resume the countdown */
    resume: () => void;
    /** Reset to idle */
    reset: () => void;
}

const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const useCookingTimer = (options: UseCookingTimerOptions = {}): UseCookingTimerReturn => {
    const { estimatedMinutes, cookingStartedAt, onComplete } = options;

    const [timerState, setTimerState] = useState<TimerState>('idle');
    const [remainingSeconds, setRemainingSeconds] = useState(0);
    const [totalSeconds, setTotalSeconds] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    /** Prevents the initialization effect from re-running after local `start()` has been called */
    const initializedRef = useRef(false);
    /** Guards against multiple onComplete calls when fake timers queue multiple callbacks */
    const completedRef = useRef(false);

    // ── Progress ───────────────────────────────────────────────────────
    // Render-time value from countdown (pure, no Date.now()).
    // Overridden by wall-clock-derived livePct when running.
    const baseProgress =
        totalSeconds > 0
            ? Math.min(100, Math.round((Math.max(0, totalSeconds - remainingSeconds) / totalSeconds) * 100))
            : 0;

    const [livePct, setLivePct] = useState<number | null>(null);

    // Wall-clock progress tick — only setState inside the interval callback
    useEffect(() => {
        if (timerState !== 'running' || !cookingStartedAt || !estimatedMinutes || estimatedMinutes <= 0) return;

        const totalSec = estimatedMinutes * 60;
        const id = setInterval(() => {
            const startedAt = new Date(cookingStartedAt!).getTime();
            const elapsedSec = Math.floor(Math.max(0, Date.now() - startedAt) / 1000);
            setLivePct(Math.min(100, Math.round((elapsedSec / totalSec) * 100)));
        }, 1000);
        return () => clearInterval(id);
    }, [timerState, cookingStartedAt, estimatedMinutes]);

    // Only use wall-clock value when running; fall back to countdown-based otherwise
    const progressPercent = timerState === 'running' ? (livePct ?? baseProgress) : baseProgress;

    const clearTimer = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    // Initialize timer if order is already cooking (runs only once on mount)
    useEffect(() => {
        if (initializedRef.current) return;
        if (cookingStartedAt && estimatedMinutes && estimatedMinutes > 0) {
            const startedAt = new Date(cookingStartedAt).getTime();
            const now = Date.now();
            const elapsedSeconds = Math.floor((now - startedAt) / 1000);
            const total = estimatedMinutes * 60;
            const remaining = Math.max(0, total - elapsedSeconds);

            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTotalSeconds(total);
            setRemainingSeconds(remaining);

            if (remaining > 0) {
                setTimerState('running');
            } else {
                setTimerState('completed');
            }
        }
        initializedRef.current = true;
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Countdown effect
    useEffect(() => {
        if (timerState === 'running') {
            completedRef.current = false;
            intervalRef.current = setInterval(() => {
                setRemainingSeconds((prev) => {
                    if (prev <= 1 && !completedRef.current) {
                        completedRef.current = true;
                        clearTimer();
                        setTimerState('completed');
                        onComplete?.();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => clearTimer();
    }, [timerState, clearTimer, onComplete]);

    const start = useCallback((minutes: number) => {
        initializedRef.current = true;
        const total = minutes * 60;
        setTotalSeconds(total);
        setRemainingSeconds(total);
        setTimerState('running');
    }, []);

    const pause = useCallback(() => {
        clearTimer();
        setTimerState('paused');
    }, [clearTimer]);

    const resume = useCallback(() => {
        setTimerState('running');
    }, []);

    const reset = useCallback(() => {
        initializedRef.current = false;
        clearTimer();
        setTimerState('idle');
        setRemainingSeconds(0);
        setTotalSeconds(0);
    }, [clearTimer]);

    return {
        timerState,
        remainingSeconds,
        totalSeconds,
        formattedTime: formatTime(remainingSeconds),
        progressPercent,
        start,
        pause,
        resume,
        reset,
    };
};

export default useCookingTimer;
