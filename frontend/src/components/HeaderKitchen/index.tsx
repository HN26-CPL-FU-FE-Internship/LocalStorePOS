import Icon from '../common/Icon';

const HeaderKitchen = () => {
    return (
        <>
            <div className="d-flex align-items-center justify-content-center gap-3 flex-wrap">
                <div className="d-inline-flex align-items-center justify-content-between rounded-pill bg-white ps-2 pe-3 py-2 gap-3 border">
                    <div className="d-flex align-items-center gap-2">
                        <div className="avatar avatar-sm rounded-circle bg-gray">
                            <Icon name="newspaper" className="fs-14" />
                        </div>
                        <p className="mb-0 text-dark fw-medium">New Order</p>
                    </div>
                    <h5 className="fs-18px fw-semibold mb-0">02</h5>
                </div>
                <div className="d-inline-flex align-items-center justify-content-between rounded-pill bg-white ps-2 pe-3 py-2 gap-3 border">
                    <div className="d-flex align-items-center gap-2">
                        <div className="avatar avatar-sm rounded-circle bg-secondary">
                            <Icon name="package-2" className="fs-14" />
                        </div>
                        <p className="mb-0 text-dark fw-medium">In Kitchen</p>
                    </div>
                    <h5 className="fs-18px fw-semibold mb-0">03</h5>
                </div>
                <div className="d-inline-flex align-items-center justify-content-between rounded-pill bg-white ps-2 pe-3 py-2 gap-3 border">
                    <div className="d-flex align-items-center gap-2">
                        <div className="avatar avatar-sm rounded-circle bg-danger">
                            <Icon name="clock-alert" className="fs-14" />
                        </div>
                        <p className="mb-0 text-dark fw-medium">Delayed</p>
                    </div>
                    <h5 className="fs-18px fw-semibold mb-0">01</h5>
                </div>
                <div className="d-inline-flex align-items-center justify-content-between rounded-pill bg-white ps-2 pe-3 py-2 gap-3 border">
                    <div className="d-flex align-items-center gap-2">
                        <div className="avatar avatar-sm rounded-circle bg-success">
                            <Icon name="check-check" className="fs-14" />
                        </div>
                        <p className="mb-0 text-dark fw-medium">Completed</p>
                    </div>
                    <h5 className="fs-18px fw-semibold mb-0">02</h5>
                </div>
            </div>
        </>
    );
};

export default HeaderKitchen;
