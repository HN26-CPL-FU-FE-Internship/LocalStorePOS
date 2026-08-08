import type { TableShape } from '@/api/table.api';

/** Fixed floor-map geometry (grid 1000 x 640). */
export const MAP_W = 1000;
export const MAP_H = 640;

/** Shared table-node sizing used by the full map and the position picker. */
export const getTableSize = (seats: number, shape: TableShape | null | undefined) => {
    if (shape === 'RECTANGLE') {
        return {
            width: Math.min(120, 46 + seats * 8),
            height: Math.min(64, 30 + Math.ceil(seats / 2) * 4),
        };
    }
    const d = Math.min(76, 52 + seats * 3);
    return { width: d, height: d };
};

export interface ZoneGeometry {
    left: number;
    top: number;
    width: number;
    height: number;
}

/**
 * Fixed zone rectangles for the single restaurant map.
 * Each zone is a fixed area of the floor plan — they are NOT editable in
 * the UI (no add/delete area), so every zone always stays visible.
 *  1 = Main Hall (trung tâm bên trái)
 *  2 = VIP Room (góc trên bên phải)
 *  3 = Rooftop (dải trên cùng)
 *  5 = Private Dining (góc dưới bên phải, trên khu bếp)
 */
export const ZONE_GEOMETRY: Record<number, ZoneGeometry> = {
    1: { left: 45, top: 175, width: 555, height: 360 }, // Main Hall
    2: { left: 680, top: 45, width: 275, height: 240 }, // VIP Room
    3: { left: 45, top: 45, width: 555, height: 110 }, // Rooftop
    5: { left: 680, top: 300, width: 275, height: 195 }, // Private Dining
};

export interface RectObstacle {
    left: number;
    top: number;
    width: number;
    height: number;
}

export interface Rect {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

/** Axis-aligned bounding box of a table node centred at (x, y). */
export const tableRect = (width: number, height: number, x: number, y: number): Rect => ({
    left: x - width / 2,
    right: x + width / 2,
    top: y - height / 2,
    bottom: y + height / 2,
});

export const overlaps = (a: Rect, b: Rect) =>
    a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

/** Bounding box of a decor obstacle in grid coordinates. */
export const obstacleRect = (o: RectObstacle): Rect => ({
    left: o.left,
    right: o.left + o.width,
    top: o.top,
    bottom: o.top + o.height,
});

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

interface PlacementInput {
    rawX: number;
    rawY: number;
    width: number;
    height: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    obstacles: Rect[];
    prevX: number;
    prevY: number;
}

/**
 * Resolve a placement so the table stays inside [minX,maxX]x[minY,maxY] and
 * never overlaps the given obstacles. If the raw target is blocked, the
 * table slides along the free axis instead of jumping onto the obstacle
 * (or stays put when fully blocked). Shared by the full map and the picker.
 */
export const resolvePlacement = ({
    rawX,
    rawY,
    width,
    height,
    minX,
    maxX,
    minY,
    maxY,
    obstacles,
    prevX,
    prevY,
}: PlacementInput): { x: number; y: number } => {
    const cx = clamp(rawX, minX, maxX);
    const cy = clamp(rawY, minY, maxY);
    const blocked = (px: number, py: number) => {
        const own = tableRect(width, height, px, py);
        return obstacles.some((o) => overlaps(own, o));
    };
    if (!blocked(cx, cy)) return { x: cx, y: cy };
    // Slide: keep the free axis, or stay put if both axes are blocked.
    if (!blocked(cx, prevY)) return { x: cx, y: prevY };
    if (!blocked(prevX, cy)) return { x: prevX, y: cy };
    return { x: prevX, y: prevY };
};

/**
 * Find the first free spot inside a zone for a new table, scanning a grid
 * so the result never overlaps the given obstacles. Falls back to the zone
 * centre when the zone is full.
 */
export const findFreeSpot = (
    zone: ZoneGeometry,
    width: number,
    height: number,
    obstacles: Rect[],
): { x: number; y: number } => {
    const minX = zone.left + width / 2;
    const maxX = zone.left + zone.width - width / 2;
    const minY = zone.top + height / 2;
    const maxY = zone.top + zone.height - height / 2;
    const stepX = Math.max(150, width + 40);
    const stepY = Math.max(130, height + 40);
    for (let y = minY; y <= maxY; y += stepY) {
        for (let x = minX; x <= maxX; x += stepX) {
            const own = tableRect(width, height, x, y);
            if (!obstacles.some((o) => overlaps(own, o))) return { x: Math.round(x), y: Math.round(y) };
        }
    }
    return { x: Math.round(zone.left + zone.width / 2), y: Math.round(zone.top + zone.height / 2) };
};

/**
 * Fixed decor rectangles (grid 1000 x 640) that tables must not overlap.
 * Mirrors the decorative elements in FloorMap.module.scss (bar / kitchen /
 * entrance) with a small safety margin on each side.
 */
export const DECOR_OBSTACLES: RectObstacle[] = [
    { left: 615, top: 158, width: 45, height: 320 }, // Quầy bar (x 626-654, y 165-470)
    { left: 655, top: 515, width: 310, height: 115 }, // Khu bếp (x 660-960, y 520-625)
    { left: 225, top: 598, width: 160, height: 40 }, // Lối vào (x 230-380, y 601-633)
];
