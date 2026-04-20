export function amountToPaise(amount: string): number {
  const normalized = amount.trim();
  if (!normalized) {
    return 0;
  }

  const [wholePart, fractionPart = ""] = normalized.split(".");
  const safeWhole = Number.parseInt(wholePart || "0", 10);
  const safeFraction = Number.parseInt((fractionPart + "00").slice(0, 2) || "0", 10);
  return safeWhole * 100 + safeFraction;
}

export function formatInrFromPaise(amountPaise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    currencyDisplay: "symbol"
  }).format(amountPaise / 100);
}

