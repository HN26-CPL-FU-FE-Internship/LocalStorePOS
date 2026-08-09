import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useContext } from 'react';
import AuthProvider from './index';
import AuthContext from './AuthContext';
import type { UserInfo } from '@/types/permission';

// Hoisted so the vi.mock factories (also hoisted) can reference them safely.
const { mockApi, mockToken } = vi.hoisted(() => ({
    mockApi: {
        get: vi.fn(),
        post: vi.fn(),
    },
    mockToken: {
        getAccessToken: vi.fn<() => string | null>(() => 'test-token'),
        getRefreshToken: vi.fn(() => null),
        clearTokens: vi.fn(),
    },
}));

vi.mock('@/lib/axios', () => ({ api: mockApi }));

vi.mock('@/utils/token', () => ({ tokenUtils: mockToken }));

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const makeUser = (role: string): UserInfo => ({
    id: 1,
    firstName: 'Test',
    lastName: 'User',
    email: 'test@pos.com',
    phoneNumber: '0123456789',
    role,
    avatarPath: null,
    status: 'active',
    permissions: [],
});

/** Reads the AuthContext so tests can assert the exposed values. */
const AuthConsumer = () => {
    const context = useContext(AuthContext);
    if (!context) return null;
    const { user, isLoading, isAdmin } = context;
    return (
        <div>
            <span data-testid="is-admin">{String(isAdmin)}</span>
            <span data-testid="role">{user?.role ?? 'none'}</span>
            <span data-testid="loading">{String(isLoading)}</span>
        </div>
    );
};

const renderProvider = () =>
    render(
        <AuthProvider>
            <AuthConsumer />
        </AuthProvider>,
    );

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */

describe('AuthProvider - isAdmin', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockToken.getAccessToken.mockReturnValue('test-token');
    });

    it('isAdmin is true when the role is "Admin / Owner"', async () => {
        mockApi.get.mockResolvedValue({ data: { result: makeUser('Admin / Owner') } });

        renderProvider();

        await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
        expect(screen.getByTestId('role').textContent).toBe('Admin / Owner');
        expect(screen.getByTestId('is-admin').textContent).toBe('true');
    });

    it('isAdmin is false for the Chef role', async () => {
        mockApi.get.mockResolvedValue({ data: { result: makeUser('Chef') } });

        renderProvider();

        await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
        expect(screen.getByTestId('role').textContent).toBe('Chef');
        expect(screen.getByTestId('is-admin').textContent).toBe('false');
    });

    it('isAdmin is false for the Waiter role', async () => {
        mockApi.get.mockResolvedValue({ data: { result: makeUser('Waiter') } });

        renderProvider();

        await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
        expect(screen.getByTestId('role').textContent).toBe('Waiter');
        expect(screen.getByTestId('is-admin').textContent).toBe('false');
    });

    it('isAdmin is false when there is no stored token (user stays null)', async () => {
        mockToken.getAccessToken.mockReturnValue(null);

        renderProvider();

        await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
        expect(screen.getByTestId('role').textContent).toBe('none');
        expect(screen.getByTestId('is-admin').textContent).toBe('false');
        expect(mockApi.get).not.toHaveBeenCalled();
    });

    it('isAdmin is false when the /auth/me fetch fails (stale/invalid token)', async () => {
        mockApi.get.mockRejectedValue(new Error('Unauthorized'));

        renderProvider();

        await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
        expect(screen.getByTestId('role').textContent).toBe('none');
        expect(screen.getByTestId('is-admin').textContent).toBe('false');
        expect(mockApi.get).toHaveBeenCalledWith('/auth/me');
    });
});
