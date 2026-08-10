import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useDashboardUserStatistics from './useDashboardUserStatistics';
import * as dashboardApi from '@/api/dashboard.api';
import { api } from '@/lib/axios';

vi.mock('@/api/dashboard.api', () => ({
    getUserStatistics: vi.fn(),
}));

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(QueryClientProvider, { client: queryClient }, children);
    };
}

describe('useDashboardUserStatistics', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        api.defaults.baseURL = 'http://localhost:8080/restaurant-pos/api';
    });

    const mockResponse = {
        topUserName: 'Andrew Jessica',
        topUserAvatarUrl: '/avatars/05.jpg',
        grandTotal: '$800.00',
        totalNewUsers: '986',
        newUsersChange: '+12.6%',
        newUserAvatars: [
            { id: 1, imageUrl: '/uploads/avatars/27.jpg', alt: 'user1' },
            { id: 2, imageUrl: '/avatars/33.jpg', alt: 'user2' },
        ],
    };

    it('transforms API response into DashboardUserStatsData', async () => {
        vi.mocked(dashboardApi.getUserStatistics).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useDashboardUserStatistics(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data.topUser).toEqual({
            name: 'Andrew Jessica',
            avatarUrl: '/avatars/05.jpg',
            grandTotal: '$800.00',
            totalNewUsers: '986',
            newUsersChange: '+12.6%',
        });
        expect(result.current.data.newUserAvatars).toHaveLength(2);
        expect(result.current.data.newUserAvatars[0]).toEqual({
            id: '1',
            imageUrl: 'http://localhost:8080/restaurant-pos/uploads/avatars/27.jpg',
            alt: 'user1',
        });
    });

    it('provides fallback values for missing data', async () => {
        vi.mocked(dashboardApi.getUserStatistics).mockRejectedValue(new Error('API Error'));

        const { result } = renderHook(() => useDashboardUserStatistics(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.data.topUser.name).toBe('N/A');
        expect(result.current.data.topUser.avatarUrl).toBe('');
        expect(result.current.data.topUser.grandTotal).toBe('$0.00');
        expect(result.current.data.topUser.totalNewUsers).toBe('0');
        expect(result.current.data.topUser.newUsersChange).toBe('0%');
        expect(result.current.data.newUserAvatars).toEqual([]);
    });

    it('handles missing optional avatarUrl fields', async () => {
        vi.mocked(dashboardApi.getUserStatistics).mockResolvedValue({
            ...mockResponse,
            topUserAvatarUrl: undefined,
            newUserAvatars: [{ id: 3, imageUrl: undefined, alt: 'user3' }],
        });

        const { result } = renderHook(() => useDashboardUserStatistics(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data.topUser.avatarUrl).toBe('');
        // Missing avatar path is mapped to undefined (not ''), so AvatarStack
        // never renders an <img src=""> (which React warns about).
        expect(result.current.data.newUserAvatars[0].imageUrl).toBeUndefined();
    });

    it('handles empty newUserAvatars array', async () => {
        vi.mocked(dashboardApi.getUserStatistics).mockResolvedValue({
            ...mockResponse,
            newUserAvatars: [],
        });

        const { result } = renderHook(() => useDashboardUserStatistics(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data.newUserAvatars).toEqual([]);
    });
});
