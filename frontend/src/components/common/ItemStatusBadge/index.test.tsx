import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ItemStatusBadge from './index';

// Use the real itemKitchenStatusBadge mapping (from @/utils) — no mock needed.
describe('ItemStatusBadge', () => {
    it('renders a Cooking badge for a preparing line', () => {
        render(<ItemStatusBadge status="preparing" />);
        const badge = screen.getByText('Cooking');
        expect(badge).toHaveClass('badge');
        expect(badge).toHaveClass('bg-primary');
    });

    it('renders a Ready badge for a ready line', () => {
        render(<ItemStatusBadge status="ready" />);
        const badge = screen.getByText('Ready');
        expect(badge).toHaveClass('bg-success');
    });

    it('renders a Served badge for a served line', () => {
        render(<ItemStatusBadge status="served" />);
        const badge = screen.getByText('Served');
        expect(badge).toHaveClass('bg-secondary');
    });

    it('renders nothing for a pending line', () => {
        render(<ItemStatusBadge status="pending" />);
        expect(screen.queryByText('Cooking')).not.toBeInTheDocument();
        expect(screen.queryByText('Ready')).not.toBeInTheDocument();
        expect(screen.queryByText('Served')).not.toBeInTheDocument();
    });

    it('renders nothing when status is null/undefined', () => {
        const { rerender } = render(<ItemStatusBadge status={null} />);
        expect(screen.queryByText('Cooking')).not.toBeInTheDocument();
        expect(screen.queryByText('Ready')).not.toBeInTheDocument();
        expect(screen.queryByText('Served')).not.toBeInTheDocument();
        expect(screen.queryByText('Extra')).not.toBeInTheDocument();
        rerender(<ItemStatusBadge />);
        expect(screen.queryByText('Cooking')).not.toBeInTheDocument();
        expect(screen.queryByText('Ready')).not.toBeInTheDocument();
        expect(screen.queryByText('Served')).not.toBeInTheDocument();
    });

    it('renders the amber Extra badge when extra is set', () => {
        render(<ItemStatusBadge extra />);
        const badge = screen.getByText('Extra');
        expect(badge).toHaveClass('bg-warning');
        expect(badge).toHaveClass('text-dark');
    });

    it('renders both status and Extra badges together', () => {
        render(<ItemStatusBadge status="ready" extra />);
        expect(screen.getByText('Ready')).toBeInTheDocument();
        expect(screen.getByText('Extra')).toBeInTheDocument();
    });

    it('appends an extra className to the badge', () => {
        render(<ItemStatusBadge status="ready" className="me-2" />);
        expect(screen.getByText('Ready')).toHaveClass('me-2');
    });
});
