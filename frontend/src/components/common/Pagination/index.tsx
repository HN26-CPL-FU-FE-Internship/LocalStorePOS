import { useMemo, useState } from "react";
import type { PaginationProps } from "./props";
import styles from './Pagination.module.scss';
import { bindCx } from '@/utils';

const cx = bindCx(styles);

export default function Pagination({
    totalItems,
    currentPage,
    onPageChange,
    pageSize = 10,
}: PaginationProps) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    // Clamp current page to valid range so filters that reduce results don't show an out-of-range page
    const clampedPage = Math.min(currentPage, totalPages);

    const [input, setInput] = useState("");

    const pages = useMemo(() => {
        let start = Math.max(1, clampedPage - 2);
        let end = start + 4;

        if (end > totalPages) {
            end = totalPages;
            start = Math.max(1, end - 4);
        }

        return Array.from(
            { length: end - start + 1 },
            (_, i) => start + i
        );
    }, [clampedPage, totalPages]);

    const goTo = (page: number) => {
        page = Math.max(1, Math.min(page, totalPages));
        onPageChange(page);
    };

    const jump = () => {
        let page = Number(input);

        if (isNaN(page))
            return;

        if (page < 1)
            page = 1;

        if (page > totalPages)
            page = totalPages;

        goTo(page);

        setInput("");
    };

    // If only one page or no items, don't show pagination
    if (totalPages <= 1) return null;

    return (
        <div className={cx('pagination')}>

            <div className={cx('page-size')}>
                Records / page :
                <input value={pageSize} readOnly />
            </div>

            <div className={cx('nav-center')}>
                <button
                    className={cx('nav-btn')}
                    onClick={() => goTo(1)}
                    disabled={clampedPage === 1}
                >
                    {'<<'}
                </button>

                <button
                    className={cx('nav-btn')}
                    onClick={() => goTo(clampedPage - 1)}
                    disabled={clampedPage === 1}
                >
                    {'<'}
                </button>

                {pages.map(page => (
                    <button
                        key={page}
                        className={cx('nav-btn', page === clampedPage ? 'active' : '')}
                        onClick={() => goTo(page)}
                    >
                        {page}
                    </button>
                ))}

                <button
                    className={cx('nav-btn')}
                    onClick={() => goTo(clampedPage + 1)}
                    disabled={clampedPage === totalPages}
                >
                    {'>'}
                </button>

                <button
                    className={cx('nav-btn')}
                    onClick={() => goTo(totalPages)}
                    disabled={clampedPage === totalPages}
                >
                    {'>>'}
                </button>
            </div>

            <div className={cx('jump')}>
                <span>Go to</span>
                <input
                    value={input}
                    type="number"
                    min={1}
                    max={totalPages}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter")
                            jump();
                    }}
                />
                <button className={cx('go-btn')} onClick={jump}>
                    Go
                </button>
            </div>

        </div>
    );
}