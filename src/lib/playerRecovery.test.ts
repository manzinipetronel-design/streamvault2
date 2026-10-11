import { describe, expect, it } from "vitest";
import {
  evaluateRedirectRecovery,
  REDIRECT_RECOVERY_WINDOW_MS,
} from "@/lib/playerRecovery";

describe("evaluateRedirectRecovery", () => {
  it("allows redirects up to the configured recovery limit", () => {
    const result = evaluateRedirectRecovery(
      { recoveries: 2, lastRecoveryAt: 10_000 },
      20_000,
      3,
    );

    expect(result).toEqual({
      shouldRecover: true,
      recoveries: 3,
      lastRecoveryAt: 20_000,
    });
  });

  it("stops recovering when the rolling limit is exhausted", () => {
    const result = evaluateRedirectRecovery(
      { recoveries: 3, lastRecoveryAt: 20_000 },
      21_000,
      3,
    );

    expect(result).toEqual({
      shouldRecover: false,
      recoveries: 3,
      lastRecoveryAt: 21_000,
    });
  });

  it("resets the recovery counter after the quiet window", () => {
    const now = 20_000 + REDIRECT_RECOVERY_WINDOW_MS + 1;
    const result = evaluateRedirectRecovery(
      { recoveries: 3, lastRecoveryAt: 20_000 },
      now,
      3,
    );

    expect(result).toEqual({
      shouldRecover: true,
      recoveries: 1,
      lastRecoveryAt: now,
    });
  });
});
