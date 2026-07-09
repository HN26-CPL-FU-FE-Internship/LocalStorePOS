import ProgressBar from "react-bootstrap/ProgressBar";
import type { BootstrapVariant } from "../../../types";

export interface ProgressStatProps {
  rank: number;
  label: string;
  value: number | string;
  percent: number;
  variant: BootstrapVariant;
}

const ProgressStat = ({ rank, label, value, percent, variant }: ProgressStatProps) => (
  <div className="d-flex align-items-center justify-content-between mb-3">
    <h6 className="fs-14 fw-semibold mb-0">
      <span className="text-body">#{rank}</span> {label}
    </h6>
    <div className="d-flex align-items-center gap-4 w-50">
      <div className="progress-stacked progress-sm w-100">
        {/* `variant` also accepts the template's custom colors (purple/orange/indigo),
            which aren't part of react-bootstrap's built-in Variant type, hence the cast. */}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <ProgressBar now={percent} variant={variant} className="w-100" />
      </div>
      <p className="fs-14 text-dark fw-medium mb-0">{value}</p>
    </div>
  </div>
);

export default ProgressStat;
