import CountUp from "./CountUp";

const MetricCard = ({
  label,
  value,
  prefix = "",
  suffix = "",
  decimals = 2,
  subtext,
  variant = "default",
}) => {
  const valueColor =
    variant === "positive"
      ? "text-positive"
      : variant === "negative"
        ? "text-destructive"
        : "text-primary glow-cyan-sm";

  return (
    <div className="p-4 border rounded-lg card-gradient border-border">
      <p className="mb-1 text-xs tracking-wider uppercase font-body text-muted-foreground">
        {label}
      </p>

      <p className={`text-xl font-mono font-bold ${valueColor}`}>
        <CountUp
          end={value}
          prefix={prefix}
          suffix={suffix}
          decimals={decimals}
        />
      </p>

      {subtext && (
        <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>
      )}
    </div>
  );
};

export default MetricCard;
