/**
 * Set right before a deliberate logout so that page guards (RequireCustomer / RequireAdmin),
 * which see the session turn to "guest", go to the logout destination instead of the login page
 * with `next=<current page>`.
 */
let pending: string | null = null;

export function markLogout(destination: string): void {
  pending = destination;
}

/** The logout destination, consumed once; `null` when the session ended for another reason. */
export function takeLogoutDestination(): string | null {
  const destination = pending;
  pending = null;
  return destination;
}
