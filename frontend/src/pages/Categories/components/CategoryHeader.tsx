import { Button, Dropdown } from "react-bootstrap";
import Icon from "@/components/common/Icon";

interface CategoryHeaderProps {
    onRefresh: () => void;
    onAdd: () => void;
}

const CategoryHeader = ({
    onRefresh,
    onAdd,
}: CategoryHeaderProps) => {
    return (
        <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-3 mb-4">
            <div className="flex-grow-1">
                <h3 className="mb-0">
                    Categories

                    <Button
                        variant="white"
                        size="sm"
                        className="btn-icon rounded-circle ms-2"
                        aria-label="refresh"
                        onClick={onRefresh}
                    >
                        <Icon name="refresh-ccw" />
                    </Button>
                </h3>
            </div>

            <div className="gap-2 d-flex align-items-center flex-wrap">
                <Dropdown>
                    <Dropdown.Toggle
                        as={Button}
                        variant="white"
                        className="d-inline-flex align-items-center"
                    >
                        <Icon name="upload" className="me-1" />
                        Export
                    </Dropdown.Toggle>

                    <Dropdown.Menu align="end" className="p-3">
                        <Dropdown.Item href="#">
                            Export as PDF
                        </Dropdown.Item>

                        <Dropdown.Item href="#">
                            Export as Excel
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>

                <Button
                    variant="primary"
                    className="d-inline-flex align-items-center"
                    onClick={onAdd}
                >
                    <Icon name="circle-plus" className="me-1" />
                    Add New
                </Button>
            </div>
        </div>
    );
};

export default CategoryHeader;