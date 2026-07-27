import Icon from '@/components/common/Icon';
import useContextData from '@/hooks/useContextData';
import { ToastContext } from '@/provider/ToastProvider/ToastContext';
import usePOSCreateOrder from '@/stores/pos.store';
import { memo, useCallback } from 'react';
import { Button, Col, Row } from 'react-bootstrap';
import { useShallow } from 'zustand/react/shallow';

const PlaceOrder = ({ onShow }: { onShow: () => void }) => {
    const { cartItems, resetCart, setCustomer, setTable, placingOrder, editingOrderNumber } = usePOSCreateOrder(
        useShallow((s) => ({
            cartItems: s.cartItems,
            resetCart: s.resetCart,
            setCustomer: s.setCustomer,
            setTable: s.setTable,
            placingOrder: s.placingOrder,
            editingOrderNumber: s.editingOrderNumber,
        })),
    );
    const { showToast } = useContextData(ToastContext);
    const handleCancelOrder = useCallback(() => {
        resetCart();
        setCustomer(null);
        setTable(null);
        showToast('info', 'Order cancelled');
    }, [resetCart, setCustomer, setTable, showToast]);

    return (
        <>
            <Button
                className="btn btn-primary w-100 mb-4"
                disabled={cartItems.length === 0 || placingOrder}
                onClick={onShow}
            >
                {placingOrder
                    ? 'Saving...'
                    : editingOrderNumber
                      ? 'Update Order'
                      : 'Place an Order'}
            </Button>
            <Row className="g-3">
                <Col sm={4}>
                    <Button
                        className="btn btn-outline-light btn-sm d-flex align-items-center gap-1 shadow-sm"
                        disabled={cartItems.length === 0 || placingOrder}
                        onClick={handleCancelOrder}
                    >
                        <Icon name="x" />
                        Cancel
                    </Button>
                </Col>
            </Row>
        </>
    );
};

export default memo(PlaceOrder);
