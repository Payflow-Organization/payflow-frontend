"use client";
import React from "react";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MuiRegistry from "./MuiRegistry";

if (
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_USE_MOCK !== "false"
) {
  import("@/mocks").then(({ initMocks }) => initMocks());
}

let browserQueryClient: QueryClient | undefined;

function makeQueryClient(onAuthExpired: () => void): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60 * 1000 },
    },
    queryCache: new QueryCache({
      onError: (error: unknown) => {
        if ((error as { type?: string })?.type === "AUTH_EXPIRED") {
          onAuthExpired();
        }
      },
    }),
  });
}

function getQueryClient(onAuthExpired: () => void): QueryClient {
  if (typeof window === "undefined") return makeQueryClient(onAuthExpired);
  if (!browserQueryClient) browserQueryClient = makeQueryClient(onAuthExpired);
  return browserQueryClient;
}

export default function Providers({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const queryClient = getQueryClient(() => {
    if (window.location.pathname !== "/login") {
      window.location.replace("/login");
    }
  });

  return (
    <MuiRegistry>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </MuiRegistry>
  );
}
