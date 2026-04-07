"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { loginAction } from "@/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full h-11  font-semibold text-sm tracking-wide cursor-pointer"
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
          Verifying...
        </span>
      ) : (
        "Continue"
      )}
    </Button>
  );
}

export default function LoginPage() {
  const [state, action] = useActionState(loginAction, undefined);

  return (
    <div className="flex flex-col gap-8">
      {/* Logo + brand */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-14 w-14">
          <Image
            src="/logo.png"
            alt="AHS Logo"
            fill
            sizes="56px"
            className="object-contain"
            priority
          />
        </div>
        <div className="text-center">
          <h1 className="font-realce text-3xl tracking-widest uppercase bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            AHS-XD
            <span className="text-base tracking-normal text-muted-foreground align-super ml-0.5">
              v2.7
            </span>
          </h1>
          <p className="text-xs text-muted-foreground tracking-[0.2em] uppercase mt-0.5">
            Executive Dashboard
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-tl-4xl rounded-br-4xl border border-border/60 bg-card/60 backdrop-blur-xl shadow-xl p-8 flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Welcome back
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to your account to continue
          </p>
        </div>

        <form action={action} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              required
              className="h-11 bg-input/50 border-border/60 focus:border-primary/50 transition-colors"
            />
            {state?.errors?.email && (
              <p className="text-xs text-destructive">{state.errors.email}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="h-11 bg-input/50 border-border/60 focus:border-primary/50 transition-colors"
            />
            {state?.errors?.password && (
              <p className="text-xs text-destructive">
                {state.errors.password}
              </p>
            )}
          </div>

          {state?.message && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
              <p className="text-sm text-destructive">{state.message}</p>
            </div>
          )}

          <SubmitButton />
        </form>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border/50" />
          <span className="text-xs text-muted-foreground">secured access</span>
          <div className="h-px flex-1 bg-border/50" />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Access is restricted to authorized personnel only.
          <br />
          Contact your{" "}
          <span className="text-primary font-medium">
            system administrator
          </span>{" "}
          for access.
        </p>
      </div>
    </div>
  );
}
