export interface ChartPlaceholderProps {
    id: string;
    height?: number;
    className?: string;
}

/**
 * The original template renders charts with ApexCharts (assets/plugins/apexchart),
 * a JS plugin, not an HTML tag — so there is no 1:1 react-bootstrap equivalent to
 * convert it to. This placeholder keeps the same mount id/layout; wire up
 * `react-apexcharts` (or your chart lib of choice) against `id` to restore the
 * real chart. See the "Vấn đề chưa xử lý" list for details.
 */
const ChartPlaceholder = ({ id, height = 300, className = '' }: ChartPlaceholderProps) => (
    <div
        id={id}
        className={`d-flex align-items-center justify-content-center text-muted border rounded bg-light-subtle ${className}`}
        style={{ minHeight: height }}
    >
        Chart placeholder (#{id}) — hook up ApexCharts here
    </div>
);

export default ChartPlaceholder;
