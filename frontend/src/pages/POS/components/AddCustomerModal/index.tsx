import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Form, Modal } from 'react-bootstrap';
import Icon from '@/components/common/Icon';
import posService from '@/services/posService';
import { queryClient } from '@/lib/queryClient';
import { POS_QUERY_KEYS } from '@/constants/pos';
import usePOSCreateOrder from '@/stores/pos.store';

/* ------------------------------------------------------------------ */
/*  Schema                                                             */
/* ------------------------------------------------------------------ */
const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
] as const;

const customerSchema = z.object({
    name: z.string().min(1, 'Name is required').max(150, 'Name must not exceed 150 characters'),
    phone: z.string().min(1, 'Phone is required').max(30, 'Phone must not exceed 30 characters'),
    email: z
        .string()
        .max(150, 'Email must not exceed 150 characters')
        .email('Invalid email format')
        .optional()
        .or(z.literal('')),
    gender: z.enum(['male', 'female', 'other']).nullable().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */
interface AddCustomerModalProps {
    show: boolean;
    onHide: () => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
function AddCustomerModal({ show, onHide }: AddCustomerModalProps) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting, isValid },
        reset,
        setError,
    } = useForm<CustomerFormData>({
        resolver: zodResolver(customerSchema),
        mode: 'onBlur',
        defaultValues: { name: '', phone: '', email: '', gender: null },
    });

    const setCustomer = usePOSCreateOrder((s) => s.setCustomer);

    const handleClose = useCallback(() => {
        reset({ name: '', phone: '', email: '', gender: null });
        onHide();
    }, [reset, onHide]);

    const onSubmit = useCallback(
        async (data: CustomerFormData) => {
            try {
                const result = await posService.createCustomer({
                    name: data.name.trim(),
                    phone: data.phone.trim(),
                    email: data.email?.trim() || undefined,
                    gender: data.gender ?? null,
                });

                queryClient.invalidateQueries({ queryKey: POS_QUERY_KEYS.customers() });

                setCustomer({ label: result.name, value: String(result.id) });
                handleClose();
            } catch (err: unknown) {
                const msg =
                    err && typeof err === 'object' && 'response' in err
                        ? ((err as { response: { data: { message?: string } } }).response.data?.message ??
                          'Failed to create customer')
                        : 'Failed to create customer';
                setError('root', { message: msg });
            }
        },
        [handleClose, setCustomer, setError],
    );

    return (
        <Modal show={show} onHide={handleClose} centered size="sm">
            <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                <Modal.Header closeButton>
                    <Modal.Title className="fs-6 fw-semibold">New Customer</Modal.Title>
                </Modal.Header>
                <Modal.Body className="py-3">
                    {errors.root && <div className="alert alert-danger py-2 fs-13 mb-3">{errors.root.message}</div>}
                    <Form.Group className="mb-3">
                        <Form.Label className="fs-13 fw-medium text-dark">
                            Name <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            type="text"
                            size="sm"
                            placeholder="Enter customer name"
                            isInvalid={!!errors.name}
                            {...register('name')}
                        />
                        <Form.Control.Feedback type="invalid">{errors.name?.message}</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label className="fs-13 fw-medium text-dark">
                            Phone <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            type="tel"
                            size="sm"
                            placeholder="Enter phone number"
                            isInvalid={!!errors.phone}
                            {...register('phone')}
                        />
                        <Form.Control.Feedback type="invalid">{errors.phone?.message}</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label className="fs-13 fw-medium text-dark">Email</Form.Label>
                        <Form.Control
                            type="email"
                            size="sm"
                            placeholder="Enter email (optional)"
                            isInvalid={!!errors.email}
                            {...register('email')}
                        />
                        <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group className="mb-0">
                        <Form.Label className="fs-13 fw-medium text-dark d-block">Gender</Form.Label>
                        <div className="d-flex gap-3">
                            {genderOptions.map((opt) => (
                                <Form.Check
                                    key={opt.value}
                                    type="radio"
                                    id={`gender-${opt.value}`}
                                    label={opt.label}
                                    value={opt.value}
                                    isInvalid={!!errors.gender}
                                    {...register('gender')}
                                />
                            ))}
                        </div>
                        <Form.Control.Feedback type="invalid">{errors.gender?.message}</Form.Control.Feedback>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="pt-2">
                    <Button variant="light" size="sm" onClick={handleClose} type="button">
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        type="submit"
                        disabled={isSubmitting || !isValid}
                        className="d-flex align-items-center gap-1"
                    >
                        {isSubmitting ? <span className="spinner-border spinner-border-sm" /> : <Icon name="plus" />}
                        {isSubmitting ? 'Creating...' : 'Create'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

export default AddCustomerModal;
