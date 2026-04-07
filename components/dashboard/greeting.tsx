"use client";

import { useEffect, useState } from "react";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
}

export function Greeting({ name }: { name: string }) {
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    setGreeting(getGreeting());

    // Update greeting if user stays on page across a time boundary
    const now = new Date();
    const msToNextHour =
      (60 - now.getMinutes()) * 60 * 1000 - now.getSeconds() * 1000;
    const t = setTimeout(() => setGreeting(getGreeting()), msToNextHour);
    return () => clearTimeout(t);
  }, []);

  if (!greeting) return null;

  const firstName = name?.split(" ")[0];

  return (
    <p className="text-sm text-muted-foreground">
      {greeting},{" "}
      <span className="font-semibold text-foreground">{firstName}!</span>
    </p>
  );
}
