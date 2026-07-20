/**
 * Kitchen timer notification utility.
 * Plays a beep sound via the Web Audio API and requests/triggers a browser
 * Notification so the chef is alerted even when the page isn't focused.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
    return audioCtx;
}

/**
 * Warm up the AudioContext during a user interaction (e.g. "Start Cooking" click)
 * so that it is not in a "suspended" state when the timer expiry beep needs to play.
 *
 * Browsers require a user gesture before AudioContext will actually produce sound;
 * calling this from a click handler satisfies that requirement.
 */
export function warmUpAudio(): void {
    try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
    } catch {
        // Audio not supported – silently ignore
    }
}

/**
 * Play a short, attention-getting beep tone using the Web Audio API.
 * Falls back silently if audio isn't available.
 */
function playBeep(): void {
    try {
        const ctx = getAudioContext();

        // Attempt to resume if still suspended (may still fail on first expiry
        // if warmUpAudio was never called, but that's a best-effort scenario)
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }

        const now = ctx.currentTime;

        // First pulse
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'square';
        osc1.frequency.value = 880; // A5
        gain1.gain.setValueAtTime(0.4, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.6);

        // Second pulse after a short gap
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.value = 880;
        gain2.gain.setValueAtTime(0.4, now + 0.8);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 1.4);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.8);
        osc2.stop(now + 1.4);
    } catch {
        // Audio not supported – silently ignore
    }
}

/**
 * Request notification permission (if not already granted/denied)
 * and show a desktop notification for a timer-expired order.
 */
function showBrowserNotification(orderNumber: string, customerName: string): void {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
        new Notification('⏰ Timer Expired', {
            body: `Order ${orderNumber} — ${customerName} is ready!`,
        });
    } else if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
                new Notification('⏰ Timer Expired', {
                    body: `Order ${orderNumber} — ${customerName} is ready!`,
                });
            }
        });
    }
}

/**
 * Alert the chef that a cooking timer has expired.
 * Plays a beep sound and attempts to show a browser notification.
 */
export function notifyTimerExpired(orderNumber: string, customerName: string): void {
    playBeep();
    showBrowserNotification(orderNumber, customerName);
}
