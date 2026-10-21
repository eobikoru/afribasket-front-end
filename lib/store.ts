import { configureStore } from "@reduxjs/toolkit";
import { sessionReducer, writeStoredSession } from "./session";

export const store = configureStore({
  reducer: { session: sessionReducer },
});

if (typeof window !== "undefined") {
  store.subscribe(() => {
    writeStoredSession(store.getState().session);
  });
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
