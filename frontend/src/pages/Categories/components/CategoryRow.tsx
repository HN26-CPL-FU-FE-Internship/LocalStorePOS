import { Badge, Button } from 'react-bootstrap';

import Icon from '@/components/common/Icon';

import { getCategoryImageUrl, type CategoryEntry } from '@/api/category.api';

import { formatDate } from '../utils/category.utils';

interface CategoryRowProps {
    category: CategoryEntry;

    showCategory: boolean;
    showItemCount: boolean;
    showCreatedAt: boolean;
    showStatus: boolean;
    showActions: boolean;

    handleToggleStatus: (category: CategoryEntry) => void;

    openEdit: (category: CategoryEntry) => void;

    openDelete: (category: CategoryEntry) => void;
}

const CategoryRow = ({
    category,
    showCategory,
    showItemCount,
    showCreatedAt,
    showStatus,
    showActions,
    handleToggleStatus,
    openEdit,
    openDelete,
}: CategoryRowProps) => {
    const imageUrl = getCategoryImageUrl(category.imagePath);

    return (
        <tr>
            {showCategory && (
                <td>
                    <div className="d-flex align-items-center">
                        <div className="avatar avatar-sm avatar-rounded flex-shrink-0 me-2 bg-light d-flex align-items-center justify-content-center">
                            {imageUrl ? (
                                <img src={imageUrl} alt={category.name} className="img-fluid" />
                            ) : (
                                <Icon name="image" className="text-secondary" />
                            )}
                        </div>

                        <h6 className="fs-14 fw-normal mb-0">{category.name}</h6>
                    </div>
                </td>
            )}

            {showItemCount && <td>{category.itemCount}</td>}

            {showCreatedAt && <td>{formatDate(category.createdAt)}</td>}

            {showStatus && (
                <td>
                    <Badge
                        bg=""
                        role="button"
                        className={category.status === 'active' ? 'badge-soft-success' : 'badge-soft-danger'}
                        title="Click to toggle status"
                        onClick={() => handleToggleStatus(category)}
                    >
                        {category.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                </td>
            )}

            {showActions && (
                <td>
                    <Button
                        variant="white"
                        size="sm"
                        className="btn-icon rounded-circle me-2"
                        title="Edit"
                        onClick={() => openEdit(category)}
                    >
                        <Icon name="pencil-line" />
                    </Button>

                    <Button
                        variant="white"
                        size="sm"
                        className="btn-icon rounded-circle"
                        title="Delete"
                        onClick={() => openDelete(category)}
                    >
                        <Icon name="trash-2" />
                    </Button>
                </td>
            )}
        </tr>
    );
};

export default CategoryRow;
