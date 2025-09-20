// app/_components/whoami.tsx
"use client";

import { useQuery } from "@tanstack/react-query";

export default function WhoAmI() {
  const { data, isLoading } = useQuery({
    queryKey: ["whoami"],
    queryFn: async () => {
      const res = await fetch("/rpc/whoami", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Profile": "app",
          "Content-Profile": "app",
        },
        credentials: "include",
        body: "{}",
      });
      if (!res.ok) throw new Error("whoami failed");
      return res.json();
    },
  });

  if (isLoading) return <div>Loading…</div>;
  if (!data) return null;

  return (
    <div className="text-sm opacity-70">
      role: {data.app_role} · {data.email}
    </div>
  );
}
