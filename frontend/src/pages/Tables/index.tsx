import { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Modal, Form, Alert, Spinner, Badge } from 'react-bootstrap';
import { isAxiosError } from 'axios';
import Icon from '@/components/common/Icon';
import ConfirmModal from '@/components/common/ConfirmModal';
import {
    createReservation,
    createTable,
    deleteTable,
    getReservations,
    getTableAreas,
    getTables,
    updateReservation,
    updateReservationStatus,
    updateTable,
    updateTableStatus,
    type ReservationEntry,
    type ReservationStatus,
    type TableEntry,
    type TableShape,
    type TableStatus,
} from '@/api/table.api';
import { getCustomerOptions } from '@/api/customer.api';
import type { Option } from '@/api/item.api';
import useContextData from '@/hooks/useContextData';
import { ToastContext } from '@/provider/ToastProvider/ToastContext';
import FloorMap from './components/FloorMap';
import PositionPicker from './components/PositionPicker';
import TableVisual from '@/components/common/TableVisual';
import { findFreeSpot, getTableSize, tableRect, ZONE_GEOMETRY } from './components/floorMapConstants';
// import styles from './Tables.module.scss';
// import { bindCx } from '@/utils';

const reservationBadgeClass: Record<string, string> = {
    booked: 'badge-soft-warning',
    seated: 'badge-soft-danger',
    completed: 'badge-soft-info',
    cancelled: 'badge-soft-secondary',
    paid: 'badge-soft-purple',
};

const SEATS_BY_SHAPE: Record<string, string[]> = {
    ROUND: ['6', '8', '10'],
    RECTANGLE: ['4', '6', '8'],
};

const emptyTableForm = {
    tableNumber: '',
    areaId: '',
    seats: '6',
    xPosition: '500',
    yPosition: '320',
    shape: 'ROUND' as TableShape,
};
const emptyReservationForm = {
    customerId: '',
    tableId: '',
    reservationTime: '',
    guests: '2',
    notes: '',
    status: 'booked' as ReservationStatus,
};

// const cx = bindCx(styles);

