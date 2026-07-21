import { Badge, Button } from "react-bootstrap";
import Icon from "@/components/common/Icon";
import ColumnDropdown from "./ColumnDropdown";
import SortDropdown from "./SortDropdown";

import type {
    ColumnOption,
    SortOption,
} from "../types";

import type { CategoryStatus } from "@/api/category.api";

interface CategoryToolbarProps {
    searchInput: string;
    setSearchInput: React.Dispatch<React.SetStateAction<string>>;

    statusFilter: CategoryStatus | "";
    openFilter: () => void;

    columns: ColumnOption[];
    toggleColumn: (key: string) => void;

    sortOption: SortOption;
    setSortOption: React.Dispatch<React.SetStateAction<SortOption>>;

    setPage: React.Dispatch<React.SetStateAction<number>>;

    sortLabels: Record<SortOption, string>;
}

const CategoryToolbar = ({
    searchInput,
    setSearchInput,
    statusFilter,
    openFilter,
    columns,
    toggleColumn,
    sortOption,
    setSortOption,
    setPage,
    sortLabels,
}: CategoryToolbarProps) => {
    return(
        <div className="d-flex align-items-center flex-wrap gap-3 justify-content-between mb-4">
                        <div className="search-input">
                            <div className="datatable-search position-relative">
                                <input
                                    className="form-control form-control-sm"
                                    placeholder="Search category"
                                    type="text"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                />
                                <Icon
                                    name="search"
                                    className="position-absolute top-50 end-0 translate-middle-y me-3 text-secondary"
                                />
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            {/* Filter */}
                            <Button
                                variant="white"
                                className="d-inline-flex align-items-center"
                                onClick={openFilter}
                            >
                                <Icon name="funnel" className="me-2" />
                                Filter
                                {statusFilter && <Badge bg="primary" className="ms-2">1</Badge>}
                            </Button>

                            {/* Columns */}
                            <ColumnDropdown
                                columns={columns}
                                toggleColumn={toggleColumn}
                            />

                            {/* Sort */}
                            <SortDropdown
                                sortOption={sortOption}
                                setSortOption={setSortOption}
                                setPage={setPage}
                                sortLabels={sortLabels}
                            />
                        </div>
                    </div>
    )}

    export default CategoryToolbar