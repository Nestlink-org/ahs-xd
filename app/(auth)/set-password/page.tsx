"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { setPasswordAction } from "@/actions/auth";
import { Eye, EyeOff, Check, X } from "lucide-react";

const REQUIREMENTS = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
  {
    label: "One special character",
    test: (p: string) => /[^A-Za-z0-9]/.test(p),
  },
];

function getStrength(password: string): number {
  return REQUIREMENTS.filter((r) => r.test(password)).length;
}

const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = [
  "",
  "bg-destructive",
  "bg-yellow-500",
  "bg-blue-500",
  "bg-primary",
];

export default function SetPasswordPage() {
  const [state, action, pending] = useActionState(setPasswordAction, undefined);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const strength = getStrength(password);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-14 w-14">
          <Image
            src="/logo.png"
            alt="AHS"
            fill
            sizes="56px"
            className="object-contain"
            priority
          />
        </div>
        <div className="text-center">
          <h1 className="font-realce text-3xl tracking-widest uppercase bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            AHS-XD
            <sup className="text-base tracking-normal text-muted-foreground ml-0.5">
              v2.7
            </sup>
          </h1>
          <p className="text-xs text-muted-foreground tracking-[0.2em] uppercase mt-0.5">
            Executive Dashboard
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl shadow-xl p-8 flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Set your password
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a strong password to secure your account
          </p>
        </div>

        <form action={action} className="flex flex-col gap-5">
          {/* Password */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 pr-10 bg-input/50"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showPw ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Strength bar */}
            {password.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        i <= strength ? STRENGTH_COLORS[strength] : "bg-border"
                      }`}
                    />
                  ))}
                </div>
                <p
                  className={`text-xs font-medium ${
                    strength <= 1
                      ? "text-destructive"
                      : strength === 2
                        ? "text-yellow-500"
                        : strength === 3
                          ? "text-blue-400"
                          : "text-primary"
                  }`}
                >
                  {STRENGTH_LABELS[strength]}
                </p>
              </div>
            )}

            {/* Requirements */}
            <div className="flex flex-col gap-1 mt-1">
              {REQUIREMENTS.map((req) => {
                const met = req.test(password);
                return (
                  <div key={req.label} className="flex items-center gap-2">
                    {met ? (
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                    )}
                    <span
                      className={`text-xs ${met ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {req.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Confirm */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <div className="relative">
              <Input
                id="confirm"
                name="confirm"
                type={showCf ? "text" : "password"}
                placeholder="••••••••"
                className="h-11 pr-10 bg-input/50"
                required
              />
              <button
                type="button"
                onClick={() => setShowCf((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showCf ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {state?.message && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
              <p className="text-sm text-destructive">{state.message}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={pending || strength < 4}
            className="h-11 font-semibold"
          >
            {pending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                Saving...
              </span>
            ) : (
              "Set password & continue"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
