//app/maps/editor/page.tsx
 
import { Suspense } from "react";
import { MapEditorPageClient } from "./page.client";

export default function Page() {
  return (
    <Suspense fallback={null /* or a small skeleton */}>
      <MapEditorPageClient />
    </Suspense>
  );
}
