export interface PaginationProps {
    totalItems: number;
    currentPage: number;
    onPageChange: (page: number) => void;
    pageSize?: number;
}