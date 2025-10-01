"use client";

export default function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 text-sm">
      {message}
    </div>
  );
}
