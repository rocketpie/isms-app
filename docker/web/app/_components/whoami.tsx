//app/_components/whoami.tsx

"use client";
import { useEffect, useState } from "react";
import { postgrest } from "@/lib/browser/api-app";

export default function WhoAmI() {
  const [txt, setTxt] = useState("anonymous");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const who = await postgrest<{ email?: string; app_role?: string }>(
          "/rpc/whoami",
          { method: "POST" },
        );

        if (!alive) return;
        if (who && who?.email) {
          setTxt(`${who.email} (${who.app_role ?? "authenticated?"})`);
        }
      } catch {
        setTxt("anonymous");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return <span className="text-sm text-neutral-600">You: {txt}</span>;
}
