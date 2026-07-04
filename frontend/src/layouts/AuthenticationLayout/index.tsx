import { Col, Container, Row } from 'react-bootstrap';
import type { ReactNode } from 'react';

import { authBackground1, authBackground2, login } from '@/assets/img/authentication';
import logo from '@/assets/img/logo.svg';
import styles from './AuthenticationLayout.module.scss';
import { bindCx } from '@/utils';
import { Link } from 'react-router-dom';
import configs from '@/configs';

const cx = bindCx(styles);

function AuthenticationLayout({ children }: { children: ReactNode }) {
    return (
        <Container fluid>
            <div className={cx(`w-100 overflow-hidden position-relative flex-wrap d-block vh-100`)}>
                <Row className={cx(`g-2`)}>
                    <Col lg={6} md={12} sm={12} className={cx(`p-3`)}>
                        <Row
                            className={cx(`auth-vh justify-content-center align-items-center overflow-auto flex-wrap`)}
                        >
                            <Col xl={8} lg={10} md={8} sm={10} className={cx(`mx-3`)}>
                                <form action="index.html">
                                    <div className="d-flex flex-column justify-content-between">
                                        <div className="mb-5">
                                            <Link to={configs.routes.login}>
                                                <img src={logo} className="img-fluid" alt="Logo" />
                                            </Link>
                                        </div>

                                        {children}
                                    </div>
                                </form>
                            </Col>
                        </Row>
                    </Col>

                    <Col lg={6}>
                        <div
                            className={cx(
                                'position-relative d-lg-flex align-items-center justify-content-center d-none flex-wrap vh-100 p-4 ps-0',
                            )}
                        >
                            <div
                                className={cx('w-100 rounded-3 position-relative h-100 bg-primary z-1 overflow-hidden')}
                            >
                                <img
                                    src={authBackground1}
                                    className={cx('img-fluid position-absolute end-0 z-n1 auth-bg-01')}
                                    alt="bg"
                                />
                                <img
                                    src={authBackground2}
                                    className={cx('img-fluid position-absolute top-0 end-0 z-n1 auth-bg-02')}
                                    alt="bg"
                                />
                                <div
                                    className={cx(
                                        'px-4 rounded-3 h-100 d-flex flex-column align-items-center auth-wrap',
                                    )}
                                >
                                    <div className={cx('text-center z-2')}>
                                        <h1 className={cx('text-white mb-2')}>
                                            Complete Control of Your Cafe &amp; Restaurant with Ease
                                        </h1>
                                        <p className={cx('text-white mb-0')}>
                                            From billing to inventory access everything you need in a single powerful
                                            dashboard, Analyze sales, track your best-selling dishes.
                                        </p>
                                    </div>
                                    <div className={cx('text-center auth-img position-absolute bottom-0')}>
                                        <img src={login} className={cx('img-fluid position-relative z-1')} alt="user" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Col>
                </Row>
            </div>
        </Container>
    );
}

export default AuthenticationLayout;
