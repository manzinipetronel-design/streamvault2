export const REDIRECT_RECOVERY_WINDOW_MS = 60_000;

export interface RedirectRecoveryState {
  recoveries: number;
  lastRecoveryAt: number;
}

export interface RedirectRecoveryResult extends RedirectRecoveryState {
  shouldRecover: boolean;
}

export function evaluateRedirectRecovery(
  state: RedirectRecoveryState,
  now: number,
  maxRecoveries: number,
): RedirectRecoveryResult {
  const recoveries =
    now - state.lastRecoveryAt > REDIRECT_RECOVERY_WINDOW_MS
      ? 0
      : state.recoveries;
  const shouldRecover = recoveries < maxRecoveries;

  return {
    shouldRecover,
    recoveries: shouldRecover ? recoveries + 1 : recoveries,
    lastRecoveryAt: now,
  };
}
