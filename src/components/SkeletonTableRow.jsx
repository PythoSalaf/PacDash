// Generic skeleton for table rows (used in Funding, PnL tabs)
const SkeletonTableRow = ({ cols = 6 }) => (
  <tr className="border-b border-border/50 animate-pulse">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="py-3">
        <div
          className="h-2.5 rounded bg-muted"
          style={{ width: `${50 + (i % 3) * 20}%` }}
        />
      </td>
    ))}
  </tr>
);

export default SkeletonTableRow;
