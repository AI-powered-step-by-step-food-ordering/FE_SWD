export function compactFormat(value: number) {
  const formatter = new Intl.NumberFormat("en", {
    notation: "compact",
    compactDisplay: "short",
  });

  return formatter.format(value);
}

export function standardFormat(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Format number as Vietnamese Đồng without decimals, with optional suffix
export function formatVND(value: number, withSuffix: boolean = true) {
  const rounded = Math.round(Number(value || 0));
  const formatted = rounded.toLocaleString('vi-VN');
  return withSuffix ? `${formatted} đ` : formatted;
}