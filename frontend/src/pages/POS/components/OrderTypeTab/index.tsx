import Icon from '@/components/common/Icon';
import { ORDER_TYPES } from '@/constants';
import { useCustomers, useTables, useWaiters } from '@/hooks';
import usePOSCreateOrder from '@/stores/pos.store';
import { useMemo } from 'react';
import { Button, Col, Nav, NavItem, NavLink, Row, Tab } from 'react-bootstrap';
import Select from 'react-select';
import { useShallow } from 'zustand/react/shallow';

const OrderTypeTab = ({
    setShowAddCustomer,
}: {
    setShowAddCustomer: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
    const { data: tables = [] } = useTables();
    const { data: waiters = [] } = useWaiters();
    const { data: customers = [] } = useCustomers();

    const tableOptions = useMemo(() => tables.map((t) => ({ value: String(t.id), label: t.name })), [tables]);
    const waiterOptions = useMemo(() => waiters.map((w) => ({ value: String(w.id), label: w.name })), [waiters]);
    const customerOptions = useMemo(() => customers.map((c) => ({ value: String(c.id), label: c.name })), [customers]);

    const { orderActiveType, setOrderActiveType, customer, setCustomer, setTable, table } = usePOSCreateOrder(
        useShallow((s) => ({
            orderActiveType: s.orderActiveType,
            setOrderActiveType: s.setOrderActiveType,
            customer: s.customer,
            setCustomer: s.setCustomer,
            table: s.table,
            setTable: s.setTable,
        })),
    );
    return (
        <div className="item border-bottom">
            <Tab.Container activeKey={orderActiveType} onSelect={(key) => key && setOrderActiveType(key)}>
                <Nav
                    variant="tabs"
                    fill
                    className="nav-tabs nav-tabs-solid border-0 mb-3 align-items-center justify-content-between flex-wrap gap-1 pos-tab"
                >
                    {ORDER_TYPES.map((item) => (
                        <NavItem key={item.key} className="flex-fill">
                            <NavLink eventKey={item.key} className="justify-content-center shadow-sm">
                                <Icon name={item.icon} />
                                {item.label}
                            </NavLink>
                        </NavItem>
                    ))}
                </Nav>

                <Tab.Content>
                    <Tab.Pane eventKey={'dine_in'}>
                        <Row className="g-2">
                            <Col lg={4}>
                                <div className="common-select w-100">
                                    <Select
                                        className="select"
                                        options={tableOptions.length > 0 ? tableOptions : undefined}
                                        placeholder="Select Table"
                                        value={table}
                                        onChange={(opt) => setTable(opt)}
                                        isSearchable={true}
                                        noOptionsMessage={() => 'No tables available'}
                                    />
                                </div>
                            </Col>
                            <Col lg={4}>
                                <div className="common-select w-100">
                                    <Select className="select" options={waiterOptions} placeholder="Waiter" />
                                </div>
                            </Col>
                            <Col lg={4}>
                                <div className="input-item d-flex align-items-center gap-2">
                                    <div className="common-select w-100">
                                        <Select
                                            placeholder="Customer..."
                                            options={customerOptions.length > 0 ? customerOptions : undefined}
                                            isSearchable={true}
                                            noOptionsMessage={() => 'No customers found'}
                                            value={customer}
                                            onChange={(opt) => setCustomer(opt)}
                                        />
                                    </div>
                                    <Button className="btn-icon" onClick={() => setShowAddCustomer(true)}>
                                        <Icon name="plus" />
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </Tab.Pane>
                    <Tab.Pane eventKey={'take_away'}>
                        <Row className="g-2">
                            <Col lg={11}>
                                <div className="input-item d-flex align-items-center gap-2">
                                    <div className="common-select w-100">
                                        <Select
                                            placeholder="Search or select customer..."
                                            options={customerOptions.length > 0 ? customerOptions : undefined}
                                            isSearchable={true}
                                            noOptionsMessage={() => 'No customers found'}
                                            value={customer}
                                            onChange={(opt) => setCustomer(opt)}
                                        />
                                    </div>
                                    <Button className="btn-icon" onClick={() => setShowAddCustomer(true)}>
                                        <Icon name="plus" />
                                    </Button>
                                </div>
                            </Col>
                            <Col lg={1}>
                                <div className="d-flex align-items-center justify-content-end">
                                    <Button
                                        className="border-0 btn btn-icon bg-transparent fs-16 text-dark"
                                        data-bs-toggle="modal"
                                    >
                                        <Icon name="pencil-line" />
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </Tab.Pane>
                    <Tab.Pane eventKey={'delivery'}>
                        <Row className="g-2">
                            <Col lg={11}>
                                <div className="input-item d-flex align-items-center gap-2">
                                    <div className="common-select w-100">
                                        <Select
                                            placeholder="Search or select customer..."
                                            options={customerOptions.length > 0 ? customerOptions : undefined}
                                            isSearchable={true}
                                            noOptionsMessage={() => 'No customers found'}
                                            value={customer}
                                            onChange={(opt) => setCustomer(opt)}
                                        />
                                    </div>
                                    <Button className="btn-icon" onClick={() => setShowAddCustomer(true)}>
                                        <Icon name="plus" />
                                    </Button>
                                </div>
                            </Col>
                            <Col lg={1}>
                                <div className="d-flex align-items-center justify-content-end">
                                    <Button
                                        className="border-0 btn btn-icon bg-transparent fs-16 text-dark"
                                        data-bs-toggle="modal"
                                    >
                                        <Icon name="pencil-line" />
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </Tab.Pane>
                </Tab.Content>
            </Tab.Container>
        </div>
    );
};

export default OrderTypeTab;
