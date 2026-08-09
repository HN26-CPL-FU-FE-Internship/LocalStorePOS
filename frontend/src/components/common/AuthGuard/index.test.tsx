import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AuthGuard from './index';

// hoisted so the vi.mock factory (also hoisted) can reference it safely.
const { mockAuthState } = vi.hoisted(() => ({
    mockAuthState: {
        isAuthenticated: true,
        isLoading: false,
        canView: vi.fn<(module: string) => boolean>(() => true),
    },
}));

vi.mock('@/hooks/useAuth', () => ({
    default: () => ({
        isAuthenticated: mockAuthState.isAuthenticated,
        isLoading: mockAuthState.isLoading,
        canView: mockAuthState.canView,
    }),
}));

const renderGuard = (path: string, publicRoute = false) =>
    render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route
                    path={path}
                    element={
                        <AuthGuard publicRoute={publicRoute}>
                            <div data-testid="protected-content">Protected page</div>
                        </AuthGuard>
                    }
                />
                {/* Target of the unauthenticated redirect — needed so the
                    Navigate actually lands somewhere and cannot loop. */}
                <Route path="/login" element={<div data-testid="login-page">Login page</div>} />
            </Routes>
        </MemoryRouter>,
    );

describe('AuthGuard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAuthState.isAuthenticated = true;
        mockAuthState.isLoading = false;
        mockAuthState.canView.mockImplementation(() => true);
    });

    it('shows a loading spinner while auth state is being resolved', () => {
        mockAuthState.isLoading = true;
        renderGuard('/orders');

        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
        expect(document.querySelector('.spinner-border')).not.toBeNull();
    });

    it('redirects unauthenticated users to login', () => {
        mockAuthState.isAuthenticated = false;
        renderGuard('/orders');

        expect(screen.getByTestId('login-page')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
        expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
    });

    it('lets public routes pass through regardless of permissions', () => {
        mockAuthState.canView.mockImplementation(() => false);
        renderGuard('/forgot-password', true);

        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('renders children when the user has view permission for the route', () => {
        renderGuard('/orders');
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('renders a 403 page when the user lacks view permission', () => {
        mockAuthState.canView.mockImplementation(() => false);
        renderGuard('/orders');

        expect(screen.getByText('403')).toBeInTheDocument();
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('renders a 403 page for a dynamic route without permission (e.g. /invoices/5)', () => {
        // Chef-like: cannot view Invoices at all.
        mockAuthState.canView.mockImplementation((module: string) => module !== 'Invoices');
        renderGuard('/invoices/5');

        expect(screen.getByText('403')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('renders children for a dynamic route when permission is granted', () => {
        mockAuthState.canView.mockImplementation((module: string) => module === 'Invoices');
        renderGuard('/invoices/5');

        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        expect(screen.queryByText('403')).not.toBeInTheDocument();
    });

    it('renders children for routes without a permission mapping (auth pages)', () => {
        mockAuthState.canView.mockImplementation(() => false);
        renderGuard('/login');

        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        expect(screen.queryByText('403')).not.toBeInTheDocument();
    });
});
