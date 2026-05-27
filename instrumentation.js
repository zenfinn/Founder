export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertStripeEnvAtStartup } = await import("./lib/stripe-env.js");
    assertStripeEnvAtStartup();
  }
}
