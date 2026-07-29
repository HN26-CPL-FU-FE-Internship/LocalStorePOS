import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmDoneModal from './ConfirmDoneModal';

const defaultProps = {
    show: true,
    onHide: vi.fn(),
    onConfirm: vi.fn(),
    isLoading: false,
    orderNumber: 'ORD-001',
    customerName: 'John Doe',
};

describe('ConfirmDoneModal', () => {
    // ── Rendering ────────────────────────────────────────

    it('renders the modal when show is true', () => {
        render(<ConfirmDoneModal {...defaultProps} />);
        expect(screen.getByText('Confirm Completion')).toBeInTheDocument();
        expect(screen.getByText(/ORD-001/)).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('does not render the modal when show is false', () => {
        render(<ConfirmDoneModal {...defaultProps} show={false} />);
        expect(screen.queryByText('Confirm Completion')).not.toBeInTheDocument();
    });

    it('renders a check-circle icon', () => {
        render(<ConfirmDoneModal {...defaultProps} />);
        // The icon name in the DOM
        const icon = document.querySelector('.text-success.fs-32');
        expect(icon).toBeInTheDocument();
    });

    // ── Loading state ─────────────────────────────────────

    it('shows spinner and "Completing..." while loading', () => {
        render(<ConfirmDoneModal {...defaultProps} isLoading={true} />);
        expect(screen.getByText('Completing...')).toBeInTheDocument();
        expect(document.querySelector('.spinner-border-sm')).toBeInTheDocument();
    });

    it('disables "Yes, mark done" button while loading', () => {
        render(<ConfirmDoneModal {...defaultProps} isLoading={true} />);
        expect(screen.getByText('Completing...').closest('button')).toBeDisabled();
    });

    it('shows "Yes, mark done" when not loading', () => {
        render(<ConfirmDoneModal {...defaultProps} isLoading={false} />);
        expect(screen.getByText('Yes, mark done')).toBeInTheDocument();
        expect(screen.queryByText('Completing...')).not.toBeInTheDocument();
    });

    // ── Button actions ────────────────────────────────────

    it('calls onConfirm when "Yes, mark done" is clicked', () => {
        const onConfirm = vi.fn();
        render(<ConfirmDoneModal {...defaultProps} onConfirm={onConfirm} />);
        fireEvent.click(screen.getByText('Yes, mark done'));
        expect(onConfirm).toHaveBeenCalledOnce();
    });

    it('calls onHide when "No, keep it" is clicked', () => {
        const onHide = vi.fn();
        render(<ConfirmDoneModal {...defaultProps} onHide={onHide} />);
        fireEvent.click(screen.getByText('No, keep it'));
        expect(onHide).toHaveBeenCalledOnce();
    });

    it('calls onHide when close button is clicked', () => {
        const onHide = vi.fn();
        render(<ConfirmDoneModal {...defaultProps} onHide={onHide} />);
        const closeBtn = document.querySelector('.btn-close');
        if (closeBtn) fireEvent.click(closeBtn);
        expect(onHide).toHaveBeenCalledOnce();
    });
});
