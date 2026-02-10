// Volume discount tiers for PVA products
// Base price: ₱10 per unit

export const PRICING_TIERS = [
  { minQty: 300, discount: 0.17, label: "300+ units: 17% off" },
  { minQty: 200, discount: 0.15, label: "200+ units: 15% off" },
  { minQty: 100, discount: 0.10, label: "100+ units: 10% off" },
  { minQty: 1, discount: 0, label: "1–99 units: base price" },
];

export function getDiscount(totalUnits: number): number {
  for (const tier of PRICING_TIERS) {
    if (totalUnits >= tier.minQty) return tier.discount;
  }
  return 0;
}

export function getDiscountedTotal(unitPrice: number, quantity: number): {
  subtotal: number;
  discount: number;
  discountPct: number;
  total: number;
} {
  const subtotal = unitPrice * quantity;
  const discountPct = getDiscount(quantity);
  const discount = subtotal * discountPct;
  return { subtotal, discount, discountPct, total: subtotal - discount };
}
