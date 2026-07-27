import Icon from '@/components/common/Icon';
import { Dropdown, DropdownButton } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import type { ModalActionProps, OrderStatus, OrderSummary } from '@/types';
import { statuses } from '@/constants';

type OrderActionDropdownProps = ModalActionProps & {
    cx: (value: string) => string;
    onUpdateStatus: (status: OrderStatus) => void;
    onOpenModal: (value: boolean) => void;
};

function OrderActionDropdown({ actions, order }: { actions: OrderActionDropdownProps; order: OrderSummary }) {
    const handleCancel = () => {
        actions.onUpdateStatus(statuses[4]);
    };

    const handlePay = () => {
        // mở modal thanh toán
        actions.onOpenModal(true);
        actions.onPay(order);
    };

    const handlePrint = () => {
        // in hóa đơn
        actions.onPrint();
    };

    const orderActions = [
        {
            key: 'edit',
            icon: 'pencil-line',
            label: 'Edit Order',
            to: `/pos?edit=${order.orderNumber}`,
        },
        {
            key: 'cancel',
            icon: 'x',
            label: 'Cancel',
            onClick: handleCancel,
        },
        {
            key: 'pay',
            icon: 'pointer',
            label: 'Pay & Complete',
            onClick: handlePay,
        },
        {
            key: 'print',
            icon: 'printer',
            label: 'Print Receipt',
            onClick: handlePrint,
        },
    ];

    return (
        <DropdownButton title as={'div'} drop={'start'} variant="" className={actions.cx('dropstart')}>
            {orderActions.map((action) =>
                action.to ? (
                    <Dropdown.Item
                        key={action.key}
                        as={Link}
                        to={action.to}
                        className="rounded d-flex align-items-center"
                    >
                        <Icon name={action.icon} className="me-2" />
                        {action.label}
                    </Dropdown.Item>
                ) : (
                    <Dropdown.Item
                        key={action.key}
                        onClick={action.onClick}
                        className="rounded d-flex align-items-center"
                    >
                        <Icon name={action.icon} className="me-2" />
                        {action.label}
                    </Dropdown.Item>
                ),
            )}
        </DropdownButton>
    );
}

export default OrderActionDropdown;
