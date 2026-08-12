"use client";

import { useState, type ReactNode } from "react";
import { ViewerApp } from "@/components/ViewerApp";

export function ToolPage({ heading, children }: { heading: string; children: ReactNode }) {
  const [active, setActive] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col bg-white dark:bg-black">
      {!active && (
        <header className="mx-auto max-w-2xl px-6 pb-6 pt-10 text-center">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{heading}</h1>
          <p className="mt-2 text-sm text-neutral-500">{children}</p>
        </header>
      )}
      <div className="min-h-0 flex-1 border-t border-neutral-200 dark:border-neutral-800">
        <ViewerApp onActiveChange={setActive} />
      </div>
    </div>
  );
}
