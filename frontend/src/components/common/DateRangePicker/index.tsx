import Icon from '../Icon';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import styles from './DateRangePicker.module.scss';
import { bindCx } from '@/utils';
import { format } from 'date-fns';
import { Button } from 'react-bootstrap';

const cx = bindCx(styles);

const presets: Record<string, () => [Date, Date]> = {
    'Last 30 Days': () => {
        const now = new Date();
        const start = new Date(now);
        start.setDate(start.getDate() - 30);
        return [start, now];
    },
    'Last 7 Days': () => {
        const now = new Date();
        const start = new Date(now);
        start.setDate(start.getDate() - 7);
        return [start, now];
    },
    'Last Month': () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0);
        return [start, end];
    },
    'This Month': () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const start = new Date(year, month, 1);
        return [start, now];
    },
    Today: () => {
        const now = new Date();
        return [now, now];
    },
    Yesterday: () => {
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return [yesterday, yesterday];
    },
};

const presetKeys = Object.keys(presets);

function getInitialRange(): [Date, Date] {
    return presets['This Month']();
}

function DateRangePicker({ className, onDateRangeChange }: { className?: string; onDateRangeChange?: (from: Date, to: Date) => void }) {
    const [month, setMonth] = useState(new Date());
    const [selected, setSelected] = useState<Date[]>(() => getInitialRange());
    const [showDateRange, setShowDateRange] = useState(false);
    const [activeRangeKey, setActiveRangeKey] = useState('This Month');

    // Stores the last committed/applied range so Cancel can restore it
    const committedRef = useRef<{ selected: Date[]; rangeKey: string }>({ selected: getInitialRange(), rangeKey: 'This Month' });

    // Ref for the entire picker container to detect outside clicks
    const containerRef = useRef<HTMLDivElement>(null);

    const showCustomRange = activeRangeKey === 'Custom Range';

    const formattedDays = selected.map((day) => format(day, 'dd MMM yyyy')).join(' - ');

    const handlePresetClick = useCallback((rangeKey: string) => {
        const getRange = presets[rangeKey];
        if (!getRange) return;
        const [start, end] = getRange();
        setSelected([start, end]);
        setActiveRangeKey(rangeKey);
        committedRef.current = { selected: [start, end], rangeKey };
        onDateRangeChange?.(start, end);
        setShowDateRange(false);
    }, [onDateRangeChange]);

    const handleCustomRangeClick = useCallback(() => {
        // Snapshot the current preset state before entering custom range mode
        committedRef.current = { selected: [...selected], rangeKey: activeRangeKey };
        setActiveRangeKey('Custom Range');
    }, [selected, activeRangeKey]);

    const handleApply = useCallback(() => {
        const range = [...selected];
        if (range.length < 2) return;
        committedRef.current = { selected: range, rangeKey: 'Custom Range' };
        onDateRangeChange?.(range[0], range[1]);
        setShowDateRange(false);
    }, [selected, onDateRangeChange]);

    const handleCancel = useCallback(() => {
        // Restore the last committed preset range
        setSelected(committedRef.current.selected);
        setActiveRangeKey(committedRef.current.rangeKey);
        setShowDateRange(false);
    }, []);

    // Close dropdown on click outside
    useEffect(() => {
        if (!showDateRange) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setSelected(committedRef.current.selected);
                setActiveRangeKey(committedRef.current.rangeKey);
                setShowDateRange(false);
            }
        };

        // Use mousedown for faster response; add a small delay to avoid conflicting
        // with the trigger's own click handler that just opened it
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDateRange]);

    return (
        <div ref={containerRef} className={cx('date-range-picker-wrapper')}>
            <div
                className={cx(
                    `daterangepick custom-date form-control w-auto d-flex align-items-center justify-content-between`,
                )}
                onClick={() => setShowDateRange((prev) => !prev)}
            >
                <Icon name="calendar-fold" className="text-dark fs-14 me-2" />
                <span className="reportrange-picker">{formattedDays}</span>
            </div>

            <div
                className={cx(
                    `daterangepicker ltr show-ranges opensright show-calendar ${className ?? ''} ${showDateRange ? 'open' : ''}`,
                )}
            >
                <div className={cx(`daterangepicker-container`)}>
                    <div className={cx(`ranges`)}>
                        <ul>
                            {presetKeys.map((key) => (
                                <li
                                    key={key}
                                    data-range-key={key}
                                    className={cx(activeRangeKey === key ? 'active' : '')}
                                    onClick={() => handlePresetClick(key)}
                                >
                                    {key}
                                </li>
                            ))}
                            <li
                                data-range-key="Custom Range"
                                className={cx(activeRangeKey === 'Custom Range' ? 'active' : '')}
                                onClick={handleCustomRangeClick}
                            >
                                Custom Range
                            </li>
                        </ul>
                    </div>
                    <DayPicker
                        className={cx(`day-picker d-${showCustomRange ? '' : 'none'}`)}
                        classNames={{
                            months: cx(`custom-months`),
                            month: cx(`custom-month`),
                            month_caption: cx(`rdp-month_caption custom-month-caption`),
                            weekday: cx(`rdp-weekday custom-weekday`),
                            week: cx(`rdp-weeks custom-week`),
                            selected: cx(`rdp-selected custom-selected`),
                        }}
                        max={2}
                        min={2}
                        mode="multiple"
                        month={month}
                        onMonthChange={setMonth}
                        selected={selected}
                        onSelect={setSelected}
                        numberOfMonths={2}
                        pagedNavigation
                        navLayout="around"
                        required
                    />
                </div>
                <div className={cx(`drp-buttons d-${showCustomRange ? '' : 'none'}`)}>
                    <span className={cx('drp-selected')}>{formattedDays}</span>
                    <Button
                        variant="default"
                        className={cx('cancelBtn btn btn-sm btn-default')}
                        type="button"
                        onClick={handleCancel}
                    >
                        Cancel
                    </Button>
                    <Button className={cx('applyBtn btn btn-sm btn-primary')} type="button" onClick={handleApply}>
                        Apply
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default DateRangePicker;
