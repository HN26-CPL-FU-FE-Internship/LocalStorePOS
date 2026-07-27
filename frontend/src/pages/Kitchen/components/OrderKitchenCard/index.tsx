import { useCallback, useEffect, useState } from 'react';
import Icon from '@/components/common/Icon';
import type { OrderSummary } from '@/types';
import { formatDateTimeKitchen, notifyTimerExpired, toTitleCase, warmUpAudio } from '@/utils';
import { Button, Card, Col, Spinner } from 'react-bootstrap';
import KitchenOrderItemRow from '../KitchenOrderItemRow';
import { KITCHEN_STATUSES } from '@/constants';
import useCookingTimer from '@/hooks/kitchen/useCookingTimer';
import useStartCooking from '@/hooks/kitchen/useStartCooking';
import useMarkKitchenComplete from '@/hooks/kitchen/useMarkKitchenComplete';
import useMarkKitchenDelayed from '@/hooks/kitchen/useMarkKitchenDelayed';
import useContextData from '@/hooks/useContextData';
import { ToastContext } from '@/provider/ToastProvider/ToastContext';
import MinutesInputModal, { MIN_MINUTES, MAX_MINUTES } from './MinutesInputModal';
import ConfirmDoneModal from './ConfirmDoneModal';

const OrderKitchenCard = ({ order }: { order: OrderSummary }) => {
    const { kitchenStatus } = order;
    const isCompleted = kitchenStatus === 'completed' || kitchenStatus === 'cancelled';
    const { showToast } = useContextData(ToastContext);

    const markKitchenDelayedMutation = useMarkKitchenDelayed();

    // ── Auto-delay when timer expires ────────────────────────────────
    const handleTimerExpired = useCallback(async () => {
        // Notify chef with sound + browser notification
        notifyTimerExpired(order.orderNumber, order.customerName);

        // Only auto-delay if order is still cooking (not already completed/cancelled)
        if (kitchenStatus !== 'in_kitchen') return;
        try {
            await markKitchenDelayedMutation.mutateAsync(order.id);
            showToast('warning', 'Order is now delayed!');
        } catch {
            // Silently fail — the order might have been completed externally
        }
    }, [order.id, kitchenStatus, showToast, order.orderNumber, order.customerName, markKitchenDelayedMutation]);

    // Timer state — now includes progressPercent from the hook (wall-clock accurate)
    const {
        timerState,
        remainingSeconds,
        formattedTime,
        progressPercent,
        start: startTimer,
        pause: pauseTimer,
        resume: resumeTimer,
        reset: resetTimer,
    } = useCookingTimer({
        estimatedMinutes: order.estimatedMinutes,
        cookingStartedAt: order.cookingStartedAt,
        onComplete: handleTimerExpired,
    });

    const startCookingMutation = useStartCooking();
    const markKitchenCompleteMutation = useMarkKitchenComplete();

    // Confirmation / input modals
    const [showMinutesModal, setShowMinutesModal] = useState(false);
    const [showConfirmDoneModal, setShowConfirmDoneModal] = useState(false);
    const [minutesInput, setMinutesInput] = useState(15);

    // ── Handlers ────────────────────────────────────────────────────────

    const handlePlayClick = useCallback(() => {
        if (isCompleted) return;

        if (timerState === 'idle') {
            // Show modal to ask for minutes
            setMinutesInput(15);
            setShowMinutesModal(true);
        } else if (timerState === 'running') {
            pauseTimer();
        } else if (timerState === 'paused') {
            resumeTimer();
        }
    }, [isCompleted, timerState, pauseTimer, resumeTimer]);

    const handleConfirmMinutes = useCallback(async () => {
        if (minutesInput < MIN_MINUTES || minutesInput > MAX_MINUTES) {
            showToast('error', `Minutes must be between ${MIN_MINUTES} and ${MAX_MINUTES}.`);
            return;
        }

        // Pre-warm AudioContext while we have a user gesture (required by browsers)
        warmUpAudio();

        try {
            await startCookingMutation.mutateAsync({ id: order.id, estimatedMinutes: minutesInput });
            startTimer(minutesInput);
            setShowMinutesModal(false);
            showToast('success', 'Cooking started!');
        } catch (error) {
            const message =
                (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                'Failed to start cooking.';
            showToast('error', message);
        }
    }, [minutesInput, order.id, startTimer, showToast, startCookingMutation]);

    const handleMarkDone = useCallback(async () => {
        if (isCompleted) return;

        setShowConfirmDoneModal(true);
    }, [isCompleted]);

    const confirmMarkDone = useCallback(async () => {
        setShowConfirmDoneModal(false);
        try {
            await markKitchenCompleteMutation.mutateAsync(order.id);
            showToast('success', 'Order marked as completed!');
            resetTimer();
        } catch (error) {
            const message =
                (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                'Failed to mark order as completed.';
            showToast('error', message);
        }
    }, [order.id, resetTimer, showToast, markKitchenCompleteMutation]);

    useEffect(() => {
        if (order.kitchenStatus === 'completed') resetTimer();
    }, [order.kitchenStatus, resetTimer]);

    // ── Derived UI state ───────────────────────────────────────────────

    const playButtonIcon = timerState === 'running' ? 'pause' : timerState === 'paused' ? 'play' : 'play';
    const playButtonLabel = timerState === 'running' ? 'Pause' : timerState === 'paused' ? 'Resume' : 'Play';
    const timerExpired = timerState === 'completed' && !isCompleted;
    const isUrgent = remainingSeconds < 120 && timerState === 'running';
    const isCancelled = kitchenStatus === 'cancelled';
    const progressBarClasses = isCancelled
        ? 'bg-danger progress-bar-striped progress-bar-animated'
        : isUrgent
          ? 'bg-danger'
          : 'bg-success';

    return (
        <Col xl={4} lg={6} md={6} className="d-flex">
            <Card className="flex-fill mb-0">
                <Card.Header className={`${KITCHEN_STATUSES[kitchenStatus].background}`}>
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <div className="d-flex align-items-center gap-2">
                            <div className="avatar rounded-circle bg-white">
                                <Icon name="hand-platter" className="fs-24 text-dark" />
                            </div>
                            <p className="mb-0 text-white fw-semibold fs-14">
                                {order.customerName}
                                <span className="fs-13 fw-normal d-block mt-1">{toTitleCase(order.orderType)}</span>
                            </p>
                        </div>
                        <span className="badge bg-white text-center text-dark">{order.orderNumber}</span>
                    </div>
                </Card.Header>
                <Card.Body className="border-bottom " style={{ flex: 0 }}>
                    <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                        <h6 className="mb-0 fw-normal fs-14">
                            Token No : <span className="fw-semibold">{order.tokenNo ? order.tokenNo : ' - '}</span>
                        </h6>
                        <p className="mb-0 fw-normal text-dark">{formatDateTimeKitchen(order.orderedAt)}</p>
                    </div>
                </Card.Body>
                <Card.Body>
                    <div className="orders-list mb-4">
                        {order.items.map((item) => (
                            <KitchenOrderItemRow key={item.id} item={item} />
                        ))}
                    </div>
                </Card.Body>

                {/* ── Delayed warning banner ───────────────────────────── */}
                {kitchenStatus === 'delayed' && (
                    <div className="bg-warning bg-opacity-10 border-top border-bottom border-warning px-3 py-2 d-flex align-items-center gap-2 delayed-banner">
                        <Icon name="clock-alert" className="text-warning fs-16" />
                        <span className="text-warning fw-semibold fs-13">Order Delayed</span>
                    </div>
                )}

                {/* ── Progress bar & timer ──────────────────────────────── */}
                <div className="d-flex align-items-center justify-content-between gap-3 p-3">
                    <div className="progress-item">
                        <div
                            className={`progress-bar ${progressBarClasses}`}
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                    <p className="mb-0 fw-normal d-flex align-items-center">
                        <Icon name="clock" className="me-1" />
                        {timerState === 'idle' ? '00:00' : formattedTime}
                    </p>
                </div>

                {/* ── Footer actions ────────────────────────────────────── */}
                <Card.Footer className="d-flex align-items-center justify-content-between gap-2 pt-0 border-0 flex-wrap flex-xl-nowrap">
                    {!isCompleted && (
                        <>
                            <Button
                                className={`btn-light w-100 timer-btn ${startCookingMutation.isPending || markKitchenCompleteMutation.isPending || timerExpired ? 'disabled' : ''}`}
                                onClick={handlePlayClick}
                                disabled={startCookingMutation.isPending || markKitchenCompleteMutation.isPending || timerExpired}
                            >
                                {startCookingMutation.isPending && timerState === 'idle' ? (
                                    <Spinner size="sm" className="me-2" />
                                ) : (
                                    <Icon name={playButtonIcon} className="me-2" />
                                )}
                                <span className="label">{playButtonLabel}</span>
                                <span className="ps-1 fw-semibold time">
                                    {timerState === 'idle' ? '00:00' : formattedTime}
                                </span>
                            </Button>

                            <Button
                                className="btn-outline-success w-100"
                                onClick={handleMarkDone}
                                disabled={startCookingMutation.isPending || markKitchenCompleteMutation.isPending}
                            >
                                {markKitchenCompleteMutation.isPending ? (
                                    <Spinner size="sm" className="me-2" />
                                ) : (
                                    <Icon name="check-check" className="me-2" />
                                )}
                                <span>Mark Done</span>
                            </Button>
                        </>
                    )}
                    {isCompleted && (
                        <div className="w-100 text-center text-muted py-2 fw-semibold">
                            {kitchenStatus === 'completed' ? 'Completed' : 'Cancelled'}
                        </div>
                    )}
                </Card.Footer>
            </Card>

            {/* ── Minutes input modal ───────────────────────────────────── */}
            <MinutesInputModal
                show={showMinutesModal}
                onHide={() => setShowMinutesModal(false)}
                onConfirm={handleConfirmMinutes}
                minutesInput={minutesInput}
                onMinutesChange={setMinutesInput}
                isLoading={startCookingMutation.isPending}
                orderNumber={order.orderNumber}
                customerName={order.customerName}
            />

            {/* ── Confirm Mark Done modal ──────────────────────────────── */}
            <ConfirmDoneModal
                show={showConfirmDoneModal}
                onHide={() => setShowConfirmDoneModal(false)}
                onConfirm={confirmMarkDone}
                isLoading={markKitchenCompleteMutation.isPending}
                orderNumber={order.orderNumber}
                customerName={order.customerName}
            />
        </Col>
    );
};

export default OrderKitchenCard;
