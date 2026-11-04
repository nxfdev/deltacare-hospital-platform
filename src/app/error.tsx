"use client";

import React from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-[#f2f2f2] px-4 py-16">
      <div className="max-w-xl w-full bg-white rounded-2xl border border-[#d6d6d6] p-8 text-center shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-[#dc2626]">
          DeltaCare Platform Error
        </p>
        <h1 className="mt-2 mc-serif text-3xl text-[#080808]">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-[#686868]">
          {error.message ||
            "An unexpected error occurred while loading this view. For urgent assistance, call 10678."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="mc-btn-primary">
            Try Again
          </button>
          <Link href="/" className="mc-btn-secondary">
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}

