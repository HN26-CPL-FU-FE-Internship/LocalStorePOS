import { Button, Dropdown } from "react-bootstrap";

import type { SortOption } from "../types";

interface SortDropdownProps {
    sortOption: SortOption;
    setSortOption: React.Dispatch<React.SetStateAction<SortOption>>;
    setPage: React.Dispatch<React.SetStateAction<number>>;
    sortLabels: Record<SortOption, string>;
}

const SortDropdown = ({
    sortOption,
    setSortOption,
    setPage,
    sortLabels,
}: SortDropdownProps) => {
    return (
        <Dropdown>
            <Dropdown.Toggle
                as={Button}
                variant="white"
                className="d-inline-flex align-items-center"
            >
                Sort by : {sortLabels[sortOption]}
            </Dropdown.Toggle>

            <Dropdown.Menu
                align="end"
                className="p-3"
            >
                {(Object.keys(sortLabels) as SortOption[]).map((opt) => (
                    <Dropdown.Item
                        key={opt}
                        active={opt === sortOption}
                        onClick={() => {
                            setSortOption(opt);
                            setPage(1);
                        }}
                    >
                        {sortLabels[opt]}
                    </Dropdown.Item>
                ))}
            </Dropdown.Menu>
        </Dropdown>
    );
};

export default SortDropdown;