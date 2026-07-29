import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MinutesInputModal, { MIN_MINUTES, MAX_MINUTES } from './MinutesInputModal';

const defaultProps = {
    show: true,
    onHide: vi.fn(),
    onConfirm: vi.fn(),
    minutesInput: 15,
    onMinutesChange: vi.fn(),
    isLoading: false,
    orderNumber: 'ORD-001',
    customerName: 'John Doe',
};

describe('MinutesInputModal', () => {
    // ── Rendering ────────────────────────────────────────

    it('renders the modal when show is true', () => {
        render(<MinutesInputModal {...defaultProps} />);
        expect(screen.getByText('Set Cooking Time')).toBeInTheDocument();
        expect(screen.getByText(/John Doe - ORD-001/)).toBeInTheDocument();
    });

    it('does not render the modal when show is false', () => {
        render(<MinutesInputModal {...defaultProps} show={false} />);
        expect(screen.queryByText('Set Cooking Time')).not.toBeInTheDocument();
    });

    it('displays the current minutesInput value', () => {
        render(<MinutesInputModal {...defaultProps} minutesInput={25} />);
        const input = screen.getByPlaceholderText('e.g. 15') as HTMLInputElement;
        expect(input.value).toBe('25');
    });

    // ── Input change ──────────────────────────────────────

    it('calls onMinutesChange when input value changes', () => {
        const onMinutesChange = vi.fn();
        render(<MinutesInputModal {...defaultProps} onMinutesChange={onMinutesChange} />);
        const input = screen.getByPlaceholderText('e.g. 15');
        fireEvent.change(input, { target: { value: '30' } });
        expect(onMinutesChange).toHaveBeenCalledWith(30);
    });

    it('clamps input value to MIN_MINUTES', () => {
        const onMinutesChange = vi.fn();
        render(<MinutesInputModal {...defaultProps} onMinutesChange={onMinutesChange} />);
        const input = screen.getByPlaceholderText('e.g. 15');
        fireEvent.change(input, { target: { value: '0' } });
        expect(onMinutesChange).toHaveBeenCalledWith(MIN_MINUTES);
    });

    it('clamps input value to MAX_MINUTES', () => {
        const onMinutesChange = vi.fn();
        render(<MinutesInputModal {...defaultProps} onMinutesChange={onMinutesChange} />);
        const input = screen.getByPlaceholderText('e.g. 15');
        fireEvent.change(input, { target: { value: '999' } });
        expect(onMinutesChange).toHaveBeenCalledWith(MAX_MINUTES);
    });

    it('does not call onMinutesChange for NaN input', () => {
        const onMinutesChange = vi.fn();
        render(<MinutesInputModal {...defaultProps} onMinutesChange={onMinutesChange} />);
        const input = screen.getByPlaceholderText('e.g. 15');
        fireEvent.change(input, { target: { value: 'abc' } });
        expect(onMinutesChange).not.toHaveBeenCalled();
    });

    // ── Min / Max labels ──────────────────────────────────

    it('displays min and max minutes text', () => {
        render(<MinutesInputModal {...defaultProps} />);
        expect(screen.getByText(new RegExp(`Min: ${MIN_MINUTES}`))).toBeInTheDocument();
        expect(screen.getByText(new RegExp(`Max: ${MAX_MINUTES}`))).toBeInTheDocument();
    });

    // ── Loading state ─────────────────────────────────────

    it('shows spinner and "Starting..." while loading', () => {
        render(<MinutesInputModal {...defaultProps} isLoading={true} />);
        expect(screen.getByText('Starting...')).toBeInTheDocument();
        expect(document.querySelector('.spinner-border-sm')).toBeInTheDocument();
    });

    it('disables Start Cooking button while loading', () => {
        render(<MinutesInputModal {...defaultProps} isLoading={true} />);
        expect(screen.getByText('Starting...').closest('button')).toBeDisabled();
    });

    it('shows "Start Cooking" when not loading', () => {
        render(<MinutesInputModal {...defaultProps} isLoading={false} />);
        expect(screen.getByText('Start Cooking')).toBeInTheDocument();
        expect(screen.queryByText('Starting...')).not.toBeInTheDocument();
    });

    // ── Button actions ────────────────────────────────────

    it('calls onConfirm when Start Cooking is clicked', () => {
        const onConfirm = vi.fn();
        render(<MinutesInputModal {...defaultProps} onConfirm={onConfirm} />);
        fireEvent.click(screen.getByText('Start Cooking'));
        expect(onConfirm).toHaveBeenCalledOnce();
    });

    it('calls onHide when Cancel is clicked', () => {
        const onHide = vi.fn();
        render(<MinutesInputModal {...defaultProps} onHide={onHide} />);
        fireEvent.click(screen.getByText('Cancel'));
        expect(onHide).toHaveBeenCalledOnce();
    });

    it('calls onHide when close button is clicked', () => {
        const onHide = vi.fn();
        render(<MinutesInputModal {...defaultProps} onHide={onHide} />);
        // Modal header close button
        const closeBtn = document.querySelector('.btn-close');
        if (closeBtn) fireEvent.click(closeBtn);
        expect(onHide).toHaveBeenCalledOnce();
    });
});
