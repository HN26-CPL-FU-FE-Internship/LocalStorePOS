import type { CategoryStatus } from "@/api/category.api";

export interface ColumnOption {
    key: string;
    label: string;
    visible: boolean;
}

export const defaultColumns: ColumnOption[] = [
    { key: 'category', label: 'Category', visible: true },
    { key: 'itemCount', label: 'No of Items', visible: true },
    { key: 'createdAt', label: 'Created On', visible: true },
    { key: 'status', label: 'Status', visible: true },
    { key: 'actions', label: 'Actions', visible: true },
];

export type SortOption = 'newest' | 'oldest' | 'asc' | 'desc';

export const sortLabels: Record<SortOption, string> = {
    newest: 'Newest',
    oldest: 'Oldest',
    asc: 'Ascending',
    desc: 'Descending',
}

export interface CategoryForm{
    name: string;
    status: CategoryStatus
}

export const emptyForm: CategoryForm= {
    name: '',
    status: 'active'
}