const TablesPage = () => {
    const [tables, setTables] = useState<TableEntry[]>([]);
    const [allReservations, setAllReservations] = useState<ReservationEntry[]>([]);
    const [areas, setAreas] = useState<Option[]>([]);
    const [customerOptions, setCustomerOptions] = useState<Option[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const [showAddTable, setShowAddTable] = useState(false);
    const [showEditTable, setShowEditTable] = useState(false);
    const [showReserve, setShowReserve] = useState(false);
    const [showEditReservation, setShowEditReservation] = useState(false);
    const [showReservationInfo, setShowReservationInfo] = useState(false);
    const [currentTable, setCurrentTable] = useState<TableEntry | null>(null);
    const [currentReservation, setCurrentReservation] = useState<ReservationEntry | null>(null);
    const [saving, setSaving] = useState(false);

    const [tableForm, setTableForm] = useState(emptyTableForm);
    const [reservationForm, setReservationForm] = useState(emptyReservationForm);

    const sidebarReservations = sidebarTable
        ? allReservations.filter(
              (r) => r.tableId === sidebarTable.id && (r.status === 'booked' || r.status === 'seated'),
          )
        : [];

    // Live ghost marker on the map while typing coordinates in Add/Edit modal.
    const previewCoords =
        showAddTable || showEditTable
            ? {
                  x: Math.min(1000, Math.max(0, Number(tableForm.xPosition) || 0)),
                  y: Math.min(640, Math.max(0, Number(tableForm.yPosition) || 0)),
                  shape: tableForm.shape,
                  seats: Number(tableForm.seats) || 6,
              }
            : null;

    const openSpecificReservationInfo = (table: TableEntry, reservation: ReservationEntry) => {
        setCurrentTable(table);
        setCurrentReservation(reservation);
        setShowBookingsSidebar(false);
        setShowReservationInfo(true);
    };

    const openBookingsSidebar = (e: React.MouseEvent | null, table: TableEntry) => {
        if (e) e.stopPropagation();
        setSidebarTable(table);
        setShowBookingsSidebar(true);
    };

    const [showTableAction, setShowTableAction] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<TableStatus>('available');

    const openTableAction = (table: TableEntry) => {
        setCurrentTable(table);
        setSelectedStatus(table.status);
        setShowTableAction(true);
    };

    const handleUpdateTableStatus = async () => {
        if (!currentTable) return;

        try {
            await updateTableStatus(currentTable.id, selectedStatus);

            setShowStatusModal(false);
            setShowTableAction(false);

            setNotice(`Table ${currentTable.tableNumber} updated.`);
            await loadTables();
        } catch (err) {
            setError(extractErrorMessage(err, 'Cannot update table status.'));
        }
    };

    const extractErrorMessage = (err: unknown, fallback: string) => {
        if (isAxiosError(err) && err.response?.data && typeof err.response.data === 'object') {
            const data = err.response.data as { message?: string };
            if (data.message) return data.message;
        }
        return fallback;
    };

    const loadTables = async () => {
        setLoading(true);
        setError(null);
        try {
            // Always load every table: the map is a single fixed layout and
            // shows the whole restaurant at once.
            const [tablesData, reservationsData] = await Promise.all([getTables({}), getReservations({})]);
            setTables(tablesData);
            setAllReservations(reservationsData);
        } catch {
            setError('Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        (async () => {
            try {
                const [areaList, customerList] = await Promise.all([getTableAreas(), getCustomerOptions()]);
                setAreas(areaList);
                setCustomerOptions(customerList);
            } catch {
                // Non-fatal: dropdowns stay empty until retried.
            }
        })();
    }, []);

    useEffect(() => {
        loadTables();
    }, []);

    useEffect(() => {
        if (!notice) return;
        const handle = setTimeout(() => setNotice(null), 3000);
        return () => clearTimeout(handle);
    }, [notice]);

    /* ---------- Table CRUD ---------- */
    const openAddTable = () => {
        const areaId = areas[0] ? areas[0].id : 1;
        // Default to a free spot inside the zone so the new table never
        // starts on top of an existing one.
        const size = getTableSize(6, 'ROUND');
        const zone = ZONE_GEOMETRY[areaId];
        const spot = zone
            ? findFreeSpot(zone, size.width, size.height, tables
                  .filter((t) => t.areaId === areaId && t.xPosition != null && t.yPosition != null)
                  .map((t) => {
                      const s = getTableSize(t.seats, t.shape);
                      return tableRect(s.width, s.height, t.xPosition as number, t.yPosition as number);
                  }))
            : { x: 500, y: 320 };
        setTableForm({
            ...emptyTableForm,
            areaId: String(areaId),
            xPosition: String(spot.x),
            yPosition: String(spot.y),
        });
        setShowAddTable(true);
    };

    const { showToast } = useContextData(ToastContext);

    /* Position used for collision checks when adding/editing. */
    const tablePositionCheck = () => {
        const size = getTableSize(Number(tableForm.seats) || 6, tableForm.shape);
        const x = Number(tableForm.xPosition) || 0;
        const y = Number(tableForm.yPosition) || 0;
        return { size, x, y };
    };

    /**
     * True when the form position overlaps another table (used for manual
     * X/Y input — the picker already prevents overlap during drag).
     */
    const positionOverlapsExisting = (excludeId?: number) => {
        const { size, x, y } = tablePositionCheck();
        const own = tableRect(size.width, size.height, x, y);
        return tables.some((t) => {
            if (excludeId != null && t.id === excludeId) return false;
            if (t.xPosition == null || t.yPosition == null) return false;
            const s = getTableSize(t.seats, t.shape);
            return (
                own.left < t.xPosition + s.width / 2 &&
                own.right > t.xPosition - s.width / 2 &&
                own.top < t.yPosition + s.height / 2 &&
                own.bottom > t.yPosition - s.height / 2
            );
        });
    };

    const handleAddTable = async () => {
        if (positionOverlapsExisting()) {
            setError('Position overlaps another table. Pick a free spot on the map.');
            showToast('error', 'Position overlaps another table.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await createTable({
                tableNumber: tableForm.tableNumber.trim(),
                areaId: Number(tableForm.areaId),
                seats: Number(tableForm.seats),
                xPosition: Number(tableForm.xPosition),
                yPosition: Number(tableForm.yPosition),
                shape: tableForm.shape,
            });
            setShowAddTable(false);
            setNotice('Table added successfully.');
            showToast('success', 'Table added successfully.');
            await loadTables();
        } catch (err) {
            setError(extractErrorMessage(err, 'Failed to add table.'));
            showToast('error', 'Failed to add table.');
        } finally {
            setSaving(false);
        }
    };

    const openEditTable = (table: TableEntry) => {
        setCurrentTable(table);
        const shape = table.shape ?? 'ROUND';
        // Snap legacy seat counts (e.g. a 4-seat round table) to the first
        // valid option for the shape, so the dropdown always matches the DB.
        const validSeats = SEATS_BY_SHAPE[shape];
        const seats = validSeats.includes(String(table.seats)) ? String(table.seats) : validSeats[0];
        setTableForm({
            tableNumber: table.tableNumber,
            areaId: String(table.areaId),
            seats,
            xPosition: String(table.xPosition ?? 500),
            yPosition: String(table.yPosition ?? 320),
            shape,
        });
        setShowEditTable(true);
    };

    const handleEditTable = async () => {
        if (!currentTable) return;
        if (positionOverlapsExisting(currentTable.id)) {
            setError('Position overlaps another table. Pick a free spot on the map.');
            showToast('error', 'Position overlaps another table.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await updateTable(currentTable.id, {
                tableNumber: tableForm.tableNumber.trim(),
                areaId: Number(tableForm.areaId),
                seats: Number(tableForm.seats),
                xPosition: Number(tableForm.xPosition),
                yPosition: Number(tableForm.yPosition),
                shape: tableForm.shape,
            });
            setShowEditTable(false);
            setCurrentTable(null);
            setNotice('Table updated successfully.');
            await loadTables();
        } catch (err) {
            setError(extractErrorMessage(err, 'Failed to update table.'));
        } finally {
            setSaving(false);
        }
    };

    /* ---- drag-and-drop position update (from the floor map) ---- */
    const handleDragTable = async (tableId: number, x: number, y: number) => {
        const table = tables.find((t) => t.id === tableId);
        if (!table) return;

        // Optimistic update: move the table immediately on the map.
        setTables((prev) =>
            prev.map((t) => (t.id === tableId ? { ...t, xPosition: x, yPosition: y } : t)),
        );

        try {
            // Snap legacy seat counts to a valid value for the shape, so a
            // stale row never blocks a drag (mirrors openEditTable).
            const shape = table.shape ?? 'ROUND';
            const validSeats = SEATS_BY_SHAPE[shape];
            const seats = validSeats.includes(String(table.seats)) ? table.seats : Number(validSeats[0]);
            await updateTable(tableId, {
                tableNumber: table.tableNumber,
                areaId: table.areaId,
                seats,
                xPosition: x,
                yPosition: y,
                shape,
            });
            setNotice(`Table ${table.tableNumber} moved to (${x}, ${y}).`);
        } catch (err) {
            setError(extractErrorMessage(err, 'Failed to save table position.'));
            await loadTables(); // roll back to the server state
        }
    };

    const activeTableBookings = (table: TableEntry) =>
        allReservations.filter(
            (r) => r.tableId === table.id && (r.status === 'booked' || r.status === 'seated'),
        );

    const openDeleteTable = (table: TableEntry) => {
        setCurrentTable(table);
        setShowTableAction(false);
        setShowDeleteConfirm(true);
    };

    const handleDeleteTable = async () => {
        if (!currentTable) return;
        setDeleting(true);
        setError(null);
        try {
            await deleteTable(currentTable.id);
            setShowDeleteConfirm(false);
            setNotice(`Table ${currentTable.tableNumber} deleted.`);
            showToast('success', `Table ${currentTable.tableNumber} deleted.`);
            setCurrentTable(null);
            await loadTables();
        } catch (err) {
            setError(extractErrorMessage(err, 'Failed to delete table.'));
            showToast('error', 'Failed to delete table.');
            setShowDeleteConfirm(false);
        } finally {
            setDeleting(false);
        }
    };

    // const handleMarkOccupied = async (table: TableEntry) => {
    //     try {
    //         await updateTableStatus(table.id, 'occupied');
    //         setNotice(`Table ${table.tableNumber} marked as Occupied.`);
    //         await loadTables();
    //     } catch (err) {
    //         setError(extractErrorMessage(err, 'Unable to update table status.'));
    //     }
    // };

    const handleFreeTable = async (table: TableEntry) => {
        try {
            await updateTableStatus(table.id, 'available');
            setNotice(`Table ${table.tableNumber} marked as Available.`);
            setShowReservationInfo(false);
            await loadTables();
        } catch (err) {
            setError(extractErrorMessage(err, 'Cannot update table status.'));
        }
    };

    /* ---------- Reservation ---------- */
    const openReserve = (table: TableEntry) => {
        setCurrentTable(table);
        setReservationForm({ ...emptyReservationForm, tableId: String(table.id) });
        setShowReserve(true);
    };

    const handleReserve = async () => {
        if (!currentTable) return;

        if (new Date(reservationForm.reservationTime).getTime() < Date.now()) {
            return;
        }

        setSaving(true);
        setError(null);
        try {
            await createReservation({
                customerId: Number(reservationForm.customerId),
                tableId: currentTable.id,
                reservationTime: reservationForm.reservationTime,
                guests: Number(reservationForm.guests),
                notes: reservationForm.notes || undefined,
                status: reservationForm.status,
            });
            if (reservationForm.status === 'booked') {
                await updateTableStatus(currentTable.id, 'booked');
            } else if (reservationForm.status === 'seated') {
                await updateTableStatus(currentTable.id, 'occupied');
            }
            setShowReserve(false);
            setCurrentTable(null);
            setNotice('Reservation created successfully.');
            await loadTables();
        } catch (err) {
            setError(extractErrorMessage(err, 'Failed to create reservation.'));
        } finally {
            setSaving(false);
        }
    };

    const openEditReservation = (reservation: ReservationEntry) => {
        setCurrentReservation(reservation);
        let formattedTime = '';
        if (reservation.reservationTime) {
            formattedTime = new Date(reservation.reservationTime).toISOString().slice(0, 16);
        }
        setReservationForm({
            customerId: String(reservation.customerId),
            tableId: String(reservation.tableId),
            reservationTime: formattedTime,
            guests: String(reservation.guests),
            notes: reservation.notes || '',
            status: reservation.status,
        });
        setShowEditReservation(true);
    };

    const handleEditReservation = async () => {
        if (!currentReservation) return;

        if (new Date(reservationForm.reservationTime).getTime() < Date.now()) {
            return;
        }

        setSaving(true);
        setError(null);
        try {
            await updateReservation(currentReservation.id, {
                customerId: Number(reservationForm.customerId),
                tableId: Number(reservationForm.tableId),
                reservationTime: reservationForm.reservationTime,
                guests: Number(reservationForm.guests),
                notes: reservationForm.notes || undefined,
                status: reservationForm.status,
            });
            setShowEditReservation(false);
            setCurrentReservation(null);
            setNotice('Reservation updated successfully.');
            await loadTables();
        } catch (err) {
            setError(extractErrorMessage(err, 'Failed to update reservation.'));
        } finally {
            setSaving(false);
        }
    };

    const handleCancelReservation = async () => {
        if (!currentReservation) return;
        try {
            await updateReservationStatus(currentReservation.id, 'cancelled');
            if (currentTable) {
                await updateTableStatus(currentTable.id, 'available');
            }
            setShowReservationInfo(false);
            setNotice('Reservation cancelled.');
            await loadTables();
        } catch (err) {
            setError(extractErrorMessage(err, 'Cannot cancel reservation.'));
        }
    };

    // const handleSeatReservation = async () => {
    //     if (!currentReservation || !currentTable) return;
    //     try {
    //         await updateReservationStatus(currentReservation.id, 'seated');
    //         await updateTableStatus(currentTable.id, 'occupied');
    //         setShowReservationInfo(false);
    //         setNotice('Khách đã vào bàn.');
    //         await loadTables();
    //     } catch (err) {
    //         setError(extractErrorMessage(err, 'Không thể cập nhật.'));
    //     }
    // };

    const now = new Date();
    const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    return (
        <>
            <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-3 mb-4">
                <div className="flex-grow-1">
                    <h3 className="mb-0">
                        Tables
                        <Button
                            variant="white"
                            size="sm"
                            className="btn-icon rounded-circle ms-2"
                            aria-label="refresh"
                            onClick={() => loadTables()}
                        >
                            <Icon name="refresh-ccw" />
                        </Button>
                    </h3>
                </div>
                <div className="gap-2 d-flex align-items-center flex-wrap">
                    <Button variant="primary" className="d-inline-flex align-items-center" onClick={openAddTable}>
                        <Icon name="circle-plus" className="me-1" />
                        Add Table
                    </Button>
                </div>
            </div>

            {notice && (
                <Alert variant="success" onClose={() => setNotice(null)} dismissible>
                    {notice}
                </Alert>
            )}
            {error && (
                <Alert variant="danger" onClose={() => setError(null)} dismissible>
                    {error}
                </Alert>
            )}

            {loading && (
                <div className="text-center py-5">
                    <Spinner animation="border" className="me-2" />
                    Loading...
                </div>
            )}

            {!loading && tables.length === 0 && <div className="text-center py-5 text-muted">No tables found.</div>}

            {!loading && (
                <FloorMap
                    tables={tables}
                    reservations={allReservations}
                    areas={areas}
                    preview={previewCoords}
                    onTableClick={openTableAction}
                    onViewBookings={(table) => openBookingsSidebar(null, table)}
                    onDragEnd={handleDragTable}
                />
            )}

            {/* ---- Add / Edit Table Modal ---- */}
            {[
                { show: showAddTable, setShow: setShowAddTable, title: 'Add Table', onSubmit: handleAddTable },
                { show: showEditTable, setShow: setShowEditTable, title: 'Edit Table', onSubmit: handleEditTable },
            ].map(({ show, setShow, title, onSubmit }) => (
                <Offcanvas
                    key={title}
                    show={show}
                    onHide={() => setShow(false)}
                    placement="end"
                    style={{ width: 'min(92vw, 780px)' }}
                >
                    <Offcanvas.Header closeButton className="border-0 p-4 pb-2">
                        <h4 className="modal-title">{title}</h4>
                    </Offcanvas.Header>
                    <Form
                        onSubmit={(e) => {
                            e.preventDefault();
                            onSubmit();
                        }}
                    >
                        <Offcanvas.Body className="p-4 pt-3">
                            <Row className="g-4">
                                <Col md={5}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            Table Name<span className="text-danger"> *</span>
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="e.g. T10"
                                            value={tableForm.tableNumber}
                                            onChange={(e) => setTableForm((p) => ({ ...p, tableNumber: e.target.value }))}
                                            required
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            Area<span className="text-danger"> *</span>
                                        </Form.Label>
                                        <Form.Select
                                            value={tableForm.areaId}
                                            onChange={(e) => setTableForm((p) => ({ ...p, areaId: e.target.value }))}
                                            required
                                        >
                                            <option value="">Select</option>
                                            {areas.map((a) => (
                                                <option key={a.id} value={a.id}>
                                                    {a.name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                    {/* ---- Shape selector ---- */}
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            Table Type<span className="text-danger"> *</span>
                                        </Form.Label>
                                        <div className="d-flex gap-3">
                                            {(['ROUND', 'RECTANGLE'] as const).map((s) => {
                                                const isActive = tableForm.shape === s;
                                                return (
                                                    <button
                                                        key={s}
                                                        type="button"
                                                        onClick={() =>
                                                            setTableForm((p) => ({
                                                                ...p,
                                                                shape: s,
                                                                seats: SEATS_BY_SHAPE[s][0],
                                                            }))
                                                        }
                                                        style={{
                                                            flex: 1,
                                                            border: `2px solid ${isActive ? '#4361ee' : '#dee2e6'}`,
                                                            borderRadius: 12,
                                                            padding: '10px 8px 8px',
                                                            background: isActive ? '#f0f3ff' : '#fff',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.18s ease',
                                                            outline: 'none',
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                width: '100%',
                                                                height: 68,
                                                                position: 'relative',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            <div style={{ width: s === 'ROUND' ? 68 : 90, height: s === 'ROUND' ? 68 : 56, position: 'relative' }}>
                                                                <TableVisual
                                                                    shape={s}
                                                                    seats={Number(SEATS_BY_SHAPE[s][0])}
                                                                    status="preview"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? '#4361ee' : '#6c757d', marginTop: 4 }}>
                                                            {s === 'ROUND' ? 'Round' : 'Rectangle'}
                                                            <span style={{ fontSize: 11, fontWeight: 400, display: 'block', color: isActive ? '#6b7cda' : '#adb5bd' }}>
                                                                {s === 'ROUND' ? '6 / 8 / 10 seats' : '4 / 6 / 8 seats'}
                                                            </span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </Form.Group>
                                    {/* ---- Seats dropdown (conditioned on shape) ---- */}
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            Seats<span className="text-danger"> *</span>
                                        </Form.Label>
                                        <Form.Select
                                            value={tableForm.seats}
                                            onChange={(e) => setTableForm((p) => ({ ...p, seats: e.target.value }))}
                                            required
                                        >
                                            {SEATS_BY_SHAPE[tableForm.shape].map((s) => (
                                                <option key={s} value={s}>
                                                    {s} seats
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                    <Row>
                                        <Col xs={6}>
                                            <Form.Group>
                                                <Form.Label>Position X</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    min={0}
                                                    max={1000}
                                                    value={tableForm.xPosition}
                                                    onChange={(e) => setTableForm((p) => ({ ...p, xPosition: e.target.value }))}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col xs={6}>
                                            <Form.Group>
                                                <Form.Label>Position Y</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    min={0}
                                                    max={640}
                                                    value={tableForm.yPosition}
                                                    onChange={(e) => setTableForm((p) => ({ ...p, yPosition: e.target.value }))}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <p className="text-muted small mb-0 mt-3">
                                        <Icon name="info" size={13} className="me-1" />
                                        Tip: click or drag on the floor plan to fine-tune the position.
                                    </p>
                                </Col>
                                <Col md={7}>
                                    <Form.Label className="d-block fw-semibold mb-2">
                                        Place on floor plan
                                    </Form.Label>
                                    <PositionPicker
                                        x={Number(tableForm.xPosition) || 0}
                                        y={Number(tableForm.yPosition) || 0}
                                        shape={tableForm.shape}
                                        seats={Number(tableForm.seats) || 2}
                                        areas={areas}
                                        activeAreaId={tableForm.areaId ? Number(tableForm.areaId) : undefined}
                                        existing={showEditTable && currentTable ? tables.filter((t) => t.id !== currentTable.id) : tables}
                                        onPositionChange={(px, py) =>
                                            setTableForm((p) => ({ ...p, xPosition: String(px), yPosition: String(py) }))
                                        }
                                    />
                                </Col>
                            </Row>
                        </Offcanvas.Body>
                        <div className="d-flex justify-content-end gap-2 border-top px-4 py-3">
                            <Button variant="light" className="px-4" onClick={() => setShow(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" className="px-4" disabled={saving}>
                                {saving ? 'Saving...' : title === 'Add Table' ? 'Add Table' : 'Save Changes'}
                            </Button>
                        </div>
                    </Form>
                </Offcanvas>
            ))}

            {/* ---- Table Action Modal ---- */}
            <Modal show={showTableAction} onHide={() => setShowTableAction(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Table {currentTable?.tableNumber}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {currentTable?.status === 'available' ? (
                        <div className="d-grid gap-3">
                            <Button
                                variant="outline-warning"
                                onClick={() => {
                                    setShowTableAction(false);
                                    setShowStatusModal(true);
                                }}
                            >
                                <Icon name="settings" className="me-2" />
                                Set Status
                            </Button>

                            <Button
                                variant="primary"
                                onClick={() => {
                                    setShowTableAction(false);
                                    if (currentTable) {
                                        openReserve(currentTable);
                                    }
                                }}
                            >
                                <Icon name="calendar" className="me-2" />
                                Reservation
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant="outline-primary"
                            onClick={() => {
                                setShowTableAction(false);
                                if (currentTable) {
                                    openEditTable(currentTable);
                                }
                            }}
                        >
                            <Icon name="pencil-line" className="me-2" />
                            Edit Table (Position / Shape)
                        </Button>

                        <Button
                            variant="primary"
                            onClick={() => {
                                setShowTableAction(false);
                                if (currentTable) {
                                    openReservationInfo(currentTable);
                                }
                            }}
                        >
                            View Reservation
                        </Button>

                        <hr className="my-1" />

                        {currentTable && activeTableBookings(currentTable).length > 0 && (
                            <p className="text-muted small mb-0">
                                <Icon name="info" size={13} className="me-1" />
                                Table has active bookings — delete is disabled.
                            </p>
                        )}
                        <Button
                            variant="outline-danger"
                            disabled={currentTable ? activeTableBookings(currentTable).length > 0 : false}
                            onClick={() => {
                                if (currentTable) {
                                    openDeleteTable(currentTable);
                                }
                            }}
                        >
                            <Icon name="trash-2" className="me-2" />
                            Delete Table
                        </Button>
                     </div>
                </Modal.Body>
            </Modal>

            {/* ---- Delete Table Confirmation ---- */}
            <ConfirmModal
                show={showDeleteConfirm}
                handleClose={() => setShowDeleteConfirm(false)}
                type="delete"
                data={`table ${currentTable?.tableNumber ?? ''}`}
                action={handleDeleteTable}
                actionDisabled={deleting}
            />

            {/* ---- Set Status Modal ---- */}
            <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Set Table Status</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Status</Form.Label>

                        <Form.Select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value as TableStatus)}
                        >
                            <option value="available">Available</option>
                            <option value="occupied">Occupied</option>
                        </Form.Select>
                    </Form.Group>

                    <div className="d-flex gap-2 mt-4">
                        <Button variant="light" className="w-100" onClick={() => setShowStatusModal(false)}>
                            Cancel
                        </Button>

                        <Button className="w-100" onClick={handleUpdateTableStatus}>
                            Save
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>

            {/* ---- Reserve Table Modal ---- */}
            <Modal show={showReserve} onHide={() => setShowReserve(false)} centered>
                <Modal.Header closeButton className="border-0 p-4 pb-3">
                    <h4 className="modal-title">Reserve {currentTable?.tableNumber}</h4>
                </Modal.Header>
                <Form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleReserve();
                    }}
                >
                    <Modal.Body className="p-4 pt-1">
                        <Form.Group className="mb-3">
                            <Form.Label>
                                Customer<span className="text-danger"> *</span>
                            </Form.Label>
                            <Form.Select
                                value={reservationForm.customerId}
                                onChange={(e) => setReservationForm((p) => ({ ...p, customerId: e.target.value }))}
                                required
                            >
                                <option value="">Select</option>
                                {customerOptions.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Row className="mb-3">
                            <Col sm={6}>
                                <Form.Group>
                                    <Form.Label>
                                        Date<span className="text-danger"> *</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="date"
                                        min={todayStr}
                                        value={reservationForm.reservationTime.split('T')[0] || ''}
                                        onChange={(e) => {
                                            const newDate = e.target.value;
                                            let timePart = reservationForm.reservationTime.split('T')[1] || '12:00';
                                            if (newDate === todayStr && timePart < currentTimeStr) {
                                                timePart = currentTimeStr;
                                            }
                                            setReservationForm((p) => ({
                                                ...p,
                                                reservationTime: `${newDate}T${timePart}`,
                                            }));
                                        }}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col sm={6}>
                                <Form.Group>
                                    <Form.Label>
                                        Time<span className="text-danger"> *</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="time"
                                        min={
                                            reservationForm.reservationTime.split('T')[0] === todayStr
                                                ? currentTimeStr
                                                : undefined
                                        }
                                        value={reservationForm.reservationTime.split('T')[1] || ''}
                                        onChange={(e) => {
                                            let newTime = e.target.value;
                                            const datePart = reservationForm.reservationTime.split('T')[0] || todayStr;
                                            if (datePart === todayStr && newTime < currentTimeStr) {
                                                newTime = currentTimeStr;
                                            }
                                            setReservationForm((p) => ({
                                                ...p,
                                                reservationTime: `${datePart}T${newTime}`,
                                            }));
                                        }}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>
                                Guests<span className="text-danger"> *</span>
                            </Form.Label>
                            <Form.Control
                                type="number"
                                min={1}
                                value={reservationForm.guests}
                                onChange={(e) => setReservationForm((p) => ({ ...p, guests: e.target.value }))}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Notes</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={reservationForm.notes}
                                onChange={(e) => setReservationForm((p) => ({ ...p, notes: e.target.value }))}
                            />
                        </Form.Group>
                        <div className="d-flex align-items-center justify-content-between gap-2 pt-1">
                            <Button variant="light" className="w-100" onClick={() => setShowReserve(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" className="w-100" disabled={saving}>
                                {saving ? 'Saving...' : 'Reserve'}
                            </Button>
                        </div>
                    </Modal.Body>
                </Form>
            </Modal>

            {/* ---- Edit Reservation Modal ---- */}
            <Modal show={showEditReservation} onHide={() => setShowEditReservation(false)} centered>
                <Modal.Header closeButton className="border-0 p-4 pb-3">
                    <h4 className="modal-title">Edit Reservation</h4>
                </Modal.Header>
                <Form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleEditReservation();
                    }}
                >
                    <Modal.Body className="p-4 pt-1">
                        <Form.Group className="mb-3">
                            <Form.Label>
                                Customer<span className="text-danger"> *</span>
                            </Form.Label>
                            <Form.Select
                                value={reservationForm.customerId}
                                onChange={(e) => setReservationForm((p) => ({ ...p, customerId: e.target.value }))}
                                required
                            >
                                <option value="">Select</option>
                                {customerOptions.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>
                                Table<span className="text-danger"> *</span>
                            </Form.Label>
                            <Form.Select
                                value={reservationForm.tableId}
                                onChange={(e) => setReservationForm((p) => ({ ...p, tableId: e.target.value }))}
                                required
                            >
                                <option value="">Select</option>
                                {tables.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        Table {t.tableNumber}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Row className="mb-3">
                            <Col sm={6}>
                                <Form.Group>
                                    <Form.Label>
                                        Date<span className="text-danger"> *</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="date"
                                        min={todayStr}
                                        value={reservationForm.reservationTime.split('T')[0] || ''}
                                        onChange={(e) => {
                                            const newDate = e.target.value;
                                            let timePart = reservationForm.reservationTime.split('T')[1] || '12:00';
                                            if (newDate === todayStr && timePart < currentTimeStr) {
                                                timePart = currentTimeStr;
                                            }
                                            setReservationForm((p) => ({
                                                ...p,
                                                reservationTime: `${newDate}T${timePart}`,
                                            }));
                                        }}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col sm={6}>
                                <Form.Group>
                                    <Form.Label>
                                        Time<span className="text-danger"> *</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="time"
                                        min={
                                            reservationForm.reservationTime.split('T')[0] === todayStr
                                                ? currentTimeStr
                                                : undefined
                                        }
                                        value={reservationForm.reservationTime.split('T')[1] || ''}
                                        onChange={(e) => {
                                            let newTime = e.target.value;
                                            const datePart = reservationForm.reservationTime.split('T')[0] || todayStr;
                                            if (datePart === todayStr && newTime < currentTimeStr) {
                                                newTime = currentTimeStr;
                                            }
                                            setReservationForm((p) => ({
                                                ...p,
                                                reservationTime: `${datePart}T${newTime}`,
                                            }));
                                        }}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>
                                Guests<span className="text-danger"> *</span>
                            </Form.Label>
                            <Form.Control
                                type="number"
                                min={1}
                                value={reservationForm.guests}
                                onChange={(e) => setReservationForm((p) => ({ ...p, guests: e.target.value }))}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Status</Form.Label>
                            <Form.Select
                                value={reservationForm.status}
                                onChange={(e) =>
                                    setReservationForm((p) => ({ ...p, status: e.target.value as ReservationStatus }))
                                }
                            >
                                <option value="booked">Booked</option>
                                <option value="seated">Seated</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="paid">Paid</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Notes</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={reservationForm.notes}
                                onChange={(e) => setReservationForm((p) => ({ ...p, notes: e.target.value }))}
                            />
                        </Form.Group>
                        <div className="d-flex align-items-center justify-content-between gap-2 pt-1">
                            <Button variant="light" className="w-100" onClick={() => setShowEditReservation(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" className="w-100" disabled={saving}>
                                {saving ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </Modal.Body>
                </Form>
            </Modal>

            {/* ---- Reservation Info Modal ---- */}
            <Modal show={showReservationInfo} onHide={() => setShowReservationInfo(false)} centered>
                <Modal.Header closeButton className="border-0 p-4 pb-3">
                    <h4 className="modal-title">{currentTable?.tableNumber} — Reservation</h4>
                </Modal.Header>
                <Modal.Body className="p-4 pt-1">
                    {!currentReservation && (
                        <div className="text-center py-4">
                            <p className="text-muted mb-4">No active reservation found.</p>
                            <Button
                                variant="outline-primary"
                                onClick={() => currentTable && handleFreeTable(currentTable)}
                            >
                                <Icon name="check" className="me-2" />
                                Mark as Available
                            </Button>
                        </div>
                    )}
                    {currentReservation && (
                        <>
                            <div className="text-center mb-4">
                                <Badge
                                    bg=""
                                    className={reservationBadgeClass[currentReservation.status] || 'badge-soft-primary'}
                                >
                                    {currentReservation.status.charAt(0).toUpperCase() +
                                        currentReservation.status.slice(1)}
                                </Badge>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-warning">Customer</span>
                                <span className="fw-medium text-dark">{currentReservation.customerName}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-warning">Date</span>
                                <span className="fw-medium text-dark">
                                    {new Date(currentReservation.reservationTime).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: '2-digit',
                                        year: 'numeric',
                                    })}
                                </span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-warning">Time</span>
                                <span className="fw-medium text-dark">
                                    {new Date(currentReservation.reservationTime).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-warning">Guests</span>
                                <span className="fw-medium text-dark">{currentReservation.guests}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-4">
                                <span className="text-warning">Seats</span>
                                <span className="fw-medium text-dark">{currentTable?.seats}</span>
                            </div>
                            <div className="d-flex gap-2">
                                <Button
                                    variant="outline-warning"
                                    className="w-100"
                                    onClick={() => {
                                        setShowReservationInfo(false);
                                        openEditReservation(currentReservation);
                                    }}
                                >
                                    <Icon name="pencil-line" size={16} className="me-2" />
                                    Edit
                                </Button>
                                <Button variant="outline-danger" className="w-100" onClick={handleCancelReservation}>
                                    Cancel
                                </Button>
                            </div>
                        </>
                    )}
                </Modal.Body>
            </Modal>
        </>
    );
};

export default TablesPage;
