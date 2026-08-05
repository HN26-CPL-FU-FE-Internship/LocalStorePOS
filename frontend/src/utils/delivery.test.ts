import { describe, expect, it } from 'vitest';
import type { DeliverySetting } from '@/api/delivery-setting.api';
import { calculateDeliveryCharge, getDeliveryChargeLabel } from './delivery';

const setting = (overrides: Partial<DeliverySetting>): DeliverySetting => ({
    id: 1,
    deliveryChargeType: 'fixed',
    fixedCharge: 5,
    chargePerKm: null,
    minDistanceForFreeKm: null,
    maxDeliveryDistanceKm: null,
    freeDeliveryOver: null,
    minDeliveryOver: null,
    createdAt: '',
    updatedAt: '',
    ...overrides,
});

describe('calculateDeliveryCharge', () => {
    it('calculates the configured fixed percentage from the subtotal', () => {
        expect(calculateDeliveryCharge(100, setting({ fixedCharge: 8 }))).toBe(8);
    });

    it('rounds percentage charges to two decimal places', () => {
        expect(calculateDeliveryCharge(99.99, setting({ fixedCharge: 7.5 }))).toBe(7.5);
    });

    it('returns zero for free delivery', () => {
        expect(calculateDeliveryCharge(100, setting({ deliveryChargeType: 'free', fixedCharge: 8 }))).toBe(0);
    });

    it('returns zero while the setting is unavailable', () => {
        expect(calculateDeliveryCharge(100, null)).toBe(0);
    });

    it('does not calculate kilometer-based delivery without distance data', () => {
        expect(
            calculateDeliveryCharge(
                100,
                setting({ deliveryChargeType: 'km_based', fixedCharge: null, chargePerKm: 2.5 }),
            ),
        ).toBe(0);
    });
});

describe('getDeliveryChargeLabel', () => {
    it('shows the configured percentage for fixed delivery', () => {
        expect(getDeliveryChargeLabel(setting({ fixedCharge: 7.5 }))).toBe('Delivery Charge (7.5%)');
    });

    it('uses a generic label for unsupported or unavailable settings', () => {
        expect(getDeliveryChargeLabel(null)).toBe('Delivery Charge');
        expect(getDeliveryChargeLabel(setting({ deliveryChargeType: 'km_based' }))).toBe('Delivery Charge');
    });
});
