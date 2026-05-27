import { PricingOverlay } from "./PricingOverlay";
import { useSubscription } from "../context/SubscriptionContext";

/**
 * Zeigt Pricing-Overlay wenn Trial abgelaufen / kein Pro-Zugang (eingeloggte Nutzer)
 * oder wenn paywallOpen (z. B. Pro-Feature ohne Zugang).
 */
export function SubscriptionGuard({ language, children }) {
  const { user, loading, hasProAccess, paywallOpen, setPaywallOpen } = useSubscription();

  const trialLocked = Boolean(user) && !loading && !hasProAccess;
  const overlayOpen = paywallOpen || trialLocked;
  const dismissible = !trialLocked;

  return (
    <div className="relative min-h-0 min-w-0 flex-1">
      <div
        className={
          trialLocked ? "pointer-events-none min-h-screen select-none opacity-40 blur-[1px]" : "min-h-0"
        }
      >
        {children}
      </div>

      <PricingOverlay
        language={language}
        open={overlayOpen}
        dismissible={dismissible}
        onClose={() => {
          if (dismissible) setPaywallOpen(false);
        }}
      />
    </div>
  );
}
