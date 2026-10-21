"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Provider, useDispatch } from "react-redux";
import { hydrate, readStoredSession } from "@/lib/session";
import { store, type AppDispatch } from "@/lib/store";

function Hydrate() {
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    dispatch(hydrate(readStoredSession()));
  }, [dispatch]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 2,
            refetchOnWindowFocus: false,
            staleTime: 20_000,
          },
        },
      }),
  );

  return (
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <Hydrate />
        {children}
      </QueryClientProvider>
    </Provider>
  );
}
