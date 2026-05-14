interface CustomDotProps {
  cx: number;
  cy: number;
  index: number;
  dataLength: number;
}

export function CustomDot({ cx, cy, index, dataLength }: CustomDotProps) {
  const isLast = index === dataLength - 1;
  return isLast ? (
    <circle
      cx={cx}
      cy={cy}
      r={3.5}
      fill="#16a085"
      stroke="#16a085"
      strokeWidth={1.5}
    />
  ) : (
    <circle
      cx={cx}
      cy={cy}
      r={3}
      fill="white"
      stroke="#16a085"
      strokeWidth={1.5}
    />
  );
}
