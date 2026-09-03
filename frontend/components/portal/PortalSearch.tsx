"use client";

import { CornerDownLeft, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useId, useRef, useState } from "react";

type SearchResult = {
  id: string;
  category: string;
  title: string;
  subtitle?: string;
  href: string;
};

type SearchResponse = {
  query?: string;
  results?: SearchResult[];
  message?: string;
};

export function PortalSearch({ role }: { role: "member" | "admin" }) {
  const router = useRouter();
  const inputId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const endpoint =
    role === "admin" ? "/api/admin/search" : "/api/member/search";
  const placeholder =
    role === "admin"
      ? "Search members, content, billing..."
      : "Search learning, billing, support...";

  const runSearch = useEffectEvent(async (value: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${endpoint}?q=${encodeURIComponent(value.trim())}`,
      );
      const data = (await response.json()) as SearchResponse;
      if (!response.ok) {
        setResults([]);
        return;
      }
      setResults(data.results ?? []);
      setActiveIndex(0);
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    if (!open) return;
    const handle = window.setTimeout(() => {
      void runSearch(query);
    }, 180);
    return () => window.clearTimeout(handle);
  }, [open, query]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isShortcut =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (isShortcut) {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const goToResult = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    router.push(result.href);
  };

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-zinc-200 transition hover:border-gold/40"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Search size={15} aria-hidden="true" />
        <span>Search</span>
        <kbd className="ml-1 hidden rounded border border-border px-1.5 py-0.5 text-[10px] text-zinc-500 sm:inline-block">
          ⌘K
        </kbd>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Portal search"
          className="absolute right-0 z-50 mt-2 w-[min(92vw,420px)] overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
        >
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            <Search size={16} className="shrink-0 text-gold" aria-hidden="true" />
            <label htmlFor={inputId} className="sr-only">
              Search
            </label>
            <input
              id={inputId}
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActiveIndex((index) =>
                    results.length ? (index + 1) % results.length : 0,
                  );
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActiveIndex((index) =>
                    results.length
                      ? (index - 1 + results.length) % results.length
                      : 0,
                  );
                }
                if (event.key === "Enter" && results[activeIndex]) {
                  event.preventDefault();
                  goToResult(results[activeIndex]);
                }
              }}
              placeholder={placeholder}
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition hover:bg-background hover:text-gold"
              aria-label="Close search"
            >
              <X size={14} />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {loading ? (
              <p className="px-2 py-6 text-center text-sm text-zinc-500">
                Searching...
              </p>
            ) : results.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-zinc-500">
                No matches for “{query || "your search"}”.
              </p>
            ) : (
              Object.entries(grouped).map(([category, items]) => (
                <div key={category} className="mb-2">
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    {category}
                  </p>
                  <ul className="space-y-1">
                    {items.map((item) => {
                      const flatIndex = results.findIndex(
                        (result) => result.id === item.id,
                      );
                      const isActive = flatIndex === activeIndex;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onMouseEnter={() => setActiveIndex(flatIndex)}
                            onClick={() => goToResult(item)}
                            className={`flex w-full items-start justify-between gap-3 rounded-xl px-2.5 py-2 text-left transition ${
                              isActive
                                ? "bg-gold/10 text-white"
                                : "text-zinc-200 hover:bg-background"
                            }`}
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium">
                                {item.title}
                              </span>
                              {item.subtitle ? (
                                <span className="mt-0.5 block truncate text-xs text-zinc-500">
                                  {item.subtitle}
                                </span>
                              ) : null}
                            </span>
                            {isActive ? (
                              <CornerDownLeft
                                size={14}
                                className="mt-1 shrink-0 text-gold"
                                aria-hidden="true"
                              />
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
