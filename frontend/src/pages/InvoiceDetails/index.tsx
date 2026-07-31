import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Table, Button, Spinner, Alert, Badge, Row, Col } from 'react-bootstrap';
import Icon from '@/components/common/Icon';
import { getInvoice, getInvoiceCustomerAvatarUrl, type InvoiceDetail, type InvoiceStatus } from '@/api/invoice.api';

const statusBadgeClass: Record<InvoiceStatus, string> = {
    paid: 'badge-soft-success',
    unpaid: 'badge-soft-danger',
    partially_paid: 'badge-soft-warning',
    refunded: 'badge-soft-secondary',
    cancelled: 'badge-soft-secondary',
};

const formatCurrency = (value: number) => `$${Number(value).toFixed(2)}`;

const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' });

const InvoiceDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                setInvoice(await getInvoice(Number(id)));
            } catch {
                setError('Failed to load invoice details.');
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" className="me-2" />
                Loading...
            </div>
        );
    }

    if (error || !invoice) {
        return <Alert variant="danger">{error ?? 'Invoice not found.'}</Alert>;
    }

    const avatarUrl = getInvoiceCustomerAvatarUrl(invoice.customerAvatarPath);

    return (
        <>
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div className="d-flex align-items-center">
                    <Button variant="white" size="sm" className="btn-icon rounded-circle me-2" onClick={() => navigate(-1)}>
                        <Icon name="arrow-left" />
                    </Button>
                    <h3 className="mb-0">Invoice Details</h3>
                </div>
                <Button variant="primary" className="d-inline-flex align-items-center" onClick={() => window.print()}>
                    <Icon name="printer" className="me-1" />
                    Print Invoice
                </Button>
            </div>

            <Card>
                <Card.Body className="p-4">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4 border-bottom pb-4">
                        <div>
                            <h4 className="mb-1">{invoice.invoiceNumber}</h4>
                            <p className="mb-0 text-muted">
                                Order #{invoice.orderNumber} • {formatDate(invoice.invoiceDate)}
                            </p>
                        </div>
                        <Badge bg="" className={`fs-13 ${statusBadgeClass[invoice.status]}`}>
                            {invoice.status.replace('_', ' ')}
                        </Badge>
                    </div>

                    <Row className="mb-4">
                        <Col md={6}>
                            <h6 className="mb-2">Bill To</h6>
                            <div className="d-flex align-items-center">
                                <span className="avatar avatar-md avatar-rounded flex-shrink-0 me-2 bg-light d-flex align-items-center justify-content-center overflow-hidden">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt={invoice.customerName} className="img-fluid" />
                                    ) : (
                                        <Icon name="user" className="text-secondary" />
                                    )}
                                </span>
                                <div>
                                    <p className="mb-0 fw-medium">{invoice.customerName}</p>
                                    {invoice.customerPhone && <p className="mb-0 text-muted fs-13">{invoice.customerPhone}</p>}
                                    {invoice.customerEmail && <p className="mb-0 text-muted fs-13">{invoice.customerEmail}</p>}
                                </div>
                            </div>
                        </Col>
                        <Col md={6}>
                            <h6 className="mb-2">Order Info</h6>
                            <p className="mb-1 text-capitalize">
                                <strong>Type:</strong> {invoice.orderType.replace('_', ' ')}
                            </p>
                            {invoice.tableNumber && (
                                <p className="mb-1">
                                    <strong>Table:</strong> {invoice.tableNumber}
                                </p>
                            )}
                            <p className="mb-0 text-capitalize">
                                <strong>Payment:</strong> {invoice.paymentStatus.replace('_', ' ')}
                            </p>
                        </Col>
                    </Row>

                    <Table className="mb-0 border">
                        <thead className="thead-light">
                            <tr>
                                <th>Item</th>
                                <th>Variation</th>
                                <th>Qty</th>
                                <th>Unit Price</th>
                                <th className="text-end">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items.map((line, index) => (
                                <tr key={index}>
                                    <td>{line.itemName}</td>
                                    <td>{line.variationName ?? '-'}</td>
                                    <td>{line.quantity}</td>
                                    <td>{formatCurrency(line.unitPrice)}</td>
                                    <td className="text-end">{formatCurrency(line.lineTotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>

                    <div className="d-flex justify-content-end mt-4">
                        <div style={{ minWidth: 280 }}>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Subtotal</span>
                                <span>{formatCurrency(invoice.subtotal)}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Discount</span>
                                <span>-{formatCurrency(invoice.discountAmount)}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Tax</span>
                                <span>{formatCurrency(invoice.taxAmount)}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Service Charge</span>
                                <span>{formatCurrency(invoice.serviceCharge)}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Delivery Charge</span>
                                <span>{formatCurrency(invoice.deliveryCharge)}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Tip</span>
                                <span>{formatCurrency(invoice.tipAmount)}</span>
                            </div>
                            <div className="d-flex justify-content-between border-top pt-2 mb-2 fw-semibold fs-16">
                                <span>Grand Total</span>
                                <span>{formatCurrency(invoice.grandTotal)}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Paid</span>
                                <span>{formatCurrency(invoice.paidAmount)}</span>
                            </div>
                            <div className="d-flex justify-content-between fw-semibold">
                                <span>Balance</span>
                                <span>{formatCurrency(invoice.balanceAmount)}</span>
                            </div>
                        </div>
                    </div>
                </Card.Body>
            </Card>
        </>
    );
};

export default InvoiceDetailsPage;
