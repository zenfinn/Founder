export const FOUNDER_PRO_STRIPE_PRODUCT_ID =
  process.env.STRIPE_FOUNDER_PRO_PRODUCT_ID ??
  process.env.NEXT_PUBLIC_FOUNDER_PRO_STRIPE_PRICE_OR_PRODUCT_ID ??
  "prod_UYfGh1P7PJkCin";

export async function resolveFounderProCheckoutPriceId(stripe, priceOrProductId) {
  const id = String(priceOrProductId ?? FOUNDER_PRO_STRIPE_PRODUCT_ID).trim();

  if (!id) {
    throw new Error("Founder Pro Produkt-ID fehlt.");
  }

  if (id.startsWith("price_")) {
    return id;
  }

  if (!id.startsWith("prod_")) {
    throw new Error("Ungültige Stripe Produkt- oder Preis-ID für Founder Pro.");
  }

  const product = await stripe.products.retrieve(id, { expand: ["default_price"] });

  if (typeof product.default_price === "string" && product.default_price) {
    return product.default_price;
  }

  if (product.default_price && typeof product.default_price === "object" && product.default_price.id) {
    return product.default_price.id;
  }

  const prices = await stripe.prices.list({
    product: id,
    active: true,
    limit: 10,
  });

  const recurringPrice = prices.data.find((price) => price.type === "recurring") ?? prices.data[0];

  if (!recurringPrice?.id) {
    throw new Error("Kein aktiver Preis für Founder Pro gefunden.");
  }

  return recurringPrice.id;
}
