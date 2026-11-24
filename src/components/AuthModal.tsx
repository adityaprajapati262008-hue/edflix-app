"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { Play, Sparkles, Award, MessageSquare, ShieldCheck, Layers } from "lucide-react";

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  image?: string;
}

interface AuthModalProps {
  isOpen: boolean;
  fullScreen?: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
}

export default function AuthModal({
  isOpen,
  fullScreen = false,
  onClose,
  onAuthSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill in email and password.");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (password.trim().length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }

    const displayName =
      mode === "signup"
        ? name.trim()
        : email
            .split("@")[0]
            .replace(/[._-]/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());

    const user: UserProfile = {
      name: displayName,
      email: email.trim(),
      role: "Student • Pro Learner",
    };

    localStorage.setItem("edflix_user", JSON.stringify(user));
    onAuthSuccess(user);
    onClose();
  };

  const formCard = (
    <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#141414]/95 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.85)] backdrop-blur-xl sm:p-8">
      <div className="pointer-events-none absolute inset-x-10 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#E50914] to-transparent" />

      {!fullScreen && (
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg px-2 py-1 text-sm text-zinc-400 hover:bg-white/10 hover:text-white"
        >
          ✕
        </button>
      )}

      <div className="mb-5">
        <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#E50914]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#E50914]" /> EdFlix Account
        </div>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
          {mode === "signup" ? "Start your learning journey" : "Welcome back"}
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          {mode === "signup"
            ? "Create your free account to generate AI courses, track XP, and earn certificates."
            : "Sign in to continue your streak and saved courses."}
        </p>
      </div>

      <button
        type="button"
        onClick={() => signIn("google")}
        className="flex w-full items-center justify-center gap-3 rounded-lg bg-white py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </button>

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-[11px] font-medium tracking-wider text-zinc-500">OR WITH EMAIL</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {mode === "signup" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-300">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Aditya Prajapati"
              className="w-full rounded-lg border border-white/15 bg-black/60 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-[#E50914]"
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-300">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@gmail.com"
            className="w-full rounded-lg border border-white/15 bg-black/60 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-[#E50914]"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-300">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-white/15 bg-black/60 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-[#E50914]"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full rounded-lg bg-[#E50914] py-2.5 text-sm font-bold text-white shadow-lg shadow-red-600/25 transition hover:bg-[#f6121d]"
        >
          {mode === "signup" ? "Create Account & Start Learning" : "Sign In"}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-zinc-400">
        {mode === "signin" ? "New to EdFlix?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError("");
          }}
          className="font-semibold text-[#E50914] hover:underline"
        >
          {mode === "signin" ? "Create Account" : "Sign In"}
        </button>
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-[#0a0a0c] text-zinc-100">
        {/* Cinematic Netflix Red Ambient Glow */}
        <div
          className="pointer-events-none fixed inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 15%, rgba(229,9,20,0.22), transparent 42%), radial-gradient(circle at 85% 80%, rgba(229,9,20,0.12), transparent 45%)",
          }}
        />

        <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#E50914] shadow-lg shadow-red-600/30">
              <Play className="h-4 w-4 fill-white text-white" />
            </span>
            <span className="text-2xl font-black tracking-tight text-[#E50914]">EDFLIX</span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs font-medium text-zinc-300">
            <Layers className="h-3.5 w-3.5 text-[#E50914]" /> AI Smart Learning
          </span>
        </header>

        <main className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 py-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E50914]/35 bg-[#E50914]/10 px-3.5 py-1.5 text-xs font-semibold text-red-400">
              <Sparkles className="h-3.5 w-3.5" /> Binge-Worthy AI Courses
            </div>
            <h1 className="text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-5xl">
              Turn any topic into a{" "}
              <span className="text-[#E50914]">structured course</span> in seconds.
            </h1>
            <p className="max-w-lg text-sm leading-relaxed text-zinc-400 sm:text-base">
              No more endless YouTube rabbit holes. Pick 2 hours or 7 days — EdFlix builds a distraction-free roadmap, pairs every step with a focused video, and unlocks the next episode when you pass the quiz.
            </p>

            <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-[#141414]/90 p-4 transition duration-300 hover:-translate-y-1 hover:border-[#E50914]/50">
                <MessageSquare className="mb-2 h-4 w-4 text-[#E50914]" />
                <p className="text-xs font-semibold text-white">AI Doubt Solver</p>
                <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
                  Ask questions right beside the video.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#141414]/90 p-4 transition duration-300 hover:-translate-y-1 hover:border-amber-400/50">
                <Award className="mb-2 h-4 w-4 text-amber-400" />
                <p className="text-xs font-semibold text-white">Unlock Quizzes</p>
                <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
                  Active recall before moving ahead.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#141414]/90 p-4 transition duration-300 hover:-translate-y-1 hover:border-emerald-400/50">
                <ShieldCheck className="mb-2 h-4 w-4 text-emerald-400" />
                <p className="text-xs font-semibold text-white">Certificates</p>
                <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
                  Downloadable PDF on completion.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">{formCard}</div>
        </main>

        <footer className="relative z-10 py-6 text-center text-xs text-zinc-500">
          EdFlix · AI Smart Learning · NIET PBL · Group A-06 · SDG 4 & SDG 9
        </footer>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      {formCard}
    </div>
  );
}