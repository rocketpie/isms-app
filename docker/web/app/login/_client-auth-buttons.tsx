//app/login/_client-auth-buttons.tsx

"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { auth } from "@/lib/auth";

export default function ClientAuthButtons() {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);
  if (email) {
    return (
      <button
        onClick={async () => {
          await auth.signOut();
          location.assign("/"); // full refresh clears auth-bound queries
        }}
        className="text-sm px-3 py-1.5 rounded-lg border bg-white hover:bg-neutral-50"
      >
        Logout
      </button>
    );
  }
  return (
    <Link
      href="/login"
      className="text-sm px-3 py-1.5 rounded-lg border bg-white hover:bg-neutral-50"
    >
      Login
    </Link>
  );
}
