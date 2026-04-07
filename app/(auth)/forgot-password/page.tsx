"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { forgotPasswordAction } from "@/actions/auth";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full h-11 font-semibold"
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
          Sending...
        </span>
      ) : (
        "Send reset code"
      )}
    </Button>
  );
}

export default function ForgotPasswordPage() {
  const [state, action] = useActionState(forgotPasswordAction, undefined);

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
            Reset password
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your email and we&apos;ll send a verification code
          </p>
        </div>

        <form action={action} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              required
              className="h-11 bg-input/50 border-border/60"
            />
            {state?.message && (
              <p className="text-xs text-destructive">{state.message}</p>
            )}
          </div>

          <SubmitButton />
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Remember your password?{" "}
          <Link
            href="/login"
            className="text-primary font-medium hover:underline"
          >
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
