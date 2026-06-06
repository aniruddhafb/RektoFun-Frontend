"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, Check, Mail, Sparkles, Trophy, Zap } from "lucide-react";

const floatingAssets = [
  {
    src: "/scribbles/btc.png",
    alt: "Bitcoin",
    className:
      "left-4 top-16 w-16 rotate-[-12deg] opacity-75 animate-airdrop sm:left-10 sm:top-20 sm:w-20 lg:left-24 lg:w-24",
  },
  {
    src: "/scribbles/dollars.png",
    alt: "Dollars",
    className:
      "right-4 top-20 w-20 rotate-[10deg] opacity-80 animate-pop-in delay-300 sm:right-12 sm:w-24 lg:right-28 lg:top-24 lg:w-28",
  },
  {
    src: "/scribbles/coins.png",
    alt: "Coins",
    className:
      "bottom-20 left-5 w-20 opacity-70 animate-float-wavy sm:left-14 sm:w-24 lg:left-32 lg:w-28",
  },
  {
    src: "/scribbles/stars.png",
    alt: "Stars",
    className:
      "bottom-24 right-8 w-16 opacity-75 animate-float-gentle sm:right-16 sm:w-20 lg:right-36 lg:w-24",
  },
];

const betaPerks = [
  {
    icon: Zap,
    title: "Early Arenas",
    body: "Enter new prediction battles before the public lobby opens.",
  },
  {
    icon: Trophy,
    title: "Master Status",
    body: "Get first access to beta-only rewards, drops, and leaderboard flex.",
  },
  {
    icon: Sparkles,
    title: "Shape The Game",
    body: "Help tune the flows, markets, and spicy little details before launch.",
  },
];

