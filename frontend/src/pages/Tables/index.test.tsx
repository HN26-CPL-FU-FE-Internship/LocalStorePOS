import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, configure, within } from '@testing-library/react';
import TablesPage from './index';

// The page issues several chained API calls on mount; give the async queries
// room to breathe when the full suite runs in parallel workers.
configure({ asyncUtilTimeout: 5000 });

const { mockAuth, mockShowToast, mockTableApi, mockCustomerApi } = vi.hoisted(() => ({
    mockAuth: { isAdmin: true },
    mockShowToast: vi.fn(),
    mockTableApi: {
        getTableFloors: vi.fn(),
        getTableAreas: vi.fn(),
        getTables: vi.fn(),
        getReservations: vi.fn(),
        createTableFloor: vi.fn(),
        deleteTableFloor: vi.fn(),
        createTable: vi.fn(),
        updateTable: vi.fn(),
        deleteTable: vi.fn(),
        createReservation: vi.fn(),
        updateReservation: vi.fn(),
        updateReservationStatus: vi.fn(),
        updateTableStatus: vi.fn(),
    },
    mockCustomerApi: { getCustomerOptions: vi.fn() },
}));

vi.mock('@/hooks/useAuth', () => ({
    default: () => ({
        hasPermission: () => true,
        isAdmin: mockAuth.isAdmin,
    }),
}));

vi.mock('@/hooks/useContextData', () => ({
    default: () => ({ showToast: mockShowToast }),
}));

vi.mock('@/api/table.api', () => mockTableApi);
vi.mock('@/api/customer.api', () => mockCustomerApi);

vi.mock('@/components/common/Icon', () => ({
    default: () => <span data-testid="icon" />,
}));

vi.mock('@/components/common/ConfirmModal', () => ({
    default: ({ show, action, actionDisabled }: { show: boolean; action: () => void; actionDisabled?: boolean }) =>
        show ? (
            <button data-testid="confirm-action" onClick={action} disabled={actionDisabled}>
                Confirm
            </button>
        ) : null,
}));

vi.mock('@/components/common/ApprovalRequestModal', () => ({
    default: ({ show, onSent }: { show: boolean; onSent: () => void }) =>
        show ? (
            <button data-testid="approval-sent" onClick={onSent}>
                Send request
            </button>
        ) : null,
}));

vi.mock('@/components/common/TableVisual', () => ({
    default: () => <div data-testid="table-visual" />,
}));

vi.mock('./components/FloorMap', () => ({
    default: ({
        tables,
        onTableClick,
        onDragEnd,
    }: {
        tables: unknown[];
        onTableClick: (t: unknown) => void;
        onDragEnd?: (id: number, x: number, y: number) => void;
    }) => (
        <>
            <button data-testid="open-table-action" onClick={() => tables[0] && onTableClick(tables[0])}>
                FloorMap ({tables.length})
            </button>
            {onDragEnd && tables[0] && (
                <button
                    data-testid="drag-table"
                    onClick={() => {
                        const t = tables[0] as { id: number };
                        onDragEnd(t.id, 250, 250);
                    }}
                >
                    Drag
                </button>
            )}
        </>
    ),
}));

vi.mock('./components/PositionPicker', () => ({
    default: () => <div data-testid="position-picker" />,
}));

/* ------------------------------------------------------------------ */
/*  Fixtures                                                          */
/* ------------------------------------------------------------------ */

const tableT1 = {
    id: 10,
    tableNumber: 'T1',
    areaId: 1,
    floorId: 1,
    seats: 6,
    shape: 'ROUND',
    xPosition: 100,
    yPosition: 100,
    status: 'available',
};

const activeReservation = {
    id: 1,
    tableId: 10,
    customerId: 1,
    customerName: 'John Doe',
    reservationTime: '2026-09-01T18:00:00',
    guests: 2,
    notes: null,
    status: 'booked',
};

const axiosError = (message: string) =>
    Object.assign(new Error(message), { isAxiosError: true, response: { data: { message } } });

const dateStr = (offsetDays: number) => {
    const d = new Date(Date.now() + offsetDays * 86400000);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
};

/** The form of the currently open react-bootstrap Modal (portaled into body). */
const openModalForm = () => document.querySelector('.modal form') as HTMLFormElement;

