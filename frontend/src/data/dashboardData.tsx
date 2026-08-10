import profileImages from '@/assets/img/profiles';
import type { CustomerSearchResult, OrderSearchResult, KitchenSearchResult, NotificationGroup } from '../types';

export const customerSearchResults: CustomerSearchResult[] = [
    {
        id: 'c1',
        name: 'Adrian James',
        gender: 'Male',
        code: '#CR6569',
        avatarUrl: profileImages['avatar-32'],
    },
    {
        id: 'c2',
        name: 'Sue Allen',
        gender: 'Female',
        code: '#CR6569',
        avatarUrl: profileImages['avatar-33'],
    },
    {
        id: 'c3',
        name: 'Frank Barrett',
        gender: 'Male',
        code: '#CR4824',
        avatarUrl: profileImages['avatar-31'],
    },
    { id: 'c4', name: 'Walkin Customer', gender: 'Male', code: '#CR8238' },
];

export const orderSearchResults: OrderSearchResult[] = [
    { id: 'o1', orderNo: '#56998', type: 'Dine In', tableNo: '3', tokenNo: '27' },
    { id: 'o2', orderNo: '#57001', type: 'Take Away', tokenNo: '26' },
    { id: 'o3', orderNo: '#56998', type: 'Dine In', tableNo: '3', tokenNo: '27' },
    { id: 'o4', orderNo: '#57002', type: 'Delivery', tokenNo: '25' },
];

export const kitchenSearchResults: KitchenSearchResult[] = [
    { id: 'k1', name: 'Andrew Brooks', ref: '#14751', tokenNo: 'T#23896' },
    { id: 'k2', name: 'Walk in Customer', ref: 'Take Away', tokenNo: '#14547' },
    { id: 'k3', name: 'Elijah Thompson', ref: 'Take Away', tokenNo: '#98765' },
    { id: 'k4', name: 'Jennifer Brooks', ref: 'DineIn', tokenNo: '#23896' },
];

export const notificationGroups: NotificationGroup[] = [
    {
        id: 'today',
        heading: 'Today',
        items: [
            {
                id: 'n1',
                icon: 'cooking-pot',
                variant: 'secondary',
                message: (
                    <>
                        New order from <span className="text-dark fw-medium">Table #12</span> (3 items) pending.
                    </>
                ),
                time: '20 Min Ago',
                actionable: true,
            },
            {
                id: 'n2',
                icon: 'shopping-cart',
                variant: 'orange',
                message: (
                    <>
                        <span className="text-dark fw-medium">Order #124</span> confirmed and sent to the kitchen.
                    </>
                ),
                time: '35 Min Ago',
                actionable: true,
            },
            {
                id: 'n3',
                icon: 'badge-dollar-sign',
                variant: 'success',
                message: (
                    <>
                        <span className="text-dark fw-medium">$850</span> received via UPI for{' '}
                        <span className="text-dark fw-medium">Order #124.</span>
                    </>
                ),
                time: '40 Min Ago',
            },
            {
                id: 'n4',
                icon: 'square-pen',
                variant: 'success',
                message: (
                    <>
                        New order has been created <span className="text-dark fw-medium">Dine</span> in for{' '}
                        <span className="text-dark fw-medium">Table 1</span> total{' '}
                        <span className="text-dark fw-medium">20 Items</span>
                    </>
                ),
                time: '45 Min Ago',
                actions: [
                    { label: 'Accept', variant: 'primary' },
                    { label: 'Decline', variant: 'white' },
                ],
            },
        ],
    },
    {
        id: 'yesterday',
        heading: 'Yesterday',
        items: [
            {
                id: 'n5',
                icon: 'info',
                variant: 'danger',
                message: (
                    <>
                        Low stock: Cheese <span className="text-dark fw-medium">(5 units left).</span>
                    </>
                ),
                time: '10 Hrs Ago',
            },
            {
                id: 'n6',
                icon: 'calendar-fold',
                variant: 'indigo',
                message: (
                    <>
                        Table reservation for Andrew Merkel at <span className="text-dark fw-medium">7:30 PM.</span>
                    </>
                ),
                time: '40 Hrs Ago',
            },
        ],
    },
];
