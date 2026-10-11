import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ProfileSelectorModal from "@/components/ProfileSelectorModal";

const mocks = vi.hoisted(() => ({
  selectProfile: vi.fn(),
  rpc: vi.fn(),
  pathname: "/",
  user: { id: "user-1" } as { id: string } | null,
  authLoading: false,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: mocks.user,
    loading: mocks.authLoading,
  }),
}));

vi.mock("@/contexts/ProfileContext", () => ({
  useProfile: () => ({
    activeProfile: null,
    previousProfile: {
      id: "kids",
      name: "Kids",
      avatar: "/kids.png",
      isKids: true,
    },
    selectProfile: mocks.selectProfile,
    profiles: [
      {
        id: "adult",
        name: "Adult",
        avatar: "/adult.png",
        isKids: false,
      },
      {
        id: "kids",
        name: "Kids",
        avatar: "/kids.png",
        isKids: true,
      },
    ],
    hasHydrated: true,
    profileError: null,
  }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ rpc: mocks.rpc }),
}));

describe("ProfileSelectorModal", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    mocks.selectProfile.mockReset();
    mocks.rpc.mockReset();
    mocks.pathname = "/";
    mocks.user = { id: "user-1" };
    mocks.authLoading = false;
  });

  it("does not cover the login page", () => {
    mocks.pathname = "/login";
    render(<ProfileSelectorModal />);

    expect(screen.queryByText("Who's watching?")).not.toBeInTheDocument();
  });

  it("does not show a profile prompt before a user signs in", () => {
    mocks.user = null;
    render(<ProfileSelectorModal />);

    expect(screen.queryByText("Who's watching?")).not.toBeInTheDocument();
  });

  it("requires a valid parental PIN before switching out of Kids mode", async () => {
    const user = userEvent.setup();
    mocks.rpc
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({ data: false, error: null })
      .mockResolvedValueOnce({ data: true, error: null });
    render(<ProfileSelectorModal />);

    await user.click(screen.getByRole("button", { name: "Adult" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(mocks.rpc).toHaveBeenNthCalledWith(1, "has_kids_pin");

    const pinInput = screen.getByLabelText(/parental PIN/i);
    await user.type(pinInput, "1234");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That PIN is not correct.",
    );
    expect(mocks.selectProfile).not.toHaveBeenCalled();

    await user.clear(pinInput);
    await user.type(pinInput, "5678");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => {
      expect(mocks.selectProfile).toHaveBeenCalledWith(
        expect.objectContaining({ id: "adult" }),
      );
    });
    expect(mocks.rpc).toHaveBeenLastCalledWith("verify_kids_pin", {
      p_pin: "5678",
    });
  });

  it("allows continuing in Kids mode when no PIN is configured", async () => {
    const user = userEvent.setup();
    mocks.rpc.mockResolvedValueOnce({ data: false, error: null });
    render(<ProfileSelectorModal />);

    await user.click(screen.getByRole("button", { name: "Adult" }));
    await user.click(
      await screen.findByRole("button", { name: "Continue with Kids" }),
    );

    expect(mocks.selectProfile).toHaveBeenCalledWith(
      expect.objectContaining({ id: "kids" }),
    );
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });
});
