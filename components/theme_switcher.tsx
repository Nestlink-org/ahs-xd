"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const options = [
    { value: "system", icon: Monitor, label: "System" },
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
  ];

  return (
    <div className="flex items-center gap-1 rounded-full bg-muted p-1 w-max">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          aria-label={label}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors cursor-pointer
            ${
              theme === value
                ? "bg-background text-foreground shadow"
                : "text-muted-foreground hover:bg-background/50"
            }`}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
