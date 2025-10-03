//app/assets/layout.tsx
//Description: adds AssetPageHeader to all asset pages
"use client";

import type { ReactNode } from "react";
import AssetPageHeader from "../_components/assetPageHeader";

export default function AssetsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <AssetPageHeader />
      </div>
      {children}
    </div>
  );
}
