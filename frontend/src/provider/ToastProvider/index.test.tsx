import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useContext } from 'react';
import { ToastProvider } from './index';
import { ToastContext, type ToastType } from './ToastContext';

vi.mock('@/components/common/Icon', () => ({
    default: ({ name }: { name: string }) => <span data-testid="toast-icon">{name}</span>,
}));

const ToastConsumer = () => {
    const { showToast } = useContext(ToastContext) as {
        showToast: (type: ToastType, message: string) => void;
    };
    return (
        <div>
            <button data-testid="fire-success" onClick={() => showToast('success', 'Saved successfully')}>
                success
            </button>
            <button data-testid="fire-error" onClick={() => showToast('error', 'Something went wrong')}>
                error
            </button>
            <button data-testid="fire-warning" onClick={() => showToast('warning', 'Careful now')}>
                warning
            </button>
            <button data-testid="fire-info" onClick={() => showToast('info', 'Heads up')}>
                info
            </button>
        </div>
    );
};

const renderProvider = () =>
    render(
        <ToastProvider>
            <ToastConsumer />
        </ToastProvider>,
    );

describe('ToastProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        // ensureAnimationStyles appends directly to document.head, so it leaks
        // across tests in this file; remove it so each test starts clean.
        document.getElementById('toast-global-anim')?.remove();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders the toast message when showToast is called', () => {
        renderProvider();

        fireEvent.click(screen.getByTestId('fire-success'));

        expect(screen.getByText('Saved successfully')).toBeInTheDocument();
    });

    it('renders the correct icon for each toast type', () => {
        renderProvider();

        fireEvent.click(screen.getByTestId('fire-success'));
        fireEvent.click(screen.getByTestId('fire-error'));
        fireEvent.click(screen.getByTestId('fire-warning'));
        fireEvent.click(screen.getByTestId('fire-info'));

        const icons = screen.getAllByTestId('toast-icon').map((el) => el.textContent);
        expect(icons).toEqual(['circle-check-big', 'circle-x', 'triangle-alert', 'circle-info']);
    });

    it('applies the bootstrap background class matching the toast type', () => {
        renderProvider();

        fireEvent.click(screen.getByTestId('fire-success'));
        fireEvent.click(screen.getByTestId('fire-error'));

        const toasts = Array.from(document.querySelectorAll('.toast'));
        expect(toasts).toHaveLength(2);
        expect(toasts[0].className).toMatch(/bg-success/);
        expect(toasts[1].className).toMatch(/bg-danger/);
    });

    it('auto-dismisses the toast after the configured delay', () => {
        renderProvider();
        fireEvent.click(screen.getByTestId('fire-success'));
        expect(screen.getByText('Saved successfully')).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(4500);
        });

        expect(screen.queryByText('Saved successfully')).not.toBeInTheDocument();
    });

    it('removes the toast when the close button is clicked', () => {
        renderProvider();
        fireEvent.click(screen.getByTestId('fire-success'));

        fireEvent.click(screen.getByRole('button', { name: 'Close' }));

        act(() => {
            vi.advanceTimersByTime(350);
        });

        expect(screen.queryByText('Saved successfully')).not.toBeInTheDocument();
    });

    it('marks the toast as exiting before removal', () => {
        renderProvider();
        fireEvent.click(screen.getByTestId('fire-success'));

        fireEvent.click(screen.getByRole('button', { name: 'Close' }));

        const enterWrapper = document.querySelector('.toast-global-enter')!;
        expect(enterWrapper.className).toContain('toast-global-exit');
    });

    it('stacks multiple toasts', () => {
        renderProvider();

        fireEvent.click(screen.getByTestId('fire-success'));
        fireEvent.click(screen.getByTestId('fire-success'));

        expect(screen.getAllByText('Saved successfully')).toHaveLength(2);
    });

    it('injects the toast animation styles only once', () => {
        // The style tag is appended directly to document.head, so it can leak
        // across tests — assert the baseline is empty first.
        expect(document.querySelectorAll('#toast-global-anim')).toHaveLength(0);

        renderProvider();
        renderProvider();

        expect(document.querySelectorAll('#toast-global-anim')).toHaveLength(1);
    });
});
