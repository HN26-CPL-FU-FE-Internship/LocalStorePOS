import type { PropsWithChildren, ReactNode } from 'react';
import Card from 'react-bootstrap/Card';
import Dropdown from 'react-bootstrap/Dropdown';
import Button from 'react-bootstrap/Button';
import Icon from '../Icon';

export interface SectionCardAction {
    /** Simple link/button action, e.g. "View All" */
    label: string;
    href?: string;
    onClick?: () => void;
}

export interface SectionCardFilterOption {
    label: string;
    onSelect?: () => void;
}

export interface SectionCardProps extends PropsWithChildren {
    icon: string;
    title: string;
    /** Renders a single btn (e.g. "View All" / "Add New") */
    action?: SectionCardAction;
    /** Renders a dropdown filter (e.g. Weekly / Monthly / Yearly) */
    filterOptions?: SectionCardFilterOption[];
    activeFilterLabel?: string;
    bodyClassName?: string;
    footer?: ReactNode;
}

/**
 * Equivalent of the repeated markup:
 * <div class="card"><div class="card-body">
 *   <div class="... border-bottom ..."> icon + h5 + (dropdown | button) </div>
 *   {children}
 * </div></div>
 */
const SectionCard = ({
    icon,
    title,
    action,
    filterOptions,
    activeFilterLabel,
    bodyClassName = '',
    footer,
    children,
}: SectionCardProps) => {
    return (
        <Card className="flex-fill w-100">
            <Card.Body className={bodyClassName}>
                <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom flex-wrap gap-2">
                    <div className="d-flex align-items-center">
                        <div className="avatar avatar-xs shadow border text-dark fs-14 me-2">
                            <Icon name={icon} />
                        </div>
                        <h5 className="mb-0">{title}</h5>
                    </div>

                    {filterOptions && filterOptions.length > 0 && (
                        <Dropdown>
                            <Dropdown.Toggle
                                as={Button}
                                variant="white"
                                size="sm"
                                className="d-inline-flex align-items-center"
                            >
                                {activeFilterLabel ?? filterOptions[0].label}
                            </Dropdown.Toggle>
                            <Dropdown.Menu align="end" className="p-3">
                                {filterOptions.map((option) => (
                                    <Dropdown.Item key={option.label} onClick={option.onSelect}>
                                        {option.label}
                                    </Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        </Dropdown>
                    )}

                    {action && (
                        <Button variant="white" size="sm" href={action.href} onClick={action.onClick}>
                            {action.label}
                        </Button>
                    )}
                </div>

                {children}
            </Card.Body>
            {footer}
        </Card>
    );
};

export default SectionCard;