export default function BetaPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "verify">("email");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.rekto.fun";

  const handleSubmitEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setStatus("error");
      setErrorMessage("Enter a valid email so we can save your beta spot.");
      return;
    }

    setLoading(true);
    setStatus("idle");
    try {
      const res = await fetch(`${API_BASE_URL}/email/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      if (!res.ok) throw new Error(await res.text());

      setStep("verify");
      setStatus("idle");
    } catch (e: any) {
      setStatus("error");
      setErrorMessage(e.message || "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (otp.length !== 6) {
      setStatus("error");
      setErrorMessage("Please enter a 6-digit code.");
      return;
    }

    setLoading(true);
    setStatus("idle");
    try {
      const res = await fetch(`${API_BASE_URL}/email/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, otp }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Invalid verification code.");
      }

      setStatus("success");
    } catch (e: any) {
      setStatus("error");
      setErrorMessage(e.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-[#f3e1d7] px-4 py-10 sm:px-6 lg:px-8">

      {floatingAssets.map((asset) => (
        <Image
          key={asset.src}
          src={asset.src}
          alt={asset.alt}
          width={160}
          height={160}
          className={`pointer-events-none absolute z-0 hidden select-none sm:block ${asset.className}`}
          priority
        />
      ))}

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-160px)] w-full max-w-6xl flex-col items-center justify-center gap-10">
        <div className="max-w-4xl text-center">

          <h1 className="animate-airdrop text-5xl font-black leading-[0.95] text-black sm:text-6xl md:text-7xl lg:text-8xl">
            Join The
            <span className="block text-[#e85a2d] drop-shadow-[2px_2px_0_#111]">
              Rekto Beta
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-7 text-gray-800 sm:text-lg lg:text-xl">
            Get early access to RektoFun&apos;s PvP prediction battleground.
            Drop your email and be first in line when the gates open.
          </p>
        </div>

        <div className="grid w-full items-stretch gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="border-2 border-black bg-white p-4 shadow-[5px_5px_0_#111] sm:p-6 lg:p-8">
            <form
              onSubmit={step === "email" ? handleSubmitEmail : handleSubmitOtp}
              className="flex flex-col gap-4"
            >
              {step === "email" ? (
                <>
                  <label
                    htmlFor="beta-email"
                    className="text-sm font-bold uppercase tracking-[0.14em] text-gray-700"
                  >
                    Email ID
                  </label>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative min-w-0 flex-1">
                      <Mail
                        aria-hidden="true"
                        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500"
                      />
                      <input
                        id="beta-email"
                        type="email"
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          setStatus("idle");
                        }}
                        placeholder="you@arena.com"
                        className="h-14 w-full border-2 border-black bg-[#fffaf6] pl-12 pr-4 text-base font-semibold text-black outline-none transition focus:bg-white focus:shadow-[0_0_0_4px_rgba(232,90,45,0.2)]"
                        autoComplete="email"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex h-14 shrink-0 items-center justify-center gap-2 border-2 border-black bg-black px-6 text-sm font-bold uppercase tracking-[0.08em] text-white shadow-[4px_4px_0_#e85a2d] transition hover:-translate-y-1 hover:shadow-[6px_6px_0_#e85a2d] active:translate-y-0 active:shadow-[2px_2px_0_#e85a2d] disabled:opacity-50"
                    >
                      {loading ? "Sending..." : "Join Waitlist"}
                      {!loading && <ArrowRight aria-hidden="true" className="h-4 w-4" />}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="beta-otp"
                      className="text-sm font-bold uppercase tracking-[0.14em] text-gray-700"
                    >
                      Verification Code
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("email");
                        setStatus("idle");
                      }}
                      className="text-xs font-bold uppercase text-gray-500 hover:text-black underline"
                    >
                      Change Email
                    </button>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative min-w-0 flex-1">
                      <input
                        id="beta-otp"
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(event) => {
                          setOtp(event.target.value.replace(/\D/g, ""));
                          setStatus("idle");
                        }}
                        placeholder="6-digit code"
                        className="h-14 w-full border-2 border-black bg-[#fffaf6] px-4 text-base font-semibold text-black outline-none transition focus:bg-white focus:shadow-[0_0_0_4px_rgba(232,90,45,0.2)]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex h-14 shrink-0 items-center justify-center gap-2 border-2 border-black bg-black px-6 text-sm font-bold uppercase tracking-[0.08em] text-white shadow-[4px_4px_0_#e85a2d] transition hover:-translate-y-1 hover:shadow-[6px_6px_0_#e85a2d] active:translate-y-0 active:shadow-[2px_2px_0_#e85a2d] disabled:opacity-50"
                    >
                      {loading ? "Verifying..." : "Verify OTP"}
                      {!loading && <ArrowRight aria-hidden="true" className="h-4 w-4" />}
                    </button>
                  </div>
                </>
              )}

              {status === "error" && (
                <p className="text-sm font-semibold text-[#c2410c]">
                  {errorMessage}
                </p>
              )}

              {status === "success" && (
                <div className="flex items-center gap-2 border border-black bg-[#a8d85b] px-4 py-3 text-sm font-bold text-black animate-pop-in">
                  <Check aria-hidden="true" className="h-5 w-5" />
                  You're on the list. Watch your inbox for beta access.
                </div>
              )}
            </form>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {["No spam", "Early drops", "Beta rewards"].map((item) => (
                <div
                  key={item}
                  className="border border-black bg-[#f5d547] px-3 py-2 text-center text-xs font-black uppercase tracking-[0.12em] text-black"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {betaPerks.map((perk, index) => {
              const Icon = perk.icon;

              return (
                <div
                  key={perk.title}
                  className="group border-2 border-black bg-[#fffaf6] p-5 shadow-[3px_3px_0_#111] transition hover:-translate-y-1 hover:bg-white hover:shadow-[3px_3px_0_#111]"
                  style={{ animationDelay: `${index * 120 + 400}ms` }}
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center border-2 border-black bg-[#5ba8d8] text-black transition group-hover:rotate-6 group-hover:bg-[#f5d547]">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-black text-black">{perk.title}</h2>
                  <p className="mt-2 text-sm font-medium leading-6 text-gray-700">
                    {perk.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.14em] text-black">
          <span className="border border-black bg-white px-3 py-2 shadow-[2px_2px_0_#111] animate-float-gentle">
            Crypto
          </span>
          <span className="border border-black bg-[#e85a2d] px-3 py-2 text-white shadow-[2px_2px_0_#111] animate-float-updown">
            Sports
          </span>
          <span className="border border-black bg-[#a8d85b] px-3 py-2 shadow-[2px_2px_0_#111] animate-float-diagonal">
            Predictions
          </span>
        </div>
      </div>
    </section>
  );
}
