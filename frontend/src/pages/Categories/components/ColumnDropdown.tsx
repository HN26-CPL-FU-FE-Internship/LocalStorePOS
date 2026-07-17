import { Button, Dropdown, Form } from "react-bootstrap";
import Icon from "@/components/common/Icon";

import type { ColumnOption } from "../types";

interface ColumnDropdownProps {
    columns: ColumnOption[];
    toggleColumn: (key: string) => void;
}

const ColumnDropdown = ({
    columns,
    toggleColumn,
}: ColumnDropdownProps) => {
    return (
        <Dropdown autoClose="outside">
            <Dropdown.Toggle
                as={Button}
                variant="white"
                className="btn-icon"
            >
                <Icon name="columns-3" />
            </Dropdown.Toggle>

            <Dropdown.Menu className="dropdown-menu-md dropdown-menu-end p-3 pb-0">
                <h5 className="mb-3">
                    Column
                </h5>

                {columns.map((col) => (
                    <div
                        className="mb-3 drag-item"
                        key={col.key}
                    >
                        <label className="d-flex align-items-center">

                            <Icon
                                name="grip-vertical"
                                className="me-2"
                            />

                            <Form.Check
                                type="checkbox"
                                checked={col.visible}
                                onChange={() =>
                                    toggleColumn(col.key)
                                }
                                label={col.label}
                            />
                        </label>
                    </div>
                ))}
            </Dropdown.Menu>
        </Dropdown>
    );
};

export default ColumnDropdown;