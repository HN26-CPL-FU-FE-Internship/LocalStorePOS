import configs from '@/configs';
import AuthenticationLayout from '@/layouts/AuthenticationLayout';
import EmailVerify from '@/pages/EmailVerify';
import ForgotPassword from '@/pages/ForgotPassword';
import Login from '@/pages/Login';
import OTP from '@/pages/OTP';
import Register from '@/pages/Register';
import ResetPassword from '@/pages/ResetPassword';

export const publicRoutes = [
    { path: configs.routes.login, component: Login, layout: AuthenticationLayout },
    { path: configs.routes.register, component: Register, layout: AuthenticationLayout },
    { path: configs.routes.otp, component: OTP, layout: AuthenticationLayout },
    { path: configs.routes.forgotPassword, component: ForgotPassword, layout: AuthenticationLayout },
    { path: configs.routes.resetPassword, component: ResetPassword, layout: AuthenticationLayout },
    { path: configs.routes.emailVerify, component: EmailVerify, layout: AuthenticationLayout },
];

export const privateRoutes = [];
