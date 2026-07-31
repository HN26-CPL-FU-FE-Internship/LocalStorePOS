import { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Modal, Form, Alert, Spinner, Badge } from 'react-bootstrap';
import { isAxiosError } from 'axios';
import Icon from '@/components/common/Icon';
import {
    createReservation,
    createTable,
    createTableArea,
    deleteTable,
    deleteTableArea,
    getReservations,
    getTableAreas,
    getTables,
    updateReservation,
    updateReservationStatus,
    deleteReservation,
    updateTable,
    updateTableStatus,
    type ReservationEntry,
    type ReservationStatus,
    type TableEntry,
    type TableStatus,
} from '@/api/table.api';
import { getCustomerOptions } from '@/api/customer.api';
import type { Option } from '@/api/item.api';
import useContextData from '@/hooks/useContextData';
import { ToastContext } from '@/provider/ToastProvider/ToastContext';
// import styles from './Tables.module.scss';
// import { bindCx } from '@/utils';

const statusBadgeClass: Record<TableStatus, string> = {
    available: 'badge-soft-success',
    booked: 'badge-soft-warning',
    occupied: 'badge-soft-danger',
};

const statusLabel: Record<TableStatus, string> = {
    available: 'Available',
    booked: 'Booked',
    occupied: 'Occupied',
};

const reservationBadgeClass: Record<string, string> = {
    booked: 'badge-soft-warning',
    seated: 'badge-soft-danger',
    completed: 'badge-soft-info',
    cancelled: 'badge-soft-secondary',
    paid: 'badge-soft-purple',
};

const emptyTableForm = { tableNumber: '', areaId: '', seats: '4' };
const emptyReservationForm = {
    customerId: '',
    tableId: '',
    reservationTime: '',
    guests: '2',
    notes: '',
    status: 'booked' as ReservationStatus,
};

const getTableColor = (seats: number) => {
    if (seats <= 4) return { table: '#ccfbf1', seat: '#99f6e4' };
    if (seats <= 6) return { table: '#e0e7ff', seat: '#93c5fd' };
    return { table: '#f3e8ff', seat: '#d8b4fe' };
};

const TableGraphic = ({ seats }: { seats: number }) => {
    const { table, seat } = getTableColor(seats);
    return (
        <svg width="100" height="60" viewBox="0 0 100 60" className="mx-auto d-block">
            <rect x="25" y="15" width="50" height="30" rx="8" fill={table} />
            <rect x="35" y="8" width="12" height="5" rx="2.5" fill={seat} />
            <rect x="53" y="8" width="12" height="5" rx="2.5" fill={seat} />
            <rect x="35" y="47" width="12" height="5" rx="2.5" fill={seat} />
            <rect x="53" y="47" width="12" height="5" rx="2.5" fill={seat} />
            <rect x="18" y="22" width="5" height="16" rx="2.5" fill={seat} />
            <rect x="77" y="22" width="5" height="16" rx="2.5" fill={seat} />
        </svg>
    );
};

const formatDateTime = (value: string) =>
    new Date(value).toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });

// const cx = bindCx(styles);

