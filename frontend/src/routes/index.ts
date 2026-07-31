import configs from '@/configs';
import AppLayout from '@/layouts/AppLayout';
import AuthenticationLayout from '@/layouts/AuthenticationLayout';
import POSLayout from '@/layouts/POSLayout';
import CategoriesPage from '@/pages/Categories';
import DashboardIndex from '@/pages/Dashboard';
import EmailVerify from '@/pages/EmailVerify';
import ForgotPassword from '@/pages/ForgotPassword';
import Items from '@/pages/Items';
import Kitchen from '@/pages/Kitchen';
import Login from '@/pages/Login';
import Orders from '@/pages/Orders';
import OTP from '@/pages/OTP';
import POS from '@/pages/POS';
import Register from '@/pages/Register';
import Reservation from '@/pages/Reservation';
import Reports from '@/pages/Reports';
import ResetPassword from '@/pages/ResetPassword';
import Users from '@/pages/Users';
import Permissions from '@/pages/Permissions';
import Addons from '@/pages/Addons';
import Coupons from '@/pages/Coupons';
import Tables from '@/pages/Tables';
import Customers from '@/pages/Customers';
import Invoices from '@/pages/Invoices';
import InvoiceDetails from '@/pages/InvoiceDetails';
import Payments from '@/pages/Payments';
import FakeBankPaymentPage from '@/pages/Payment';
import ApprovalRequests from '@/pages/ApprovalRequests';
import StoreSettingsPage from '@/pages/Settings/StoreSettings';
import TaxSettingsPage from '@/pages/Settings/TaxSettings';
import PrintSettingsPage from '@/pages/Settings/PrintSettings';
import PaymentSettingsPage from '@/pages/Settings/PaymentSettings';
import DeliverySettingsPage from '@/pages/Settings/DeliverySettings';
import NotificationsSettingsPage from '@/pages/Settings/NotificationsSettings';
import IntegrationsSettingsPage from '@/pages/Settings/IntegrationsSettings';

export const publicRoutes = [
    { path: configs.routes.login, component: Login, layout: AuthenticationLayout },
    { path: configs.routes.register, component: Register, layout: AuthenticationLayout },
    { path: configs.routes.otp, component: OTP, layout: AuthenticationLayout },
    { path: configs.routes.forgotPassword, component: ForgotPassword, layout: AuthenticationLayout },
    { path: configs.routes.resetPassword, component: ResetPassword, layout: AuthenticationLayout },
    { path: configs.routes.emailVerify, component: EmailVerify, layout: AuthenticationLayout },
    { path: configs.routes.dashboard, component: DashboardIndex, layout: AppLayout },
    { path: configs.routes.pos, component: POS, layout: POSLayout },
    { path: configs.routes.orders, component: Orders, layout: AppLayout },
    { path: configs.routes.kitchen, component: Kitchen, layout: AppLayout },
    { path: configs.routes.reservation, component: Reservation, layout: AppLayout },
    { path: configs.routes.categories, component: CategoriesPage, layout: AppLayout },
    { path: configs.routes.items, component: Items, layout: AppLayout },
    { path: configs.routes.addons, component: Addons, layout: AppLayout },
    { path: configs.routes.coupons, component: Coupons, layout: AppLayout },
    { path: configs.routes.tables, component: Tables, layout: AppLayout },
    { path: configs.routes.customers, component: Customers, layout: AppLayout },
    { path: configs.routes.invoices, component: Invoices, layout: AppLayout },
    { path: configs.routes.invoiceDetails, component: InvoiceDetails, layout: AppLayout },
    { path: configs.routes.payments, component: Payments, layout: AppLayout },
    { path: configs.routes.payment, component: FakeBankPaymentPage, layout: null },
    { path: configs.routes.users, component: Users, layout: AppLayout },
    { path: configs.routes['role-permissions'], component: Permissions, layout: AppLayout },
    { path: configs.routes['approval-requests'], component: ApprovalRequests, layout: AppLayout },
    { path: configs.routes['earning-reports'], component: Reports, layout: AppLayout },
    { path: configs.routes['order-reports'], component: Reports, layout: AppLayout },
    { path: configs.routes['sale-reports'], component: Reports, layout: AppLayout },
    { path: configs.routes['customer-reports'], component: Reports, layout: AppLayout },
    { path: configs.routes['audit-reports'], component: Reports, layout: AppLayout },
    { path: configs.routes['store-settings'], component: StoreSettingsPage, layout: AppLayout },
    { path: configs.routes['tax-settings'], component: TaxSettingsPage, layout: AppLayout },
    { path: configs.routes['print-settings'], component: PrintSettingsPage, layout: AppLayout },
    { path: configs.routes['payment-settings'], component: PaymentSettingsPage, layout: AppLayout },
    { path: configs.routes['delivery-settings'], component: DeliverySettingsPage, layout: AppLayout },
    { path: configs.routes['notifications-settings'], component: NotificationsSettingsPage, layout: AppLayout },
    { path: configs.routes['integrations-settings'], component: IntegrationsSettingsPage, layout: AppLayout },
];

export const privateRoutes = [];
