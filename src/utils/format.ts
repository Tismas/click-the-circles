const SUFFIXES = ["", "k", "M", "B", "T", "Q"] as const;

export function formatNumber(value: number): string {
  if (value < 1000) {
    return Math.floor(value).toString();
  }

  let suffixIndex = 0;
  let num = value;

  while (num >= 1000 && suffixIndex < SUFFIXES.length - 1) {
    num /= 1000;
    suffixIndex++;
  }

  if (num >= 100) {
    return Math.floor(num) + SUFFIXES[suffixIndex];
  } else if (num >= 10) {
    return num.toFixed(1).replace(/\.0$/, "") + SUFFIXES[suffixIndex];
  } else {
    return num.toFixed(2).replace(/\.?0+$/, "") + SUFFIXES[suffixIndex];
  }
}

export function formatMoney(value: number): string {
  return `$${formatNumber(value)}`;
}
