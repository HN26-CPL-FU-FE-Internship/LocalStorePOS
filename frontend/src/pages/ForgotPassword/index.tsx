import configs from '@/configs';
import { Link } from 'react-router-dom';

function ForgotPassword() {
    return (
        <div>
            <div className="mb-4">
                <h3 className="mb-2">Forgot Password</h3>
                <p className="mb-0">Please enter your email address to receive a verification code</p>
            </div>

            <div className="mb-4">
                <label className="form-label">
                    Email<span className="text-danger"> *</span>
                </label>
                <input type="email" className="form-control" />
            </div>

            <div className="mb-4">
                <button type="submit" className="btn btn-primary w-100">
                    Send Email
                </button>
            </div>

            <div className="text-center mt-4">
                <p className="fw-normal mb-0">
                    Back to
                    <Link to={configs.routes.login} className="link-primary">
                        &nbsp;Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default ForgotPassword;
