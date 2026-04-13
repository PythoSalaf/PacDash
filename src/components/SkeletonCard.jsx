// Market card skeleton — matches the exact layout of the live market card
const SkeletonCard = () => (
  <div className="p-4 border rounded-lg animate-pulse card-gradient border-border">
    {/* Symbol + change % row */}
    <div className="flex justify-between items-center mb-2">
      <div className="flex items-center gap-2">
        <div className="w-10 h-3.5 rounded bg-muted" />
        <div className="w-16 h-2.5 rounded bg-muted/60" />
      </div>
      <div className="w-12 h-3 rounded bg-muted" />
    </div>

    {/* Mark price */}
    <div className="w-28 h-5 mb-3 rounded bg-muted" />

    {/* Open Interest bar */}
    <div className="mb-2">
      <div className="flex justify-between mb-1">
        <div className="w-20 h-2 rounded bg-muted/60" />
        <div className="w-10 h-2 rounded bg-muted/60" />
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full w-2/3 rounded-full bg-muted/80" />
      </div>
    </div>

    {/* Funding + volume row */}
    <div className="flex justify-between items-center mb-3">
      <div className="w-20 h-2.5 rounded bg-muted" />
      <div className="w-12 h-5 rounded-full bg-muted" />
    </div>

    {/* Sparkline placeholder */}
    <div className="h-8 rounded bg-muted/40" />
  </div>
);

export default SkeletonCard;
