import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import type { PaginationProps } from "./props";
import '@/components/common/Pagination/style.css'
export default function Pagination({
    totalItems,
    pageSize = 10,
}: PaginationProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    const match = location.pathname.match(/\/pages\/(\d+)/);

    const currentPage = match ? Number(match[1]) : 1;

    const [input, setInput] = useState("");

    const pages = useMemo(() => {
        let start = Math.max(1, currentPage - 2);
        let end = start + 4;

        if (end > totalPages) {
            end = totalPages;
            start = Math.max(1, end - 4);
        }

        return Array.from(
            { length: end - start + 1 },
            (_, i) => start + i
        );
    }, [currentPage, totalPages]);

    const goTo = (page: number) => {
        page = Math.max(1, Math.min(page, totalPages));

        if (page === 1)
            navigate(location.pathname);
        else
            navigate(`/pages/${page}`);
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

    return (
        <div className="pagination">

            <div className="page-size">
                Records / page :
                <input value={pageSize} readOnly />
            </div>

            <button
                onClick={() => goTo(1)}
                disabled={currentPage === 1}
            >
                {"<<"}
            </button>

            <button
                onClick={() => goTo(currentPage - 1)}
                disabled={currentPage === 1}
            >
                {"<"}
            </button>

            {pages.map(page => (
                <button
                    key={page}
                    disabled={page === currentPage}
                    className={page === currentPage ? "active" : ""}
                    onClick={() => goTo(page)}
                >
                    {page}
                </button>
            ))}

            <button
                onClick={() => goTo(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                {">"}
            </button>

            <button
                onClick={() => goTo(totalPages)}
                disabled={currentPage === totalPages}
            >
                {">>"}
            </button>

            <div className="jump">

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

                <button onClick={jump}>
                    Go
                </button>

            </div>

        </div>
    );
}