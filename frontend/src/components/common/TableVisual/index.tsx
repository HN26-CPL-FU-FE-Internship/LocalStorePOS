import type { TableShape, TableStatus } from '@/api/table.api';

interface TableVisualProps {
    shape: TableShape | null | undefined;
    seats: number | null | undefined;
    status: TableStatus | 'preview';
    /** Optional override of SVG width/height. Defaults to 100% fill. */
    width?: number;
    height?: number;
}

/**
 * Renders a vector SVG table with chairs.
 * - ROUND: circular table top + radial stools (6 / 8 / 10 seats)
 * - RECTANGLE: rectangular table top + bench chairs on top & bottom (4 / 6 / 8 seats)
 * Colors adapt to the table status.
 */
const TableVisual = ({ shape, seats, status, width, height }: TableVisualProps) => {
    const tableShape: TableShape = shape || 'ROUND';
    const numSeats = seats || (tableShape === 'ROUND' ? 6 : 4);

    /* ---- color palette ---- */
    let chairFill = '#10B981';
    let tableFill = '#D1FAE5';
    let tableBorder = '#10B981';
    let darkColor = '#047857';

    if (status === 'booked') {
        chairFill = '#F59E0B';
        tableFill = '#FEF3C7';
        tableBorder = '#F59E0B';
        darkColor = '#B45309';
    } else if (status === 'occupied') {
        chairFill = '#EF4444';
        tableFill = '#FEE2E2';
        tableBorder = '#EF4444';
        darkColor = '#B91C1C';
    } else if (status === 'preview') {
        chairFill = '#6366F1';
        tableFill = '#E0E7FF';
        tableBorder = '#6366F1';
        darkColor = '#4338CA';
    }

    /* ========== RECTANGLE TABLE ========== */
    if (tableShape === 'RECTANGLE') {
        const chairs: React.ReactNode[] = [];

        if (numSeats <= 4) {
            // 2 top + 2 bottom
            chairs.push(
                <rect key="t1" x="28"  y="4"  width="18" height="11" rx="3" fill={chairFill} stroke={darkColor} strokeWidth="0.8" />,
                <rect key="t2" x="74"  y="4"  width="18" height="11" rx="3" fill={chairFill} stroke={darkColor} strokeWidth="0.8" />,
                <rect key="b1" x="28"  y="65" width="18" height="11" rx="3" fill={chairFill} stroke={darkColor} strokeWidth="0.8" />,
                <rect key="b2" x="74"  y="65" width="18" height="11" rx="3" fill={chairFill} stroke={darkColor} strokeWidth="0.8" />,
            );
        } else if (numSeats <= 6) {
            // 3 top + 3 bottom
            chairs.push(
                <rect key="t1" x="20" y="4" width="16" height="11" rx="3" fill={chairFill} stroke={darkColor} strokeWidth="0.8" />,
                <rect key="t2" x="52" y="4" width="16" height="11" rx="3" fill={chairFill} stroke={darkColor} strokeWidth="0.8" />,
                <rect key="t3" x="84" y="4" width="16" height="11" rx="3" fill={chairFill} stroke={darkColor} strokeWidth="0.8" />,
                <rect key="b1" x="20" y="65" width="16" height="11" rx="3" fill={chairFill} stroke={darkColor} strokeWidth="0.8" />,
                <rect key="b2" x="52" y="65" width="16" height="11" rx="3" fill={chairFill} stroke={darkColor} strokeWidth="0.8" />,
                <rect key="b3" x="84" y="65" width="16" height="11" rx="3" fill={chairFill} stroke={darkColor} strokeWidth="0.8" />,
            );
        } else {
            // 4 top + 4 bottom (8 seats)
            chairs.push(
                <rect key="t1" x="14" y="4" width="14" height="11" rx="3" fill={chairFill} stroke={darkColor} strokeWidth="0.8" />,
                <rect key="t2" x="36" y="4" width="14" height="11" rx="3" fill={chairFill} stroke={darkColor} strokeWidth="0.8" />,
                <rect key="t3" x="58" y="4" width="14" height="11" rx="3" fill={chairFill} stroke={darkColor} strokeWidth="0.8" />,
                <rect key="t4" x="80" y="4" width="14" height="11" rx="3" fill={chairFill} stroke={darkColor} strokeWidth="0.8" />,
                <rect key="b1" x="14" y="65" width="14" height="11" rx="3" fill={chairFill} stroke={darkColor} strokeWidth="0.8" />,
                <rect key="b2" x="36" y="65" width="14" height="11" rx="3" fill={chairFill} stroke={darkColor} strokeWidth="0.8" />,
                <rect key="b3" x="58" y="65" width="14" height="11" rx="3" fill={chairFill} stroke={darkColor} strokeWidth="0.8" />,
                <rect key="b4" x="80" y="65" width="14" height="11" rx="3" fill={chairFill} stroke={darkColor} strokeWidth="0.8" />,
            );
        }

        return (
            <svg
                viewBox="0 0 120 80"
                width={width ?? '100%'}
                height={height ?? '100%'}
                overflow="visible"
            >
                {chairs}
                {/* Table top */}
                <rect x="10" y="16" width="100" height="48" rx="9"
                    fill={tableFill} stroke={tableBorder} strokeWidth="2.5"
                />
                {/* Inner decorative dashed border */}
                <rect x="15" y="21" width="90" height="38" rx="6"
                    fill="none" stroke={tableBorder} strokeWidth="1"
                    strokeDasharray="4 3" opacity="0.45"
                />
            </svg>
        );
    }

    /* ========== ROUND TABLE ========== */
    const cx = 50;
    const cy = 50;
    const tableR = 26;
    const chairR = 7;
    const chairDist = 37;
    const chairs: React.ReactNode[] = [];

    for (let i = 0; i < numSeats; i++) {
        const angle = (i * (2 * Math.PI)) / numSeats - Math.PI / 2;
        const x = cx + chairDist * Math.cos(angle);
        const y = cy + chairDist * Math.sin(angle);
        chairs.push(
            <circle key={i} cx={x} cy={y} r={chairR}
                fill={chairFill} stroke={darkColor} strokeWidth="0.8"
            />
        );
    }

    return (
        <svg
            viewBox="0 0 100 100"
            width={width ?? '100%'}
            height={height ?? '100%'}
            overflow="visible"
        >
            {chairs}
            {/* Table top */}
            <circle cx={cx} cy={cy} r={tableR}
                fill={tableFill} stroke={tableBorder} strokeWidth="2.5"
            />
            {/* Inner decorative dashed border */}
            <circle cx={cx} cy={cy} r={tableR - 4}
                fill="none" stroke={tableBorder} strokeWidth="1"
                strokeDasharray="4 3" opacity="0.45"
            />
        </svg>
    );
};

export default TableVisual;
