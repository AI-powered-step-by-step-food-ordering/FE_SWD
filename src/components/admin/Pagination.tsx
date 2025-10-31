"use client";

import React from "react";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
};

export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const goto = (p: number) => {
    const next = Math.min(Math.max(1, p), totalPages);
    onPageChange(next);
  };

  // Build a compact list of page numbers with ellipses
  const buildPageList = (): (number | "...")[] => {
    const maxButtons = 7;
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "...")[] = [];
    const left = Math.max(2, page - 2);
    const right = Math.min(totalPages - 1, page + 2);
    pages.push(1);
    if (left > 2) pages.push("...");
    for (let p = left; p <= right; p++) pages.push(p);
    if (right < totalPages - 1) pages.push("...");
    pages.push(totalPages);
    return pages;
  };
  const pages = buildPageList();

  // If only one page and there's no page size control, hide the whole bar
  if (totalPages <= 1 && !onPageSizeChange) {
    return null;
  }

  const showPager = totalPages > 1;

  return (
    <div className={`mt-4 flex items-center ${showPager ? "justify-between" : "justify-end"}`}>
      {showPager && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goto(page - 1)}
            disabled={!canPrev}
            className={`rounded border px-3 py-1 ${canPrev ? "bg-white hover:bg-gray-50" : "cursor-not-allowed bg-gray-100 text-gray-400"}`}
          >
            Prev
          </button>
          {/* Numbered page buttons */}
          <div className="flex items-center gap-1">
            {pages.map((p, idx) =>
              p === "..." ? (
                <span key={`e-${idx}`} className="px-2 py-1 text-gray-500">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => goto(p)}
                  className={`rounded border px-3 py-1 ${p === page ? "border-green-600 bg-green-600 text-white" : "bg-white hover:bg-gray-50"}`}
                >
                  {p}
                </button>
              ),
            )}
          </div>
          <button
            type="button"
            onClick={() => goto(page + 1)}
            disabled={!canNext}
            className={`rounded border px-3 py-1 ${canNext ? "bg-white hover:bg-gray-50" : "cursor-not-allowed bg-gray-100 text-gray-400"}`}
          >
            Next
          </button>
          <span className="ml-2 text-sm text-gray-600">
            Page <span className="font-medium">{page}</span> / {totalPages}
          </span>
        </div>
      )}
      {onPageSizeChange && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            {[10, 20, 50].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
