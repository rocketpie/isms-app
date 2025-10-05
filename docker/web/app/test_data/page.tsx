//app/test_data/page.tsx
// Description: Test Data page (server wrapper)
"use client";

import React from "react";
import TestDataForm from "./_components/TestDataForm";

export const dynamic = "force-dynamic";

export default async function TestDataPage() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Test Data</h1>
      <p className="text-sm text-muted-foreground">
        Fill the fields or pick a preset, then click <b>Add</b>. Creation is idempotent.
      </p>
      <TestDataForm />
    </main>
  );
}
