import { Link } from 'react-router-dom';
import { EyeOff, Eye } from 'lucide-react';

import google from '@/assets/img/icons/google.svg';
import facebook from '@/assets/img/icons/fb.svg';
import configs from '@/configs';
import { useState } from 'react';
import { PASSWORD_CONFIRM_TYPE, PASSWORD_TYPE } from '@/constants';
import { toggleHidePassword } from '@/utils';

function Register() {
    const [passHide, setPassHide] = useState(true);
    const [passConfirmHide, setPassConfirmHide] = useState(true);

    const [passType, setPassType] = useState('password');
    const [passConfirmType, setPassConfirmType] = useState('password');

    const iconSize: number = 16;
    const { routes } = configs;

    const handleClickEye = (type: string) => {
        if (type === PASSWORD_TYPE) {
            toggleHidePassword(passType, setPassType, setPassHide);
        } else if (type === PASSWORD_CONFIRM_TYPE) {
            toggleHidePassword(passConfirmType, setPassConfirmType, setPassConfirmHide);
        }
    };

    return (
        <div>
            <div className="mb-4">
                <h3 className="mb-2">Sign Up</h3>
                <p className="mb-0">And lets get started </p>
            </div>

            <div className="mb-3">
                <label className="form-label">
                    Email<span className="text-danger"> *</span>
                </label>
                <input type="email" className="form-control" placeholder="name@example.com" required />
            </div>

            <div className="mb-3">
                <label className="form-label">
                    Password<span className="text-danger"> *</span>
                </label>
                <div className="input-group input-group-flat pass-group">
                    <input type={passType} className="form-control pass-input" required />
                    <span className="input-group-text toggle-password">
                        {passHide ? (
                            <EyeOff size={`${iconSize}px`} onClick={() => handleClickEye(PASSWORD_TYPE)} />
                        ) : (
                            <Eye size={`${iconSize}px`} onClick={() => handleClickEye(PASSWORD_TYPE)} />
                        )}
                    </span>
                </div>
            </div>

            <div className="mb-3">
                <label className="form-label">
                    Confirm Password<span className="text-danger">*</span>
                </label>
                <div className="input-group input-group-flat pass-group">
                    <input type={passConfirmType} className="form-control pass-input" required />
                    <span className="input-group-text toggle-password">
                        {passConfirmHide ? (
                            <EyeOff size={`${iconSize}px`} onClick={() => handleClickEye(PASSWORD_CONFIRM_TYPE)} />
                        ) : (
                            <Eye size={`${iconSize}px`} onClick={() => handleClickEye(PASSWORD_CONFIRM_TYPE)} />
                        )}
                    </span>
                </div>
            </div>

            <div className="form-check form-check-md mb-4">
                <input className="form-check-input" id="remember_me" type="checkbox" />
                <label htmlFor="remember_me" className="form-check-label text-dark mt-0">
                    Remember Me
                </label>
            </div>

            <div className="mb-4">
                <button type="submit" className="btn btn-primary w-100">
                    Sign Up
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
                    Already have an account?
                    <Link to={routes.login} className="link-primary">
                        &nbsp;Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default Register;
