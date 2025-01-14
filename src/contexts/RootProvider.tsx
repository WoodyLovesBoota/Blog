"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const RootProvider = (props: React.PropsWithChildren) => {
  const { children } = props;
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export default RootProvider;
