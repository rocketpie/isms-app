//app/error.tsx

"use client";
export default function Error({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <div className="p-4 rounded-xl border bg-white">
      <h2 className="font-semibold">Something went wrong</h2>
      <pre className="text-sm text-neutral-700 whitespace-pre-wrap">
        {error.message}
      </pre>
    </div>
  );
}
