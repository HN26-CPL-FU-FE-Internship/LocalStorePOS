import { describe, it, expect } from 'vitest';
import {
    DECOR_OBSTACLES,
    findFreeSpot,
    getTableSize,
    MAP_H,
    MAP_W,
    obstacleRect,
    overlaps,
    resolvePlacement,
    tableRect,
    ZONE_GEOMETRY,
} from './floorMapConstants';

describe('floorMapConstants — getTableSize', () => {
    it('returns a square size for round tables, scaling with seats', () => {
        const small = getTableSize(4, 'ROUND');
        const big = getTableSize(12, 'ROUND');
        expect(small.width).toBe(small.height);
        expect(big.width).toBe(big.height);
        expect(big.width).toBeGreaterThan(small.width);
    });

    it('caps round tables at 76px', () => {
        const size = getTableSize(99, 'ROUND');
        expect(size.width).toBe(76);
        expect(size.height).toBe(76);
    });

    it('returns a wide rectangle for RECTANGLE shape', () => {
        const size = getTableSize(6, 'RECTANGLE');
        expect(size.width).toBeGreaterThan(size.height);
    });

    it('caps rectangle width at 120px', () => {
        const size = getTableSize(50, 'RECTANGLE');
        expect(size.width).toBe(120);
    });

    it('treats null/undefined shape as round', () => {
        const a = getTableSize(6, null);
        const b = getTableSize(6, undefined);
        const c = getTableSize(6, 'ROUND');
        expect(a).toEqual(c);
        expect(b).toEqual(c);
    });
});

describe('floorMapConstants — overlaps / tableRect / obstacleRect', () => {
    it('detects intersecting rects', () => {
        const a = { left: 0, right: 100, top: 0, bottom: 100 };
        const b = { left: 50, right: 150, top: 50, bottom: 150 };
        expect(overlaps(a, b)).toBe(true);
    });

    it('treats touching edges as non-overlapping', () => {
        const a = { left: 0, right: 100, top: 0, bottom: 100 };
        const b = { left: 100, right: 200, top: 0, bottom: 100 };
        expect(overlaps(a, b)).toBe(false);
    });

    it('builds a centred bbox for a table node', () => {
        const r = tableRect(40, 30, 100, 50);
        expect(r).toEqual({ left: 80, right: 120, top: 35, bottom: 65 });
    });

    it('builds a bbox from a decor obstacle origin+size', () => {
        const r = obstacleRect({ left: 615, top: 158, width: 45, height: 320 });
        expect(r).toEqual({ left: 615, right: 660, top: 158, bottom: 478 });
    });

    it('exposes a fixed decor obstacle set that does not self-overlap', () => {
        const rects = DECOR_OBSTACLES.map(obstacleRect);
        for (let i = 0; i < rects.length; i++) {
            for (let j = i + 1; j < rects.length; j++) {
                expect(overlaps(rects[i], rects[j])).toBe(false);
            }
        }
    });
});

describe('floorMapConstants — resolvePlacement', () => {
    const base = {
        width: 40,
        height: 30,
        minX: 0,
        maxX: MAP_W,
        minY: 0,
        maxY: MAP_H,
        obstacles: [] as ReturnType<typeof tableRect>[],
        prevX: 300,
        prevY: 350,
    };

    it('returns the raw target when nothing blocks it', () => {
        expect(resolvePlacement({ ...base, rawX: 200, rawY: 250 })).toEqual({ x: 200, y: 250 });
    });

    it('clamps to the allowed bounds', () => {
        expect(resolvePlacement({ ...base, rawX: -50, rawY: MAP_H + 50 })).toEqual({ x: 0, y: MAP_H });
    });

    it('slides along the free axis when the target overlaps an obstacle', () => {
        const obstacle = tableRect(100, 100, 200, 250); // blocks (200, 250)
        const result = resolvePlacement({ ...base, rawX: 200, rawY: 250, obstacles: [obstacle] });
        // (200, prevY=350) and (prevX=300, 250) must be free.
        expect(result).toEqual({ x: 200, y: 350 });
    });

    it('stays put when both slide candidates are blocked', () => {
        // A single wide obstacle that covers (200, 250), (200, 350) AND
        // (300, 250) — every candidate axis is blocked, so it stays put.
        const obstacle = tableRect(400, 400, 250, 300);
        const result = resolvePlacement({ ...base, rawX: 200, rawY: 250, obstacles: [obstacle] });
        expect(result).toEqual({ x: 300, y: 350 });
    });
});

describe('floorMapConstants — findFreeSpot', () => {
    it('finds a spot inside the zone bounds', () => {
        const zone = ZONE_GEOMETRY[1];
        const spot = findFreeSpot(zone, 50, 50, []);
        expect(spot.x).toBeGreaterThanOrEqual(zone.left);
        expect(spot.x).toBeLessThanOrEqual(zone.left + zone.width);
        expect(spot.y).toBeGreaterThanOrEqual(zone.top);
        expect(spot.y).toBeLessThanOrEqual(zone.top + zone.height);
    });

    it('avoids the given obstacles', () => {
        const zone = ZONE_GEOMETRY[1];
        const obstacles = [obstacleRect(DECOR_OBSTACLES[0])];
        const spot = findFreeSpot(zone, 40, 30, obstacles);
        expect(overlaps(tableRect(40, 30, spot.x, spot.y), obstacles[0])).toBe(false);
    });

    it('falls back to the zone centre when the whole zone is one obstacle', () => {
        const zone = ZONE_GEOMETRY[1];
        const obstacles = [tableRect(zone.width + 10, zone.height + 10, zone.left + zone.width / 2, zone.top + zone.height / 2)];
        const spot = findFreeSpot(zone, 40, 30, obstacles);
        expect(spot).toEqual({
            x: Math.round(zone.left + zone.width / 2),
            y: Math.round(zone.top + zone.height / 2),
        });
    });
});
