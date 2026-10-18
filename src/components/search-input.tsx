"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Instant search input with debounce. Fires onSearch after `delay` ms of idle typing.
 */
export function SearchInput({
  placeholder = "Search…",
  onSearch,
  className,
  autoFocus,
}: {
  placeholder?: string;
  onSearch: (q: string) => void;
  className?: string;
  autoFocus?: boolean;
}) {
  const [value, setValue] = React.useState("");
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const emit = React.useCallback(
    (q: string) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => onSearch(q), 180);
    },
    [onSearch]
  );

  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          emit(e.target.value);
        }}
        placeholder={placeholder}
        className="pl-9 pr-9"
        aria-label="Search"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => {
            setValue("");
            emit("");
          }}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