const TablesPage = () => {
    const [tables, setTables] = useState<TableEntry[]>([]);
    const [allReservations, setAllReservations] = useState<ReservationEntry[]>([]);
    const [areas, setAreas] = useState<Option[]>([]);
    const [customerOptions, setCustomerOptions] = useState<Option[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [areaFilter, setAreaFilter] = useState<number | ''>('');

    const [showAddTable, setShowAddTable] = useState(false);
    const [showEditTable, setShowEditTable] = useState(false);
    const [showDeleteTable, setShowDeleteTable] = useState(false);
    const [showAddArea, setShowAddArea] = useState(false);
    const [showReserve, setShowReserve] = useState(false);
    const [showEditReservation, setShowEditReservation] = useState(false);
    const [showDeleteReservation, setShowDeleteReservation] = useState(false);
    const [showReservationInfo, setShowReservationInfo] = useState(false);
    const [currentTable, setCurrentTable] = useState<TableEntry | null>(null);
    const [currentReservation, setCurrentReservation] = useState<ReservationEntry | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showReservations, setShowReservations] = useState(true);

    const [tableForm, setTableForm] = useState(emptyTableForm);
    const [newAreaName, setNewAreaName] = useState('');
    const [reservationForm, setReservationForm] = useState(emptyReservationForm);

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
            const [tablesData, reservationsData] = await Promise.all([
                getTables({ areaId: areaFilter || undefined, status: undefined }),
                getReservations({}),
            ]);
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadTables();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [areaFilter]);

    useEffect(() => {
        if (!notice) return;
        const handle = setTimeout(() => setNotice(null), 3000);
        return () => clearTimeout(handle);
    }, [notice]);

    /* ---------- Table CRUD ---------- */
    const openAddTable = () => {
        setTableForm({ ...emptyTableForm, areaId: areas[0] ? String(areas[0].id) : '' });
        setShowAddTable(true);
    };

    const { showToast } = useContextData(ToastContext);

    const handleAddTable = async () => {
        setSaving(true);
        setError(null);
        try {
            await createTable({
                tableNumber: tableForm.tableNumber.trim(),
                areaId: Number(tableForm.areaId),
                seats: Number(tableForm.seats),
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

    // const openEditTable = (table: TableEntry) => {
    //     setCurrentTable(table);
    //     setTableForm({ tableNumber: table.tableNumber, areaId: String(table.areaId), seats: String(table.seats) });
    //     setShowEditTable(true);
    // };

    const handleEditTable = async () => {
        if (!currentTable) return;
        setSaving(true);
        setError(null);
        try {
            await updateTable(currentTable.id, {
                tableNumber: tableForm.tableNumber.trim(),
                areaId: Number(tableForm.areaId),
                seats: Number(tableForm.seats),
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

    // const openDeleteTable = (table: TableEntry) => {
    //     setCurrentTable(table);
    //     setShowDeleteTable(true);
    // };

    const handleDeleteTable = async () => {
        if (!currentTable) return;
        setDeleting(true);
        setError(null);
        try {
            await deleteTable(currentTable.id);
            setShowDeleteTable(false);
            setCurrentTable(null);
            setNotice('Table deleted successfully.');
            await loadTables();
        } catch (err) {
            setError(extractErrorMessage(err, 'Cannot delete this table.'));
            setShowDeleteTable(false);
        } finally {
            setDeleting(false);
        }
    };

    // const handleMarkOccupied = async (table: TableEntry) => {
    //     try {
    //         await updateTableStatus(table.id, 'occupied');
    //         setNotice(`Đã chuyển bàn ${table.tableNumber} sang Occupied.`);
    //         await loadTables();
    //     } catch (err) {
    //         setError(extractErrorMessage(err, 'Cannot update table status.'));
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

    /* ---------- Area management ---------- */
    const handleAddArea = async () => {
        if (!newAreaName.trim()) return;
        setSaving(true);
        setError(null);
        try {
            await createTableArea(newAreaName.trim());
            setNewAreaName('');
            setAreas(await getTableAreas());
            setNotice('Table area added successfully.');
        } catch (err) {
            setError(extractErrorMessage(err, 'Failed to add table area.'));
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteArea = async (id: number) => {
        try {
            await deleteTableArea(id);
            setAreas(await getTableAreas());
            setNotice('Table area deleted successfully.');
        } catch (err) {
            setError(extractErrorMessage(err, 'Cannot delete table area (it may still have tables).'));
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

    const openDeleteReservation = (reservation: ReservationEntry) => {
        setCurrentReservation(reservation);
        setShowDeleteReservation(true);
    };

    const handleDeleteReservation = async () => {
        if (!currentReservation) return;
        setDeleting(true);
        setError(null);
        try {
            await deleteReservation(currentReservation.id);
            if (currentReservation.status === 'booked' || currentReservation.status === 'seated') {
                await updateTableStatus(currentReservation.tableId, 'available');
            }
            setShowDeleteReservation(false);
            setCurrentReservation(null);
            setNotice('Reservation deleted successfully.');
            await loadTables();
        } catch (err) {
            setError(extractErrorMessage(err, 'Cannot delete reservation.'));
            setShowDeleteReservation(false);
        } finally {
            setDeleting(false);
        }
    };

    const openReservationInfo = (table: TableEntry) => {
        setCurrentTable(table);
        const activeRes = allReservations.find(
            (r) => r.tableId === table.id && (r.status === 'booked' || r.status === 'seated'),
        );
        setCurrentReservation(activeRes ?? null);
        setShowReservationInfo(true);
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
                    <Button variant="white" onClick={() => setShowAddArea(true)}>
                        <Icon name="map-pin-plus" className="me-1" />
                        Manage Areas
                    </Button>
                    <Button variant="primary" className="d-inline-flex align-items-center" onClick={openAddTable}>
                        <Icon name="circle-plus" className="me-1" />
                        Add Table
                    </Button>
                </div>
            </div>

            <div className="d-flex flex-wrap gap-2 mb-4">
                <Button variant={areaFilter === '' ? 'dark' : 'outline-warning'} onClick={() => setAreaFilter('')}>
                    All Floors
                </Button>
                {areas.map((a) => (
                    <Button
                        key={a.id}
                        variant={areaFilter === a.id ? 'dark' : 'outline-warning'}
                        onClick={() => setAreaFilter(a.id)}
                    >
                        {a.name}
                    </Button>
                ))}
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
                <Row>
                    {tables.map((table) => {
                        const tableReservation = allReservations.find(
                            (r) => r.tableId === table.id && (r.status === 'booked' || r.status === 'seated'),
                        );
                        return (
                            <Col xxl={3} lg={4} md={6} key={table.id}>
                                <Card
                                    className="mb-4 text-center"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => {
                                        if (table.status === 'available') {
                                            openReserve(table);
                                        } else {
                                            openReservationInfo(table);
                                        }
                                    }}
                                >
                                    <Card.Body className="position-relative">
                                        <div className="mt-3 mb-4">
                                            <TableGraphic seats={table.seats} />
                                        </div>

                                        <h5 className="mb-1 fw-bold">{table.tableNumber}</h5>
                                        <p className="mb-3 text-warning d-flex align-items-center justify-content-center small">
                                            <Icon name="users" className="me-1" size={14} /> {table.seats} seats
                                        </p>

                                        <Badge bg="" className={statusBadgeClass[table.status]}>
                                            {statusLabel[table.status]}
                                        </Badge>

                                        {tableReservation && (
                                            <>
                                                <hr className="my-3" />
                                                <div className="text-center">
                                                    <h6 className="mb-1 fw-bold">{tableReservation.customerName}</h6>
                                                    <div className="text-warning small">
                                                        {new Date(tableReservation.reservationTime).toLocaleDateString(
                                                            'en-US',
                                                            { month: 'short', day: '2-digit' },
                                                        )}{' '}
                                                        &bull;{' '}
                                                        {new Date(tableReservation.reservationTime).toLocaleTimeString(
                                                            'en-US',
                                                            { hour: '2-digit', minute: '2-digit' },
                                                        )}{' '}
                                                        &bull; {tableReservation.guests} guests
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}

            {/* Upcoming Reservations */}
            <div className="d-flex align-items-center justify-content-between mt-5 mb-4 border-top pt-4">
                <h4 className="mb-0">Upcoming Reservations</h4>
                <Button variant="outline-warning" onClick={() => setShowReservations(!showReservations)}>
                    {showReservations ? 'Hide' : 'Show'}
                </Button>
            </div>

            {showReservations && (
                <Row>
                    {allReservations.length === 0 && (
                        <Col>
                            <p className="text-muted">No upcoming reservations.</p>
                        </Col>
                    )}
                    {allReservations.map((res) => (
                        <Col xl={4} md={6} key={res.id}>
                            <Card className="mb-4 shadow-sm border-0">
                                <Card.Body>
                                    <div className="d-flex justify-content-between mb-3">
                                        <div className="d-flex align-items-center gap-3">
                                            <div
                                                className="bg-dark text-white text-center rounded p-2"
                                                style={{ minWidth: '60px' }}
                                            >
                                                <div className="fw-bold">
                                                    {new Date(res.reservationTime).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: '2-digit',
                                                    })}
                                                </div>
                                                <div className="small text-muted">
                                                    {new Date(res.reservationTime).getFullYear()}
                                                </div>
                                            </div>
                                            <div>
                                                <h6 className="mb-1 fw-bold">{res.customerName}</h6>
                                                <div className="text-muted small d-flex align-items-center gap-2">
                                                    <span>
                                                        <Icon name="clock" className="me-1" />
                                                        {new Date(res.reservationTime).toLocaleTimeString('en-US', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </span>
                                                    <span>
                                                        <Icon name="armchair" className="me-1" />
                                                        Table {res.tableNumber}
                                                    </span>
                                                    <span>
                                                        <Icon name="users" className="me-1" />
                                                        {res.guests}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <Badge
                                                bg=""
                                                className={reservationBadgeClass[res.status] || 'badge-soft-primary'}
                                            >
                                                {res.status.charAt(0).toUpperCase() + res.status.slice(1)}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center border-top pt-3">
                                        <span className="text-muted small">
                                            Created {formatDateTime(res.createdAt)}
                                        </span>
                                        <div className="d-flex gap-2">
                                            <Button
                                                variant="white"
                                                size="sm"
                                                className="btn-icon rounded-circle"
                                                onClick={() => openEditReservation(res)}
                                            >
                                                <Icon name="pencil-line" />
                                            </Button>
                                            <Button
                                                variant="white"
                                                size="sm"
                                                className="btn-icon rounded-circle text-danger"
                                                onClick={() => openDeleteReservation(res)}
                                            >
                                                <Icon name="trash-2" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* ---- Add / Edit Table Modal ---- */}
            {[
                { show: showAddTable, setShow: setShowAddTable, title: 'Add Table', onSubmit: handleAddTable },
                { show: showEditTable, setShow: setShowEditTable, title: 'Edit Table', onSubmit: handleEditTable },
            ].map(({ show, setShow, title, onSubmit }) => (
                <Modal key={title} show={show} onHide={() => setShow(false)} centered>
                    <Modal.Header closeButton className="border-0 p-4 pb-3">
                        <h4 className="modal-title">{title}</h4>
                    </Modal.Header>
                    <Form
                        onSubmit={(e) => {
                            e.preventDefault();
                            onSubmit();
                        }}
                    >
                        <Modal.Body className="p-4 pt-1">
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    Table Name<span className="text-danger"> *</span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
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
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    Seats<span className="text-danger"> *</span>
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    min={1}
                                    value={tableForm.seats}
                                    onChange={(e) => setTableForm((p) => ({ ...p, seats: e.target.value }))}
                                    required
                                />
                            </Form.Group>
                            <div className="d-flex align-items-center justify-content-between gap-2 pt-1">
                                <Button variant="light" className="w-100" onClick={() => setShow(false)}>
                                    Cancel
                                </Button>
                                <Button variant="primary" type="submit" className="w-100" disabled={saving}>
                                    {saving ? 'Saving...' : 'Save'}
                                </Button>
                            </div>
                        </Modal.Body>
                    </Form>
                </Modal>
            ))}

            {/* ---- Delete Table Modal ---- */}
            <Modal show={showDeleteTable} onHide={() => setShowDeleteTable(false)} centered size="sm">
                <Modal.Body className="text-center p-4">
                    <div className="mb-4">
                        <span className="avatar avatar-xxl rounded-circle bg-danger-subtle d-inline-flex align-items-center justify-content-center">
                            <Icon name="trash-2" className="fs-2 text-danger" />
                        </span>
                    </div>
                    <h4 className="mb-1">Delete Confirmation</h4>
                    <p className="mb-4">
                        Are you sure you want to delete{currentTable ? ` "${currentTable.tableNumber}"?` : '?'}
                    </p>
                    <div className="d-flex justify-content-center gap-2">
                        <Button variant="light" className="w-100" onClick={() => setShowDeleteTable(false)}>
                            Close
                        </Button>
                        <Button variant="danger" className="w-100" onClick={handleDeleteTable} disabled={deleting}>
                            {deleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>

            {/* ---- Manage Areas Modal ---- */}
            <Modal show={showAddArea} onHide={() => setShowAddArea(false)} centered>
                <Modal.Header closeButton className="border-0 p-4 pb-3">
                    <h4 className="modal-title">Manage Areas</h4>
                </Modal.Header>
                <Modal.Body className="p-4 pt-1">
                    <div className="d-flex gap-2 mb-3">
                        <Form.Control
                            type="text"
                            placeholder="New area name"
                            value={newAreaName}
                            onChange={(e) => setNewAreaName(e.target.value)}
                        />
                        <Button variant="primary" onClick={handleAddArea} disabled={saving}>
                            Add
                        </Button>
                    </div>
                    <ul className="list-unstyled mb-0">
                        {areas.map((a) => (
                            <li
                                key={a.id}
                                className="d-flex align-items-center justify-content-between border-bottom py-2"
                            >
                                {a.name}
                                <Button
                                    variant="white"
                                    size="sm"
                                    className="btn-icon rounded-circle"
                                    onClick={() => handleDeleteArea(a.id)}
                                >
                                    <Icon name="trash-2" className="text-danger" />
                                </Button>
                            </li>
                        ))}
                    </ul>
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

            {/* ---- Delete Reservation Modal ---- */}
            <Modal show={showDeleteReservation} onHide={() => setShowDeleteReservation(false)} centered size="sm">
                <Modal.Body className="text-center p-4">
                    <div className="mb-4">
                        <span className="avatar avatar-xxl rounded-circle bg-danger-subtle d-inline-flex align-items-center justify-content-center">
                            <Icon name="trash-2" className="fs-2 text-danger" />
                        </span>
                    </div>
                    <h4 className="mb-1">Delete Confirmation</h4>
                    <p className="mb-4">Are you sure you want to delete this reservation?</p>
                    <div className="d-flex justify-content-center gap-2">
                        <Button variant="light" className="w-100" onClick={() => setShowDeleteReservation(false)}>
                            Close
                        </Button>
                        <Button
                            variant="danger"
                            className="w-100"
                            onClick={handleDeleteReservation}
                            disabled={deleting}
                        >
                            {deleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </div>
                </Modal.Body>
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
