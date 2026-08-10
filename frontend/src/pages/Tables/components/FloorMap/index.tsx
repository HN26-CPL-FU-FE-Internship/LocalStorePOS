import { useRef, useState } from 'react';
import type { ReservationEntry, TableEntry, TableShape, TableStatus } from '@/api/table.api';
import Icon from '@/components/common/Icon';
import { bindCx } from '@/utils';
import styles from './FloorMap.module.scss';
import { DECOR_OBSTACLES, getTableSize, MAP_H, MAP_W, obstacleRect, resolvePlacement, tableRect, type Rect, ZONE_GEOMETRY } from '../floorMapConstants';
import TableVisual from '@/components/common/TableVisual';

const STATUS_LABEL: Record<TableStatus, string> = {
    available: 'Available',
    booked: 'Booked',
    occupied: 'Occupied',
};

const pctX = (x: number) => (x / MAP_W) * 100;
const pctY = (y: number) => (y / MAP_H) * 100;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

interface FloorMapProps {
    tables: TableEntry[];
    reservations: ReservationEntry[];
    /** All zones (table areas); used to draw the fixed zone outlines. */
    areas?: { id: number; name: string }[];
    onTableClick: (table: TableEntry) => void;
    onViewBookings: (table: TableEntry) => void;
    /** Ghost marker while a table is being added/edited. */
    preview?: { x: number; y: number; shape?: TableShape; seats?: number } | null;
    /** Called when a table is dropped at a new position (drag-and-drop). */
    onDragEnd?: (tableId: number, x: number, y: number) => void;
    /** Disables drag-and-drop (e.g. when the user lacks the Tables edit permission). */
    editable?: boolean;
}

