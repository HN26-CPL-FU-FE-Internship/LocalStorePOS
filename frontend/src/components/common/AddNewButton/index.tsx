import { Button } from 'react-bootstrap';
import Icon from '../Icon';

function AddNewButton({ name, onClick }: { name: string; onClick: () => void }) {
    return (
        <Button onClick={onClick}>
            <Icon name={name} />
            <span className="ms-1">Add New</span>
        </Button>
    );
}

export default AddNewButton;
