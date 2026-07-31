import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Skeleton from '.';

describe('Skeleton', () => {
    it('renders with default dimensions', () => {
        const { container } = render(<Skeleton />);
        const el = container.firstChild as HTMLElement;
        expect(el).toBeInTheDocument();
        expect(el).toHaveClass('skeleton-block');
        expect(el.style.width).toBe('100%');
        expect(el.style.height).toBe('20px');
        expect(el.style.borderRadius).toBe('6px');
    });

    it('applies custom width', () => {
        const { container } = render(<Skeleton width={120} />);
        const el = container.firstChild as HTMLElement;
        expect(el.style.width).toBe('120px');
    });

    it('applies custom height', () => {
        const { container } = render(<Skeleton height={320} />);
        const el = container.firstChild as HTMLElement;
        expect(el.style.height).toBe('320px');
    });

    it('applies custom borderRadius', () => {
        const { container } = render(<Skeleton borderRadius="50%" />);
        const el = container.firstChild as HTMLElement;
        expect(el.style.borderRadius).toBe('50%');
    });

    it('accepts string width', () => {
        const { container } = render(<Skeleton width="70%" />);
        const el = container.firstChild as HTMLElement;
        expect(el.style.width).toBe('70%');
    });

    it('applies additional className', () => {
        const { container } = render(<Skeleton className="mb-3" />);
        const el = container.firstChild as HTMLElement;
        expect(el).toHaveClass('skeleton-block', 'mb-3');
    });

    it('applies string height', () => {
        const { container } = render(<Skeleton height="200px" />);
        const el = container.firstChild as HTMLElement;
        expect(el.style.height).toBe('200px');
    });

    it('applies inline style', () => {
        const { container } = render(<Skeleton style={{ opacity: 0.5 }} />);
        const el = container.firstChild as HTMLElement;
        expect(el.style.opacity).toBe('0.5');
    });
});
