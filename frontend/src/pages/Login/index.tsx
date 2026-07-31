import { Link, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { EyeOff, Eye } from 'lucide-react';

import configs from '@/configs';

import { useState } from 'react';
import { toggleHidePassword, tokenUtils } from '@/utils';
import type { AxiosError } from 'axios';
import { useLogin } from '@/hooks/auth';
import { loginSchema, type LoginForm } from './login.schema';
import { useForm } from 'react-hook-form';
import useAuth from '@/hooks/useAuth';

function Login() {
    const navigate = useNavigate();
    const { setUser } = useAuth();

    const [isHide, setIsHide] = useState(true);
    const [inputType, setInputType] = useState('password');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const [error, setError] = useState('');

    const { routes } = configs;

    const loginMutation = useLogin();

    const onSubmit = (data: LoginForm) => {
        loginMutation.mutate(data, {
            onSuccess: (response) => {
                const result = response.data.result;
                tokenUtils.saveTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
                if (result.user) {
                    setUser(result.user);
                }
                switch (result.user?.role) {
                    case 'Admin / Owner':
                        navigate(routes.dashboard);
                        break;
                    case 'Supervisor':
                        navigate(routes.dashboard);
                        break;
                    case 'Cashier':
                        navigate(routes.orders);
                        break;
                    case 'Chef':
                        navigate(routes.kitchen);
                        break;
                    case 'Waiter':
                        navigate(routes.pos);
                        break;
                    case 'Delivery':
                        navigate(routes.orders);
                        break;
                    case 'Accountant':
                        navigate(routes.reports);
                        break;
                    case 'System Operator':
                        navigate(routes['store-settings']);
                        break;
                    default:
                        navigate(routes.dashboard);
                        break;
                }
            },
            onError: (error: unknown) => {
                const axiosError = error as AxiosError<{ code?: number; message?: string }>;
                const backendCode = axiosError?.response?.data?.code;
                const backendMessage = axiosError?.response?.data?.message;
                if (backendCode === 1021) {
                    setError(backendMessage || 'Your account has been deactivated. Please contact administrator.');
                } else {
                    setError('Invalid email or password!');
                }
            },
        });
    };

    const handleClickEye = () => {
        toggleHidePassword(inputType, setInputType, setIsHide);
    };

    return (
        <div>
            <div>
                <div className="mb-4">
                    <h3 className="mb-2">Hi, Welcome Back !!!</h3>
                    <p className="mb-0">Please enter your credentials to sign in!</p>
                </div>

                {error && (
                    <div className="alert alert-danger py-2" role="alert">
                        {error}
                    </div>
                )}

                <div className="mb-3">
                    <label className="form-label">
                        Email<span className="text-danger"> *</span>
                    </label>
                    <input
                        type="email"
                        className="form-control"
                        placeholder="name@example.com"
                        {...register('email')}
                        required
                    />
                    {errors.email && <div className="text-danger mt-1">{errors.email.message}</div>}
                </div>

                <div className="mb-3">
                    <label className="form-label">
                        Password<span className="text-danger"> *</span>
                    </label>
                    <div className="input-group input-group-flat pass-group">
                        <input
                            type={inputType}
                            className="form-control pass-input"
                            {...register('password')}
                            required
                        />
                        <span className="input-group-text toggle-password">
                            {isHide ? (
                                <EyeOff size={`16px`} onClick={handleClickEye} />
                            ) : (
                                <Eye size={`16px`} onClick={handleClickEye} />
                            )}
                        </span>
                    </div>
                    {errors.password && <div className="text-danger mt-1">{errors.password.message}</div>}
                </div>

                <div className="d-flex align-items-center justify-content-between mb-4">
                    {/* <div className="d-flex align-items-center">
                        <div className="form-check form-check-md mb-0">
                            <input className="form-check-input" id="remember_me" type="checkbox" />
                            <label htmlFor="remember_me" className="form-check-label text-dark mt-0">
                                Remember Me
                            </label>
                        </div>
                    </div> */}
                    <div className="text-end">
                        <Link to={routes.forgotPassword} className="link-primary">
                            Forgot Password?
                        </Link>
                    </div>
                </div>

                <div className="mb-4">
                    <button
                        className="btn btn-primary w-100"
                        disabled={loginMutation.isPending}
                        onClick={handleSubmit(onSubmit)}
                    >
                        {loginMutation.isPending ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" />
                                Signing In...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Login;
