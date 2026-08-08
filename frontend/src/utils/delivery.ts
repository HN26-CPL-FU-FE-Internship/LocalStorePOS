import type { DeliverySetting } from '@/api/delivery-setting.api';
/**
 * Calculate delivery charge for the POS cart.
 *
 * The current fixed setting is configured as a percentage in Delivery Settings,
 * matching the former POS behaviour. Kilometer-based delivery is intentionally
 * left unsupported until the POS has distance data.
 */
export const calculateDeliveryCharge = (subtotal: number, setting: DeliverySetting | null | undefined): number => {
    if (!setting || setting.deliveryChargeType === 'free') return 0;

    if (setting.deliveryChargeType === 'fixed') {
        const percentage = Math.min(100, Math.max(0, setting.fixedCharge ?? 0));
        return Math.round(Math.max(0, subtotal) * (percentage / 100) * 100) / 100;
    }

    return 0;
};

export const getDeliveryChargeLabel = (setting: DeliverySetting | null | undefined): string => {
    if (setting?.deliveryChargeType === 'fixed' && setting.fixedCharge != null) {
        return `Delivery Charge (${setting.fixedCharge}%)`;
    }

    return 'Delivery Charge';
};