const FloorMap = ({
    tables,
    reservations,
    areas,
    onTableClick,
    onViewBookings,
    preview,
    onDragEnd,
    editable = true,
}: FloorMapProps) => {
    const [hoveredId, setHoveredId] = useState<number | null>(null);
    const mapRef = useRef<HTMLDivElement | null>(null);
    // Small grace window after the mouse leaves a table so the pointer can
    // reach the tooltip (which extends outside the node's bounds) without the
    // tooltip unmounting before the “active booking — view” click lands.
    const hoverGraceTimerRef = useRef<number | null>(null);
    // Stores the id of the table whose post-drag click must be swallowed.
    const suppressClickRef = useRef<number | null>(null);

    const clearHoverGrace = () => {
        if (hoverGraceTimerRef.current != null) {
            window.clearTimeout(hoverGraceTimerRef.current);
            hoverGraceTimerRef.current = null;
        }
    };

    const scheduleHoverClear = () => {
        clearHoverGrace();
        hoverGraceTimerRef.current = window.setTimeout(() => setHoveredId(null), 220);
    };
    const [drag, setDrag] = useState<{
        tableId: number;
        startX: number;
        startY: number;
        x: number;
        y: number;
        offsetX: number;
        offsetY: number;
        moved: boolean;
    } | null>(null);

    /* ---- drag-and-drop (pointer events) ---- */
    const handlePointerDown = (e: React.PointerEvent, table: TableEntry) => {
        if (!onDragEnd || !editable) return;
        const rect = mapRef.current?.getBoundingClientRect();
        if (!rect) return;
        const start = resolvePosition(table);
        const pointerX = ((e.clientX - rect.left) / rect.width) * MAP_W;
        const pointerY = ((e.clientY - rect.top) / rect.height) * MAP_H;
        setDrag({
            tableId: table.id,
            startX: start.x,
            startY: start.y,
            x: start.x,
            y: start.y,
            offsetX: pointerX - start.x,
            offsetY: pointerY - start.y,
            moved: false,
        });
        e.currentTarget.setPointerCapture(e.pointerId);
        e.preventDefault();
    };

    /**
     * Resolve a dragged position so the table stays inside its own zone and
     * never overlaps another table or a decor obstacle. If the raw pointer
     * target is blocked, the table slides along the free axis instead of
     * jumping onto the obstacle (or stays put when fully blocked).
     */
    const resolveDraggedPosition = (table: TableEntry, rawX: number, rawY: number) => {
        const zone = ZONE_GEOMETRY[table.areaId];
        const size = getTableSize(table.seats, table.shape);
        // Other tables (using their current resolved positions) + decor.
        const obstacles: Rect[] = DECOR_OBSTACLES.map((o) => obstacleRect(o));
        for (const t of tables) {
            if (t.id === table.id) continue;
            const p = resolvePosition(t);
            const ts = getTableSize(t.seats, t.shape);
            obstacles.push(tableRect(ts.width, ts.height, p.x, p.y));
        }
        return resolvePlacement({
            rawX,
            rawY,
            width: size.width,
            height: size.height,
            minX: zone ? zone.left : 0,
            maxX: zone ? zone.left + zone.width : MAP_W,
            minY: zone ? zone.top : 0,
            maxY: zone ? zone.top + zone.height : MAP_H,
            obstacles,
            prevX: drag?.x ?? rawX,
            prevY: drag?.y ?? rawY,
        });
    };

    const handlePointerMove = (e: React.PointerEvent, table: TableEntry) => {
        if (!drag || drag.tableId !== table.id) return;
        const rect = mapRef.current?.getBoundingClientRect();
        if (!rect) return;
        const pointerX = ((e.clientX - rect.left) / rect.width) * MAP_W;
        const pointerY = ((e.clientY - rect.top) / rect.height) * MAP_H;
        const rawX = clamp(pointerX - drag.offsetX, 0, MAP_W);
        const rawY = clamp(pointerY - drag.offsetY, 0, MAP_H);
        const resolved = resolveDraggedPosition(table, rawX, rawY);
        const moved = drag.moved || Math.hypot(resolved.x - drag.startX, resolved.y - drag.startY) > 3;
        setDrag((d) => (d ? { ...d, x: resolved.x, y: resolved.y, moved } : d));
    };

    const finishDrag = (table: TableEntry) => {
        if (!drag || drag.tableId !== table.id) return;
        if (drag.moved) {
            if (onDragEnd) onDragEnd(table.id, Math.round(drag.x), Math.round(drag.y));
            // Swallow the click that fires right after a drag, so the action
            // modal does not pop open unintentionally. Track per table and add
            // a timeout safety net in case that click never dispatches (e.g.
            // an API error remounts the node), so no future click is eaten.
            suppressClickRef.current = table.id;
            window.setTimeout(() => {
                if (suppressClickRef.current === table.id) suppressClickRef.current = null;
            }, 300);
        }
        setDrag(null);
    };

    const handlePointerUp = (_e: React.PointerEvent, table: TableEntry) => finishDrag(table);
    const handlePointerCancel = (_e: React.PointerEvent, table: TableEntry) => finishDrag(table);

    const now = new Date();

    // The map is a single fixed layout: every table is always shown and
    // every zone outline is always drawn (zones are not filterable).
    const zones = (() => {
        const byArea = new Map<number, string>();
        if (areas && areas.length > 0) {
            areas.forEach((a) => byArea.set(a.id, a.name));
        } else {
            tables.forEach((t) => {
                if (!byArea.has(t.areaId)) byArea.set(t.areaId, t.areaName);
            });
        }
        return [...byArea.entries()]
            .map(([areaId, label]) => ({ areaId, label, geometry: ZONE_GEOMETRY[areaId] }))
            .filter((z) => z.geometry);
    })();

    const activeReservations = (table: TableEntry) =>
        reservations.filter((r) => r.tableId === table.id && (r.status === 'booked' || r.status === 'seated'));

    const displayStatus = (table: TableEntry, active: ReservationEntry[]): TableStatus => {
        // Table flagged "booked" but with a reservation still in the future is
        // effectively available for walk-ins (mirrors the previous card view).
        if (table.status === 'booked' && active.some((r) => new Date(r.reservationTime) > now)) {
            return 'available';
        }
        return table.status;
    };

    const resolvePosition = (table: TableEntry) => {
        if (table.xPosition != null && table.yPosition != null) {
            return { x: table.xPosition, y: table.yPosition };
        }
        // Legacy tables without coordinates get an automatic grid slot.
        const idx = tables.indexOf(table);
        const col = idx % 4;
        const row = Math.floor(idx / 4);
        return { x: 130 + col * 220, y: 210 + row * 170 };
    };

    const cx = bindCx(styles);

    return (
        <div>
            <div ref={mapRef} className={styles['floor-map']}>
                {/* ---- decorative restaurant layout ---- */}
                <div className={styles['windows-top']} />
                <div className={styles['windows-left']} />
                <div className={styles['windows-right']} />
                <div className={styles['map-bar']}>
                    <span className={styles['map-bar-label']}>Bar</span>
                </div>
                <div className={styles['map-kitchen']}>
                    <span className={styles['map-kitchen-label']}>Kitchen</span>
                </div>
                <div className={styles['map-entrance']}>
                    <Icon name="arrow-down" size={12} className={styles['map-entrance-arrow']} />
                    <span className={styles['map-entrance-label']}>Entrance</span>
                </div>

                {/* ---- fixed zones (drawn under tables) ---- */}
                {zones.map((zone) => (
                    <div
                        key={zone.areaId}
                        className={styles['map-zone']}
                        style={{
                            left: `${pctX(zone.geometry.left)}%`,
                            top: `${pctY(zone.geometry.top)}%`,
                            width: `${pctX(zone.geometry.width)}%`,
                            height: `${pctY(zone.geometry.height)}%`,
                        }}
                    >
                        <span className={styles['map-zone-label']}>{zone.label}</span>
                    </div>
                ))}

                {/* ---- ghost preview while adding/editing ---- */}
                {preview && (() => {
                    const ghostSize = getTableSize(preview.seats ?? 6, preview.shape ?? 'ROUND');
                    return (
                        <div
                            className={cx(styles['preview-ghost'], preview.shape === 'RECTANGLE' && styles['preview-ghost-rect'])}
                            style={{
                                left: `${pctX(clamp(preview.x, 0, MAP_W))}%`,
                                top: `${pctY(clamp(preview.y, 0, MAP_H))}%`,
                                width: ghostSize.width,
                                height: ghostSize.height,
                            }}
                        />
                    );
                })()}

                {/* ---- tables ---- */}
                {tables.map((table) => {
                    const active = activeReservations(table);
                    const status = displayStatus(table, active);
                    const isDragging = drag?.tableId === table.id;
                    const pos = isDragging && drag ? { x: drag.x, y: drag.y } : resolvePosition(table);
                    const size = getTableSize(table.seats, table.shape);
                    return (
                        <div
                            key={table.id}
                            className={cx(styles['table-node'], isDragging && styles['is-dragging'])}
                            style={{
                                left: `${pctX(pos.x)}%`,
                                top: `${pctY(pos.y)}%`,
                                touchAction: 'none',
                            }}
                            onMouseEnter={() => {
                                clearHoverGrace();
                                setHoveredId(table.id);
                            }}
                            onMouseLeave={() => scheduleHoverClear()}
                            onPointerDown={(e) => handlePointerDown(e, table)}
                            onPointerMove={(e) => handlePointerMove(e, table)}
                            onPointerUp={(e) => handlePointerUp(e, table)}
                            onPointerCancel={(e) => handlePointerCancel(e, table)}
                            onClick={() => {
                                if (suppressClickRef.current === table.id) {
                                    suppressClickRef.current = null;
                                    return;
                                }
                                onTableClick(table);
                            }}
                        >
                            <div
                                className={cx(
                                    styles['table-body'],
                                    styles[`status-${status}`],
                                    table.shape === 'RECTANGLE' && styles['is-rect'],
                                )}
                                style={size}
                            >
                                <TableVisual shape={table.shape} seats={table.seats} status={status} />
                                <span className={styles['table-label']}>{table.tableNumber}</span>
                                <span className={styles['table-seats']}>{table.seats} seats</span>
                            </div>

                            {active.length > 0 && <span className={styles['reserved-badge']}>{active.length}</span>}

                            {isDragging && (
                                <span className={styles['drag-coords']}>
                                    {Math.round(pos.x)}, {Math.round(pos.y)}
                                </span>
                            )}
                        </div>
                    );
                })}

                {/*
                  ---- Hover tooltip (rendered at map level, ABOVE every table
                  node) so a neighbouring table can never paint over it. ----
                */}
                {hoveredId != null && (() => {
                    const table = tables.find((t) => t.id === hoveredId);
                    if (!table) return null;
                    const active = activeReservations(table);
                    const status = displayStatus(table, active);
                    const pos = drag?.tableId === table.id && drag ? { x: drag.x, y: drag.y } : resolvePosition(table);
                    // Show below the table only when it sits near the top of
                    // the map (otherwise the tooltip would clip off the top).
                    const tooltipBelow = pos.y <= 210;
                    const gap = getTableSize(table.seats, table.shape).height / 2 + 26;
                    // The tooltip box is anchored so it never overlaps the
                    // table itself: above the table it grows upward (bottom
                    // anchor), below the table it grows downward (top anchor).
                    // This keeps the table node fully draggable.
                    const edgeY = tooltipBelow ? pos.y + gap : pos.y - gap;

                    return (
                        <div
                            className={cx(styles['table-tooltip'], tooltipBelow && styles['tooltip-below'])}
                            style={{
                                left: `${pctX(pos.x)}%`,
                                top: tooltipBelow ? `${pctY(edgeY)}%` : undefined,
                                bottom: tooltipBelow ? undefined : `${pctY(MAP_H - edgeY)}%`,
                            }}
                            onMouseEnter={() => {
                                clearHoverGrace();
                                setHoveredId(table.id);
                            }}
                            onMouseLeave={() => scheduleHoverClear()}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Invisible bridge over the gap between the table
                                edge and the tooltip so the pointer can travel
                                into the tooltip (and its “view” button) without
                                the tooltip unmounting. */}
                            <div
                                className={styles['tt-bridge']}
                                style={{
                                    left: '50%',
                                    top: tooltipBelow ? '-26px' : 'auto',
                                    bottom: tooltipBelow ? 'auto' : '-26px',
                                    height: '26px',
                                    transform: 'translateX(-50%)',
                                }}
                            />
                            <div className={styles['tt-header']}>
                                <span className={styles['tt-title']}>{table.tableNumber}</span>
                                <span className={cx(styles['tt-status'], styles[`tt-status-${status}`])}>
                                    {STATUS_LABEL[status]}
                                </span>
                            </div>
                            <div className={styles['tt-row']}>
                                <Icon name="users" size={13} />
                                {table.seats} seats
                            </div>
                            <div className={styles['tt-row']}>
                                <Icon name="map-pin" size={13} />
                                {table.areaName}
                            </div>
                            <div className={styles['tt-row']}>
                                <Icon name="move" size={13} />
                                ({pos.x}, {pos.y})
                            </div>
                            {active.length > 0 && (
                                <button
                                    type="button"
                                    className={styles['tt-bookings']}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onViewBookings(table);
                                    }}
                                >
                                    <Icon name="calendar-check" size={13} />
                                    {active.length} active booking{active.length > 1 ? 's' : ''} — view
                                </button>
                            )}
                        </div>
                    );
                })()}
            </div>

            {/* ---- legend ---- */}
            <div className={styles['map-legend']}>
                <span className={styles['map-legend-item']}>
                    <span className={cx(styles['legend-dot'], styles['legend-dot-available'])} />
                    Available
                </span>
                <span className={styles['map-legend-item']}>
                    <span className={cx(styles['legend-dot'], styles['legend-dot-booked'])} />
                    Booked
                </span>
                <span className={styles['map-legend-item']}>
                    <span className={cx(styles['legend-dot'], styles['legend-dot-occupied'])} />
                    Occupied
                </span>
                <span className={styles['map-legend-item']}>
                    <span className={styles['legend-sample-round']} />
                    Round
                </span>
                <span className={styles['map-legend-item']}>
                    <span className={styles['legend-sample-rect']} />
                    Rectangle
                </span>
                <span className={styles['map-hint']}>
                    <Icon name="info" size={13} />
                    {editable
                        ? 'Fixed floor plan 1000 × 640 — drag a table to reposition it'
                        : 'Fixed floor plan 1000 × 640'}
                </span>
            </div>
        </div>
    );
};

export default FloorMap;
