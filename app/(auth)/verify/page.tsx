"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useActionState } from "react";
import Image from "next/image";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { verifyOtpAction, resendOtpAction } from "@/actions/auth";

const OTP_EXPIRY_SECONDS = 120;

export default function VerifyPage() {
  const [state, action, pending] = useActionState(verifyOtpAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const [secondsLeft, setSecondsLeft] = useState(OTP_EXPIRY_SECONDS);
  const [expired, setExpired] = useState(false);
  const [resendPending, startResend] = useTransition();
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  useEffect(() => {
    if (secondsLeft <= 0) {
      setExpired(true);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  function handleOtpComplete(value: string) {
    if (value.length === 4 && !expired) {
      formRef.current?.requestSubmit();
    }
  }

  function handleResend() {
    startResend(async () => {
      const result = await resendOtpAction();
      if (result.message) {
        setResendMsg(result.message);
      } else {
        setResendMsg("Code resent — check your email.");
        setSecondsLeft(OTP_EXPIRY_SECONDS);
        setExpired(false);
      }
    });
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeDisplay = `${minutes}:${String(seconds).padStart(2, "0")}`;

  // colour shifts: green → yellow → red
  const timerColor =
    secondsLeft > 60
      ? "text-primary"
      : secondsLeft > 30
        ? "text-yellow-500"
        : "text-destructive";

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
        {/* Icon + heading */}
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <svg
              className="h-5 w-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground">
              Check your email
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              We sent a 4-digit code to your email address
            </p>
          </div>
        </div>

        {/* Countdown */}
        <div className="flex flex-col items-center gap-1">
          {expired ? (
            <p className="text-sm font-medium text-destructive">Code expired</p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">
                Code expires in
              </p>
              <span
                className={`text-2xl font-mono font-bold tabular-nums ${timerColor}`}
              >
                {timeDisplay}
              </span>
              {/* Progress bar */}
              <div className="w-full h-1 rounded-full bg-border/50 mt-1 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${(secondsLeft / OTP_EXPIRY_SECONDS) * 100}%`,
                    backgroundColor:
                      secondsLeft > 60
                        ? "var(--primary)"
                        : secondsLeft > 30
                          ? "#eab308"
                          : "var(--destructive)",
                  }}
                />
              </div>
            </>
          )}
        </div>

        <form ref={formRef} action={action} className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-4">
            <InputOTP
              maxLength={4}
              name="otp"
              onComplete={handleOtpComplete}
              disabled={pending || expired}
            >
              <InputOTPGroup className="gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <InputOTPSlot
                    key={i}
                    index={i}
                    className="h-14 w-14 aspect-square border border-border bg-input/50 text-xl font-bold last:border data-[active=true]:border-primary/60 data-[active=true]:ring-primary/20 transition-all"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>

            {pending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-4 w-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                Verifying code...
              </div>
            )}

            {state?.message && (
              <div className="w-full rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
                <p className="text-sm text-destructive text-center">
                  {state.message}
                </p>
              </div>
            )}
          </div>

          <button type="submit" className="hidden" aria-hidden="true" />
        </form>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border/50" />
          <span className="text-xs text-muted-foreground">
            auto-submits on completion
          </span>
          <div className="h-px flex-1 bg-border/50" />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Didn&apos;t receive a code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendPending}
            className="text-primary font-medium hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendPending ? "Sending..." : "Resend code"}
          </button>
          {resendMsg && (
            <span
              className={`block mt-1 ${resendMsg.includes("resent") ? "text-primary" : "text-destructive"}`}
            >
              {resendMsg}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
