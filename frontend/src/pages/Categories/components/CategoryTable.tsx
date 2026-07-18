import { Table } from "react-bootstrap";

import type { CategoryEntry } from "@/api/category.api";
import type { ColumnOption } from "../types";

import CategoryRow from "./CategoryRow";

interface CategoryTableProps {
    columns: ColumnOption[];
    loading: boolean;
    categories: CategoryEntry[];

    handleToggleStatus: (category: CategoryEntry) => void;

    openEdit: (category: CategoryEntry) => void;

    openDelete: (category: CategoryEntry) => void;
}

const CategoryTable = ({
    columns,
    loading,
    categories,
    handleToggleStatus,
    openEdit,
    openDelete,
}: CategoryTableProps) => {
    const visibleColumns = columns.filter((c) => c.visible);

    const showCategory = visibleColumns.some(
        (c) => c.key === "category"
    );

    const showItemCount = visibleColumns.some(
        (c) => c.key === "itemCount"
    );

    const showCreatedAt = visibleColumns.some(
        (c) => c.key === "createdAt"
    );

    const showStatus = visibleColumns.some(
        (c) => c.key === "status"
    );

    const showActions = visibleColumns.some(
        (c) => c.key === "actions"
    );

    return (
        <div className="table-responsive">
            <Table className="table text-nowrap">
                <thead>
                    <tr>
                        {visibleColumns.map((column) => (
                            <th key={column.key}>
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {loading && (
                        <tr>
                            <td
                                colSpan={visibleColumns.length}
                                className="text-center py-4"
                            >
                                Loading...
                            </td>
                        </tr>
                    )}

                    {!loading && categories.length === 0 && (
                        <tr>
                            <td
                                colSpan={visibleColumns.length}
                                className="text-center py-4 text-muted"
                            >
                                No categories found.
                            </td>
                        </tr>
                    )}

                    {!loading &&
                        categories.map((category) => (
                            <CategoryRow
                                key={category.id}
                                category={category}
                                showCategory={showCategory}
                                showItemCount={showItemCount}
                                showCreatedAt={showCreatedAt}
                                showStatus={showStatus}
                                showActions={showActions}
                                handleToggleStatus={handleToggleStatus}
                                openEdit={openEdit}
                                openDelete={openDelete}
                            />
                        ))}
                </tbody>
            </Table>
        </div>
    );
};

export default CategoryTable;