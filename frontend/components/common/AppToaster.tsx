"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      richColors
      theme="dark"
      toastOptions={{
        classNames: {
          toast: "!bg-surface !border !border-border !text-foreground",
          title: "!text-foreground",
          description: "!text-zinc-300",
        },
      }}
    />
  );
}
