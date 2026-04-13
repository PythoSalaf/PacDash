import { useEffect, useState } from "react";

const CountUp = ({
  end,
  duration = 1200,
  prefix = "",
  suffix = "",
  decimals = 2,
  className,
}) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const startTime = performance.now();
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * end);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [end, duration]);

  const formatted =
    Math.abs(end) >= 1000
      ? value.toLocaleString("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : value.toFixed(decimals);

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};

export default CountUp;