/**
 * Click a table on the map, waiting until the mocked FloorMap shows exactly
 * `count` tables — the page renders the map as soon as floors load, before
 * the async getTables call has resolved, and a click there would be a no-op.
 */
const openTableAction = async (count = 1) => {
    const map = await screen.findByText(`FloorMap (${count})`);
    fireEvent.click(map);
};

const renderPage = () => render(<TablesPage />);

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */

beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.isAdmin = true;
    mockTableApi.getTableAreas.mockResolvedValue([{ id: 1, name: 'Main' }]);
    mockTableApi.getTableFloors.mockResolvedValue([{ id: 1, name: 'Floor 1' }]);
    mockTableApi.getTables.mockResolvedValue([]);
    mockTableApi.getReservations.mockResolvedValue([]);
    mockCustomerApi.getCustomerOptions.mockResolvedValue([{ id: 1, name: 'John Doe' }]);
    mockTableApi.createTable.mockResolvedValue({ id: 11 });
    mockTableApi.createTableFloor.mockResolvedValue({ id: 1, name: 'Floor 1' });
    mockTableApi.deleteTable.mockResolvedValue(undefined);
    mockTableApi.deleteTableFloor.mockResolvedValue(undefined);
    mockTableApi.createReservation.mockResolvedValue({ id: 1 });
    mockTableApi.updateReservation.mockResolvedValue({ id: 1 });
    mockTableApi.updateReservationStatus.mockResolvedValue(undefined);
    mockTableApi.updateTableStatus.mockResolvedValue(undefined);
    mockTableApi.updateTable.mockResolvedValue({ id: 10 });
});

