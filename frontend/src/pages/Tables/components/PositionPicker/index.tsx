import { useLayoutEffect, useRef, useState } from 'react';
import type { TableEntry, TableShape } from '@/api/table.api';
import { bindCx } from '@/utils';
import {
    DECOR_OBSTACLES,
    getTableSize,
    MAP_H,
    MAP_W,
    obstacleRect,
    resolvePlacement,
    tableRect,
    ZONE_GEOMETRY,
} from '../floorMapConstants';
import TableVisual from '@/components/common/TableVisual';
import styles from './PositionPicker.module.scss';

const pctX = (v: number) => (v / MAP_W) * 100;
const pctY = (v: number) => (v / MAP_H) * 100;

interface PositionPickerProps {
    x: number;
    y: number;
    shape: TableShape;
    seats: number;
    /** Available table areas; used to draw zone outlines. */
    areas: { id: number; name: string }[];
    /** Area whose zone should be highlighted. */
    activeAreaId?: number;
    /** Existing tables, drawn dimmed so the new one never overlaps them. */
    existing?: TableEntry[];
    onPositionChange: (x: number, y: number) => void;
}

/**
 * Interactive mini floor map: click or drag anywhere to place the table.
 * The marker mirrors the table's shape and size on the full-size map, scaled
 * to the picker, and placement is clamped to the selected zone while never
 * overlapping existing tables or the fixed decor.
 */
const PositionPicker = ({
    x,
    y,
    shape,
    seats,
    areas,
    activeAreaId,
    existing = [],
    onPositionChange,
}: PositionPickerProps) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [dragging, setDragging] = useState(false);
    const [pickerWidth, setPickerWidth] = useState(MAP_W);
    const cx = bindCx(styles);

    // Keep track of the rendered picker width so the marker is scaled to the
    // same proportion as on the full-size map (the full map draws tables as
    // getTableSize px within a 1000-wide grid, so pickerWidth / MAP_W is the
    // exact visual scale factor). useLayoutEffect measures before paint so the
    // marker never flashes at full size on first render.
    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const update = () => setPickerWidth(el.clientWidth || MAP_W);
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const scale = pickerWidth / MAP_W;

    // The map has fixed zones; draw them all so the picker mirrors the real
    // map, highlighting the zone currently selected in the form.
    const zones = areas
        .map((a) => ({ areaId: a.id, label: a.name, geometry: ZONE_GEOMETRY[a.id] }))
        .filter((z) => z.geometry);

    const markerSize = getTableSize(seats, shape);

    const obstacles = () => {
        const list: ReturnType<typeof tableRect>[] = DECOR_OBSTACLES.map((o) => obstacleRect(o));
        for (const t of existing) {
            if (t.xPosition == null || t.yPosition == null) continue;
            const ts = getTableSize(t.seats, t.shape);
            list.push(tableRect(ts.width, ts.height, t.xPosition, t.yPosition));
        }
        return list;
    };

    const placeFromPointer = (clientX: number, clientY: number) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const rawX = ((clientX - rect.left) / rect.width) * MAP_W;
        const rawY = ((clientY - rect.top) / rect.height) * MAP_H;

        // Keep the new table inside the zone selected in the form, and never
        // overlap existing tables or the fixed decor (slide on blocked axes).
        const zone = activeAreaId != null ? ZONE_GEOMETRY[activeAreaId] : undefined;
        const resolved = resolvePlacement({
            rawX,
            rawY,
            width: markerSize.width,
            height: markerSize.height,
            minX: zone ? zone.left : 0,
            maxX: zone ? zone.left + zone.width : MAP_W,
            minY: zone ? zone.top : 0,
            maxY: zone ? zone.top + zone.height : MAP_H,
            obstacles: obstacles(),
            prevX: x,
            prevY: y,
        });
        onPositionChange(Math.round(resolved.x), Math.round(resolved.y));
    };

    return (
        <div
            ref={containerRef}
            className={cx(styles['picker-container'], dragging && styles['picker-container-dragging'])}
            onPointerDown={(e) => {
                // Left button only — ignore right/middle clicks.
                if (e.button !== 0) return;
                e.preventDefault();
                placeFromPointer(e.clientX, e.clientY);
                e.currentTarget.setPointerCapture(e.pointerId);
                setDragging(true);
            }}
            onPointerMove={(e) => {
                if (dragging) placeFromPointer(e.clientX, e.clientY);
            }}
            onPointerUp={() => setDragging(false)}
            onPointerCancel={() => setDragging(false)}
        >
            {/* zone outlines (drawn under the marker) */}
            {zones.map((zone) => (
                <div
                    key={zone.areaId}
                    className={cx(
                        styles['picker-zone'],
                        activeAreaId === zone.areaId && styles['picker-zone-active'],
                    )}
                    style={{
                        left: `${pctX(zone.geometry.left)}%`,
                        top: `${pctY(zone.geometry.top)}%`,
                        width: `${pctX(zone.geometry.width)}%`,
                        height: `${pctY(zone.geometry.height)}%`,
                    }}
                >
                    <span className={styles['picker-zone-label']}>{zone.label}</span>
                </div>
            ))}

            {/* existing tables (dimmed, drawn under the marker) */}
            {existing.map((t) => {
                if (t.xPosition == null || t.yPosition == null) return null;
                const s = getTableSize(t.seats, t.shape);
                return (
                    <div
                        key={t.id}
                        className={cx(styles['picker-existing'], t.shape === 'RECTANGLE' && styles['picker-existing-rect'])}
                        style={{
                            left: `${pctX(t.xPosition)}%`,
                            top: `${pctY(t.yPosition)}%`,
                            width: s.width * scale,
                            height: s.height * scale,
                        }}
                    >
                        <TableVisual shape={t.shape} seats={t.seats} status="preview" />
                    </div>
                );
            })}

            {/* live marker reflecting shape + seats */}
            <div
                className={cx(styles['picker-marker'], shape === 'RECTANGLE' && styles['picker-marker-rect'])}
                style={{
                    left: `${pctX(x)}%`,
                    top: `${pctY(y)}%`,
                    width: markerSize.width * scale,
                    height: markerSize.height * scale,
                }}
            >
                <TableVisual shape={shape} seats={seats} status="preview" />
                <span style={{ position: 'relative', zIndex: 3, fontSize: 10, fontWeight: 700, color: '#3730a3' }}>{seats}</span>
            </div>

            <span className={styles['picker-coords']}>
                ({x}, {y})
            </span>
            <span className={styles['picker-hint']}>Click / drag to place</span>
        </div>
    );
};

export default PositionPicker;
