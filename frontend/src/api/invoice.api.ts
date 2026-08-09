import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/auth';
import type { PageResponse } from '@/api/category.api';

export type InvoiceStatus = 'paid' | 'unpaid' | 'partially_paid' | 'refunded' | 'cancelled';

export interface InvoiceEntry {
    id: number;
    invoiceNumber: string;
    orderId: number;
    orderNumber: string;
    customerId: number | null;
    customerName: string;
    customerAvatarPath: string | null;
    invoiceDate: string;
    orderType: string;
    amount: number;
    status: InvoiceStatus;
    createdAt: string;
}

export interface InvoiceItemLine {
    itemName: string;
    variationName: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
}

export interface InvoiceDetail {
    id: number;
    invoiceNumber: string;
    orderId: number;
    orderNumber: string;
    orderType: string;
    tableNumber: string | null;
    customerId: number | null;
    customerName: string;
    customerPhone: string | null;
    customerEmail: string | null;
    customerAvatarPath: string | null;
    invoiceDate: string;
    status: InvoiceStatus;
    items: InvoiceItemLine[];
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    serviceCharge: number;
    deliveryCharge: number;
    tipAmount: number;
    grandTotal: number;
    paidAmount: number;
    balanceAmount: number;
    paymentStatus: string;
    createdAt: string;
}

export interface InvoiceQuery {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
    search?: string;
    status?: InvoiceStatus;
}

export const getInvoices = async (params: InvoiceQuery): Promise<PageResponse<InvoiceEntry>> => {
    const { data } = await api.get<ApiResponse<PageResponse<InvoiceEntry>>>('/invoices', { params });
    return data.result;
};

export const getInvoice = async (id: number): Promise<InvoiceDetail> => {
    const { data } = await api.get<ApiResponse<InvoiceDetail>>(`/invoices/${id}`);
    return data.result;
};

export const deleteInvoice = async (id: number): Promise<void> => {
    await api.delete(`/invoices/${id}`);
};