describe('Tables page - showToast wiring', () => {
    it('toasts success when an admin adds a floor', async () => {
        mockTableApi.getTableFloors.mockResolvedValue([]);
        mockTableApi.createTableFloor.mockImplementation(async (name: string) => ({ id: 1, name }));
        renderPage();

        fireEvent.click(await screen.findByRole('button', { name: /add floor/i }));
        const input = await screen.findByPlaceholderText('e.g. Floor 2');
        fireEvent.change(input, { target: { value: 'Mezzanine' } });
        fireEvent.submit(input.closest('form')!);

        await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('success', 'Floor Mezzanine added.'));
    });

    it('toasts the backend error message when adding a floor fails', async () => {
        mockTableApi.getTableFloors.mockResolvedValue([]);
        mockTableApi.createTableFloor.mockRejectedValue(axiosError('Floor name already exists'));
        renderPage();

        fireEvent.click(await screen.findByRole('button', { name: /add floor/i }));
        const input = await screen.findByPlaceholderText('e.g. Floor 2');
        fireEvent.submit(input.closest('form')!);

        await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('error', 'Floor name already exists'));
    });

    it('toasts success when adding a table', async () => {
        renderPage();

        fireEvent.click(await screen.findByRole('button', { name: /add table/i }));
        const nameInput = await screen.findByPlaceholderText('e.g. T10');
        fireEvent.change(nameInput, { target: { value: 'T1' } });
        fireEvent.submit(nameInput.closest('form')!);

        await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('success', 'Table added successfully.'));
    });

    it('toasts the backend error message when adding a table fails', async () => {
        mockTableApi.createTable.mockRejectedValue(axiosError('Table number already exists'));
        renderPage();

        fireEvent.click(await screen.findByRole('button', { name: /add table/i }));
        const nameInput = await screen.findByPlaceholderText('e.g. T10');
        fireEvent.change(nameInput, { target: { value: 'T1' } });
        fireEvent.submit(nameInput.closest('form')!);

        await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('error', 'Table number already exists'));
    });

    it('toasts an error when reserving a table with a past time', async () => {
        mockTableApi.getTables.mockResolvedValue([tableT1]);
        renderPage();

        await openTableAction();
        fireEvent.click(await screen.findByRole('button', { name: /reservation/i }));

        const form = openModalForm();
        const dateInput = form.querySelector('input[type="date"]') as HTMLInputElement;
        fireEvent.change(dateInput, { target: { value: dateStr(-1) } });
        fireEvent.submit(form);

        await waitFor(() =>
            expect(mockShowToast).toHaveBeenCalledWith('error', 'Reservation time must be in the future.'),
        );
    });

    it('toasts success when creating a reservation', async () => {
        mockTableApi.getTables.mockResolvedValue([tableT1]);
        renderPage();

        await openTableAction();
        fireEvent.click(await screen.findByRole('button', { name: /reservation/i }));

        const form = openModalForm();
        fireEvent.change(form.querySelector('input[type="date"]')!, { target: { value: dateStr(1) } });
        fireEvent.change(form.querySelector('input[type="time"]')!, { target: { value: '12:00' } });
        fireEvent.change(form.querySelector('select')!, { target: { value: '1' } });
        fireEvent.submit(form);

        await waitFor(() =>
            expect(mockShowToast).toHaveBeenCalledWith('success', 'Reservation created successfully.'),
        );
    });

    it('toasts success when freeing a table with no active bookings', async () => {
        mockTableApi.getTables.mockResolvedValue([{ ...tableT1, status: 'occupied' }]);
        renderPage();

        await openTableAction();
        fireEvent.click(await screen.findByRole('button', { name: /view reservation/i }));
        fireEvent.click(await screen.findByRole('button', { name: /mark as available/i }));

        await waitFor(() =>
            expect(mockShowToast).toHaveBeenCalledWith('success', 'Table T1 marked as Available.'),
        );
    });

    it('toasts success when cancelling a reservation', async () => {
        mockTableApi.getTables.mockResolvedValue([{ ...tableT1, status: 'booked' }]);
        mockTableApi.getReservations.mockResolvedValue([activeReservation]);
        renderPage();

        await openTableAction();
        fireEvent.click(await screen.findByRole('button', { name: /view reservation/i }));
        fireEvent.click(await screen.findByText('John Doe'));
        fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

        await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('success', 'Reservation cancelled.'));
    });

    it('toasts success when an admin deletes a floor', async () => {
        mockTableApi.getTableFloors.mockResolvedValue([
            { id: 1, name: 'Ground' },
            { id: 2, name: 'Mezzanine' },
        ]);
        renderPage();

        fireEvent.click(await screen.findByTitle('Delete Ground'));
        fireEvent.click(await screen.findByTestId('confirm-action'));

        await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('success', 'Floor Ground deleted.'));
    });

    it('toasts an info message when a non-admin requests to delete a table', async () => {
        mockAuth.isAdmin = false;
        mockTableApi.getTables.mockResolvedValue([tableT1]);
        renderPage();

        await openTableAction();
        fireEvent.click(await screen.findByRole('button', { name: /delete table/i }));
        fireEvent.click(await screen.findByTestId('approval-sent'));

        await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('info', 'Delete table request sent.'));
    });

    it('toasts success when an admin deletes a table', async () => {
        mockTableApi.getTables.mockResolvedValue([tableT1]);
        renderPage();

        await openTableAction();
        fireEvent.click(await screen.findByRole('button', { name: /delete table/i }));
        fireEvent.click(await screen.findByTestId('confirm-action'));

        await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('success', 'Table T1 deleted.'));
    });

    it('toasts success when editing a table', async () => {
        mockTableApi.getTables.mockResolvedValue([tableT1]);
        renderPage();

        await openTableAction();
        fireEvent.click(await screen.findByRole('button', { name: /edit table/i }));

        // The Edit Table form lives in an Offcanvas (not a Modal).
        const form = document.querySelector('.offcanvas form') as HTMLFormElement;
        fireEvent.submit(form);

        await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('success', 'Table updated successfully.'));
    });

    it('toasts success when editing a reservation', async () => {
        mockTableApi.getTables.mockResolvedValue([{ ...tableT1, status: 'booked' }]);
        mockTableApi.getReservations.mockResolvedValue([activeReservation]);
        renderPage();

        await openTableAction();
        fireEvent.click(await screen.findByRole('button', { name: /view reservation/i }));
        fireEvent.click(await screen.findByText('John Doe'));
        fireEvent.click(await screen.findByRole('button', { name: /edit/i }));

        fireEvent.submit(openModalForm()!);

        await waitFor(() =>
            expect(mockShowToast).toHaveBeenCalledWith('success', 'Reservation updated successfully.'),
        );
    });

    it('toasts an info message when a non-admin sends an add-floor approval request', async () => {
        mockAuth.isAdmin = false;
        mockTableApi.getTableFloors.mockResolvedValue([]);
        renderPage();

        fireEvent.click(await screen.findByRole('button', { name: /add floor/i }));
        const input = await screen.findByPlaceholderText('e.g. Floor 2');
        fireEvent.change(input, { target: { value: 'Floor 9' } });
        fireEvent.submit(input.closest('form')!);

        fireEvent.click(await screen.findByTestId('approval-sent'));

        await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('info', 'Add floor request sent.'));
    });

    it('toasts the backend error message when deleting a floor fails', async () => {
        mockTableApi.getTableFloors.mockResolvedValue([
            { id: 1, name: 'Ground' },
            { id: 2, name: 'Mezzanine' },
        ]);
        mockTableApi.deleteTableFloor.mockRejectedValue(axiosError('Floor has tables and cannot be deleted'));
        renderPage();

        fireEvent.click(await screen.findByTitle('Delete Ground'));
        fireEvent.click(await screen.findByTestId('confirm-action'));

        await waitFor(() =>
            expect(mockShowToast).toHaveBeenCalledWith('error', 'Floor has tables and cannot be deleted'),
        );
    });

    it('toasts an error when the edited table overlaps another table', async () => {
        // T2 sits at the exact same position as T1, so saving T1 without
        // moving it would overlap.
        mockTableApi.getTables.mockResolvedValue([
            tableT1,
            { ...tableT1, id: 11, tableNumber: 'T2', xPosition: 100, yPosition: 100 },
        ]);
        renderPage();

        await openTableAction(2);
        fireEvent.click(await screen.findByRole('button', { name: /edit table/i }));
        fireEvent.submit(document.querySelector('.offcanvas form') as HTMLFormElement);

        await waitFor(() =>
            expect(mockShowToast).toHaveBeenCalledWith('error', 'Position overlaps another table.'),
        );
    });

    it('toasts the backend error message when editing a table fails', async () => {
        mockTableApi.getTables.mockResolvedValue([tableT1]);
        mockTableApi.updateTable.mockRejectedValue(axiosError('Table number already exists'));
        renderPage();

        await openTableAction();
        fireEvent.click(await screen.findByRole('button', { name: /edit table/i }));
        fireEvent.submit(document.querySelector('.offcanvas form') as HTMLFormElement);

        await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('error', 'Table number already exists'));
    });

    it('toasts the backend error message when deleting a table fails', async () => {
        mockTableApi.getTables.mockResolvedValue([tableT1]);
        mockTableApi.deleteTable.mockRejectedValue(axiosError('Table is linked to active orders'));
        renderPage();

        await openTableAction();
        fireEvent.click(await screen.findByRole('button', { name: /delete table/i }));
        fireEvent.click(await screen.findByTestId('confirm-action'));

        await waitFor(() =>
            expect(mockShowToast).toHaveBeenCalledWith('error', 'Table is linked to active orders'),
        );
    });

    it('toasts the backend error message when creating a reservation fails', async () => {
        mockTableApi.getTables.mockResolvedValue([tableT1]);
        mockTableApi.createReservation.mockRejectedValue(axiosError('Table is already reserved for this time slot'));
        renderPage();

        await openTableAction();
        fireEvent.click(await screen.findByRole('button', { name: /reservation/i }));

        const form = openModalForm();
        fireEvent.change(form.querySelector('input[type="date"]')!, { target: { value: dateStr(1) } });
        fireEvent.change(form.querySelector('input[type="time"]')!, { target: { value: '12:00' } });
        fireEvent.change(form.querySelector('select')!, { target: { value: '1' } });
        fireEvent.submit(form);

        await waitFor(() =>
            expect(mockShowToast).toHaveBeenCalledWith('error', 'Table is already reserved for this time slot'),
        );
    });

    it('toasts the backend error message when updating a reservation fails', async () => {
        mockTableApi.getTables.mockResolvedValue([{ ...tableT1, status: 'booked' }]);
        mockTableApi.getReservations.mockResolvedValue([activeReservation]);
        mockTableApi.updateReservation.mockRejectedValue(axiosError('Reservation time conflicts'));
        renderPage();

        await openTableAction();
        fireEvent.click(await screen.findByRole('button', { name: /view reservation/i }));
        fireEvent.click(await screen.findByText('John Doe'));
        fireEvent.click(await screen.findByRole('button', { name: /edit/i }));
        fireEvent.submit(openModalForm()!);

        await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('error', 'Reservation time conflicts'));
    });

    it('toasts the backend error message when cancelling a reservation fails', async () => {
        mockTableApi.getTables.mockResolvedValue([{ ...tableT1, status: 'booked' }]);
        mockTableApi.getReservations.mockResolvedValue([activeReservation]);
        mockTableApi.updateReservationStatus.mockRejectedValue(axiosError('Reservation is already paid'));
        renderPage();

        await openTableAction();
        fireEvent.click(await screen.findByRole('button', { name: /view reservation/i }));
        fireEvent.click(await screen.findByText('John Doe'));
        fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

        await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('error', 'Reservation is already paid'));
    });

    it('toasts the backend error message when freeing a table fails', async () => {
        mockTableApi.getTables.mockResolvedValue([{ ...tableT1, status: 'occupied' }]);
        mockTableApi.updateTableStatus.mockRejectedValue(axiosError('Cannot update table status'));
        renderPage();

        await openTableAction();
        fireEvent.click(await screen.findByRole('button', { name: /view reservation/i }));
        fireEvent.click(await screen.findByRole('button', { name: /mark as available/i }));

        await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('error', 'Cannot update table status'));
    });

    it('handles every field change in the reserve modal and submits', async () => {
        mockTableApi.getTables.mockResolvedValue([tableT1]);
        renderPage();

        await openTableAction();
        fireEvent.click(await screen.findByRole('button', { name: /reservation/i }));

        const form = openModalForm();
        fireEvent.change(form.querySelector('input[type="date"]')!, { target: { value: dateStr(1) } });
        fireEvent.change(form.querySelector('input[type="time"]')!, { target: { value: '12:00' } });
        fireEvent.change(form.querySelector('select')!, { target: { value: '1' } });
        fireEvent.change(form.querySelector('input[type="number"]')!, { target: { value: '4' } });
        fireEvent.change(form.querySelector('textarea')!, { target: { value: 'Window seat' } });
        fireEvent.submit(form);

        await waitFor(() =>
            expect(mockShowToast).toHaveBeenCalledWith('success', 'Reservation created successfully.'),
        );
    });

    it('clamps a past time to the current time when reserving today', async () => {
        mockTableApi.getTables.mockResolvedValue([tableT1]);
        renderPage();

        await openTableAction();
        fireEvent.click(await screen.findByRole('button', { name: /reservation/i }));
        const form = openModalForm();

        // Pin the clock so the clamp assertion is deterministic (no minute
        // rollover race between the component render and this test).
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-08-10T12:00:00Z'));
        try {
            const now = new Date();
            const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
                .toISOString()
                .split('T')[0];
            const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
                now.getMinutes(),
            ).padStart(2, '0')}`;

            // Picking today with a time earlier than now must clamp the time
            // input up to the current time.
            fireEvent.change(form.querySelector('input[type="date"]')!, { target: { value: todayStr } });
            fireEvent.change(form.querySelector('input[type="time"]')!, { target: { value: '00:00' } });

            expect((form.querySelector('input[type="time"]') as HTMLInputElement).value).toBe(currentTimeStr);
        } finally {
            vi.useRealTimers();
        }
    });

    it('handles every field change in the edit-reservation modal and submits', async () => {
        mockTableApi.getTables.mockResolvedValue([{ ...tableT1, status: 'booked' }]);
        mockTableApi.getReservations.mockResolvedValue([activeReservation]);
        renderPage();

        await openTableAction();
        fireEvent.click(await screen.findByRole('button', { name: /view reservation/i }));
        fireEvent.click(await screen.findByText('John Doe'));
        fireEvent.click(await screen.findByRole('button', { name: /edit/i }));

        const form = openModalForm();
        fireEvent.change(form.querySelector('select')!, { target: { value: '1' } }); // customer
        fireEvent.change(form.querySelectorAll('select')[1]!, { target: { value: '10' } }); // table
        fireEvent.change(form.querySelector('input[type="date"]')!, { target: { value: dateStr(2) } });
        fireEvent.change(form.querySelector('input[type="time"]')!, { target: { value: '20:00' } });
        fireEvent.change(form.querySelector('input[type="number"]')!, { target: { value: '6' } });
        // Status select is the last select; locate by label to stay resilient
        // to future field reordering.
        const statusLabel = Array.from(form.querySelectorAll('label')).find((l) =>
            l.textContent?.includes('Status'),
        );
        const statusSelect = statusLabel!.nextElementSibling as HTMLSelectElement;
        fireEvent.change(statusSelect, { target: { value: 'seated' } });
        fireEvent.change(form.querySelector('textarea')!, { target: { value: 'Birthday dinner' } });
        fireEvent.submit(form);

        await waitFor(() =>
            expect(mockShowToast).toHaveBeenCalledWith('success', 'Reservation updated successfully.'),
        );
    });

    it('clamps a past time when editing a reservation for today', async () => {
        mockTableApi.getTables.mockResolvedValue([{ ...tableT1, status: 'booked' }]);
        mockTableApi.getReservations.mockResolvedValue([activeReservation]);
        renderPage();

        await openTableAction();
        fireEvent.click(await screen.findByRole('button', { name: /view reservation/i }));
        fireEvent.click(await screen.findByText('John Doe'));
        fireEvent.click(await screen.findByRole('button', { name: /edit/i }));

        const form = openModalForm();

        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-08-10T12:00:00Z'));
        try {
            const now = new Date();
            const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
                .toISOString()
                .split('T')[0];
            const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
                now.getMinutes(),
            ).padStart(2, '0')}`;

            fireEvent.change(form.querySelector('input[type="date"]')!, { target: { value: todayStr } });
            fireEvent.change(form.querySelector('input[type="time"]')!, { target: { value: '00:00' } });

            expect((form.querySelector('input[type="time"]') as HTMLInputElement).value).toBe(currentTimeStr);
        } finally {
            vi.useRealTimers();
        }
    });

    it('toasts success when a table is dragged to a new position', async () => {
        mockTableApi.getTables.mockResolvedValue([tableT1]);
        renderPage();

        fireEvent.click(await screen.findByTestId('drag-table'));

        await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('success', 'Table T1 moved to (250, 250).'));
    });

    it('toasts the backend error message when saving a dragged position fails', async () => {
        mockTableApi.getTables.mockResolvedValue([tableT1]);
        mockTableApi.updateTable.mockRejectedValue(axiosError('Cannot save table position'));
        renderPage();

        fireEvent.click(await screen.findByTestId('drag-table'));

        await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('error', 'Cannot save table position'));
    });

    it('closes the reserve modal when Cancel is clicked', async () => {
        mockTableApi.getTables.mockResolvedValue([tableT1]);
        renderPage();

        await openTableAction();
        fireEvent.click(await screen.findByRole('button', { name: /reservation/i }));
        expect(openModalForm()).not.toBeNull();

        fireEvent.click(within(openModalForm()!).getByRole('button', { name: 'Cancel' }));

        await waitFor(() => expect(document.querySelector('.modal form')).toBeNull());
    });

    it('closes the edit-reservation modal when Cancel is clicked', async () => {
        mockTableApi.getTables.mockResolvedValue([{ ...tableT1, status: 'booked' }]);
        mockTableApi.getReservations.mockResolvedValue([activeReservation]);
        renderPage();

        await openTableAction();
        fireEvent.click(await screen.findByRole('button', { name: /view reservation/i }));
        fireEvent.click(await screen.findByText('John Doe'));
        fireEvent.click(await screen.findByRole('button', { name: /edit/i }));
        expect(openModalForm()).not.toBeNull();

        fireEvent.click(within(openModalForm()!).getByRole('button', { name: 'Cancel' }));

        await waitFor(() => expect(document.querySelector('.modal form')).toBeNull());
    });

    it('closes the bookings sidebar when its close button is clicked', async () => {
        mockTableApi.getTables.mockResolvedValue([{ ...tableT1, status: 'occupied' }]);
        renderPage();

        await openTableAction();
        fireEvent.click(await screen.findByRole('button', { name: /view reservation/i }));

        // The active Offcanvas is the one with the bookings title.
        const offcanvas = document.querySelector('.offcanvas[style*="420px"]') ?? document.querySelector('.offcanvas');
        const closeButton = within(offcanvas as HTMLElement).getByLabelText('Close');
        fireEvent.click(closeButton);

        await waitFor(() =>
            expect(screen.queryByText(/Bookings — Table T1/i)).not.toBeInTheDocument(),
        );
    });

    it('toasts an error when the table data fails to load', async () => {
        mockTableApi.getTables.mockRejectedValue(new Error('network down'));
        renderPage();

        await waitFor(() =>
            expect(mockShowToast).toHaveBeenCalledWith('error', 'Failed to load data. Please try again.'),
        );
    });
});
