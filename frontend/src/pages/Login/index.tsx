import { Link } from 'react-router-dom';
import { EyeOff, Eye } from 'lucide-react';

import google from '@/assets/img/icons/google.svg';
import facebook from '@/assets/img/icons/fb.svg';
import configs from '@/configs';

import { useState, type ChangeEvent, type MouseEvent } from 'react';

function Login() {
    const [isHide, setIsHide] = useState(true);
    const [inputType, setInputType] = useState('password');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const { routes } = configs;

    const handleSubmit = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        // Làm backend xong gọi api là ngon luôn
    };

    const handleClickEye = () => {
        if (inputType === 'password') {
            setInputType('text');
            setIsHide(false);
        } else {
            setInputType('password');
            setIsHide(true);
        }
    };

    return (
        <div>
            <div>
                <div className="mb-4">
                    <h3 className="mb-2">Hi, Welcome Back !!!</h3>
                    <p className="mb-0">Please enter your credentials to sign in!</p>
                </div>

                <div className="mb-3">
                    <label className="form-label">
                        Email<span className="text-danger"> *</span>
                    </label>
                    <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">
                        Password<span className="text-danger"> *</span>
                    </label>
                    <div className="input-group input-group-flat pass-group">
                        <input
                            type={inputType}
                            className="form-control pass-input"
                            value={password}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
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
                </div>

                <div className="d-flex align-items-center justify-content-between mb-4">
                    <div className="d-flex align-items-center">
                        <div className="form-check form-check-md mb-0">
                            <input className="form-check-input" id="remember_me" type="checkbox" />
                            <label htmlFor="remember_me" className="form-check-label text-dark mt-0">
                                Remember Me
                            </label>
                        </div>
                    </div>
                    <div className="text-end">
                        <Link to={routes.forgotPassword} className="link-primary">
                            Forgot Password?
                        </Link>
                    </div>
                </div>

                <div className="mb-4">
                    <button
                        onClick={(e: MouseEvent<HTMLButtonElement>) => handleSubmit(e)}
                        className="btn btn-primary w-100"
                    >
                        Sign In
                    </button>
                </div>

                <div className="login-or position-relative mb-4 text-center">
                    <span className="position-relative bg-white px-2 z-2">or continue with</span>
                </div>

                <div className="d-flex align-items-center justify-content-center flex-wrap">
                    <div className="text-center me-2 flex-fill">
                        <Link to="#" className="btn btn-white d-flex align-items-center justify-content-center shadow">
                            <img className="img-fluid me-2" src={google} alt="google" />
                            Google
                        </Link>
                    </div>
                    <div className="text-center me-2 flex-fill">
                        <Link to="#" className="btn btn-white d-flex align-items-center justify-content-center shadow">
                            <img className="img-fluid me-2" src={facebook} alt="facebook" />
                            Facebook
                        </Link>
                    </div>
                </div>

                <div className="text-center mt-4">
                    <p className="fw-normal mb-0">
                        Don't have an account?
                        <Link to={routes.register} className="link-primary">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
