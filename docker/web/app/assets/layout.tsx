//app/assets/layout.tsx
//Description: adds AssetPageHeader to all asset pages
"use client";

import type { ReactNode } from "react";
import AssetPageHeader from "../_components/assetPageHeader";

export default function AssetsLayout({ children }: { children: ReactNode }) {
  return (
    // mx-auto: center via margin-inline:auto 
    // max-w-5xl: max width
    // p-4: some padding
    // grid gap-6: make some room between components
    <div className="mx-auto max-w-5xl p-4 grid gap-4">
      <div className="flex items-center justify-between">
        <AssetPageHeader />
      </div>
      {children}
    </div>
  );
}
