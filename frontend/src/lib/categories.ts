export const categories = ["Food", "Transport", "Shopping", "Bills", "Health", "Other"] as const;

export type Category = (typeof categories)[number];

