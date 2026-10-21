import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const KEY = "afribasket.shop.session";

export type SessionState = {
  accessToken: string | null;
  refreshToken: string | null;
  cartToken: string | null;
  hydrated: boolean;
};

const initialState: SessionState = {
  accessToken: null,
  refreshToken: null,
  cartToken: null,
  hydrated: false,
};

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    hydrate(_state, action: PayloadAction<SessionState>) {
      return action.payload;
    },
    setSession(
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string }>,
    ) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    setCartToken(state, action: PayloadAction<string | null>) {
      state.cartToken = action.payload;
    },
    clearSession(state) {
      state.accessToken = null;
      state.refreshToken = null;
    },
  },
});

export const { hydrate, setSession, setCartToken, clearSession } = sessionSlice.actions;
export const sessionReducer = sessionSlice.reducer;

export function readStoredSession(): SessionState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...initialState, hydrated: true };
    const parsed = JSON.parse(raw) as Partial<SessionState>;
    return {
      accessToken: typeof parsed.accessToken === "string" ? parsed.accessToken : null,
      refreshToken: typeof parsed.refreshToken === "string" ? parsed.refreshToken : null,
      cartToken: typeof parsed.cartToken === "string" ? parsed.cartToken : null,
      hydrated: true,
    };
  } catch {
    return { ...initialState, hydrated: true };
  }
}

export function writeStoredSession(state: SessionState) {
  if (typeof window === "undefined" || !state.hydrated) return;
  localStorage.setItem(
    KEY,
    JSON.stringify({
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      cartToken: state.cartToken,
    }),
  );
}

export const CHECKOUT_KEY = "afribasket.checkout";

export type CheckoutMemory = {
  orderNumber: string;
  reservationExpiresAt: string | null;
  email?: string;
  providerReference?: string;
};

export function rememberCheckout(value: CheckoutMemory) {
  sessionStorage.setItem(CHECKOUT_KEY, JSON.stringify(value));
}

export function recallCheckout(): CheckoutMemory | null {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_KEY);
    return raw ? (JSON.parse(raw) as CheckoutMemory) : null;
  } catch {
    return null;
  }
}
