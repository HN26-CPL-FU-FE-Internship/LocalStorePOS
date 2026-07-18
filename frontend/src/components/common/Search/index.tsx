import Icon from '../Icon';

const Search = () => {
    return (
        <div className="gap-3 d-flex align-items-center flex-wrap">
            <div className="page-search">
                <input className="form-control form-control-sm" placeholder="Search" type="search" />
                <Icon
                    name="search"
                    className="fs-14"
                    style={{
                        position: 'absolute',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        right: '12px',
                        border: '0',
                        lineHeight: '0',
                    }}
                />
            </div>
        </div>
    );
};

export default Search;
