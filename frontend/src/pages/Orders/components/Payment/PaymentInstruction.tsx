type Props = {
    image: string;
    message: string;
};

export default function PaymentInstruction({ image, message }: Props) {
    return (
        <div className="mb-4 text-center p-4 border rounded d-flex align-items-center justify-content-center flex-column gap-2">
            <img src={image} alt={message} className="img-fluid d-block" />

            <span>{message}</span>
        </div>
    );
}
