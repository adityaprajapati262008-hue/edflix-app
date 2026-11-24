"use client";

import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import { Mic, MicOff, Send, X, Sparkles, Volume2 } from "lucide-react";

type AvatarState = "idle" | "listening" | "thinking" | "talking";

interface AIAvatar3DProps {
  contextTopic?: string;
  onVoiceTopic?: (topic: string) => void;
}

function RobotModel({ state }: { state: AvatarState }) {
  const headRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);

  useFrame((clockState, delta) => {
    const t = clockState.clock.getElapsedTime();

    if (headRef.current) {
      if (state === "thinking") {
        headRef.current.rotation.y += delta * 2.4;
        headRef.current.rotation.z = Math.sin(t * 4) * 0.12;
      } else if (state === "talking") {
        headRef.current.rotation.x = Math.sin(t * 8) * 0.14;
        headRef.current.rotation.y = Math.sin(t * 2) * 0.2;
        headRef.current.rotation.z = 0;
      } else if (state === "listening") {
        headRef.current.rotation.y = Math.sin(t * 3) * 0.15;
        headRef.current.rotation.x = -0.1;
      } else {
        headRef.current.rotation.y = Math.sin(t * 0.9) * 0.25;
        headRef.current.rotation.x = Math.cos(t * 0.7) * 0.06;
        headRef.current.rotation.z = 0;
      }
    }

    if (ringRef.current) {
      ringRef.current.rotation.z += delta * (state === "thinking" ? 3.5 : 1.0);
      ringRef.current.rotation.x = Math.PI / 2.4 + Math.sin(t * 1.5) * 0.15;
    }

    const pulse = state === "talking" ? 1 + Math.sin(t * 16) * 0.25 : 1;
    if (leftEyeRef.current && rightEyeRef.current) {
      leftEyeRef.current.scale.y = pulse;
      rightEyeRef.current.scale.y = pulse;
    }
  });

  const accentColor =
    state === "listening"
      ? "#f43f5e"
      : state === "thinking"
      ? "#fbbf24"
      : state === "talking"
      ? "#34d399"
      : "#22d3ee";

  return (
    <Float speed={2.5} rotationIntensity={0.25} floatIntensity={0.45}>
      <group ref={headRef}>
        {/* Main Metallic Head */}
        <mesh>
          <sphereGeometry args={[0.85, 32, 32]} />
          <meshStandardMaterial color="#0f172a" metalness={0.75} roughness={0.2} />
        </mesh>

        {/* Glass Visor */}
        <mesh position={[0, 0.04, 0.62]} scale={[1.15, 0.62, 0.45]}>
          <sphereGeometry args={[0.52, 24, 24]} />
          <meshStandardMaterial color="#020617" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Glowing Eyes */}
        <mesh ref={leftEyeRef} position={[-0.24, 0.08, 0.84]}>
          <capsuleGeometry args={[0.07, 0.14, 8, 16]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={2.2} />
        </mesh>
        <mesh ref={rightEyeRef} position={[0.24, 0.08, 0.84]}>
          <capsuleGeometry args={[0.07, 0.14, 8, 16]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={2.2} />
        </mesh>

        {/* Ear Pods */}
        <mesh position={[-0.88, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.18, 0.18, 0.16, 16]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.9} />
        </mesh>
        <mesh position={[0.88, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.18, 0.18, 0.16, 16]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.9} />
        </mesh>

        {/* Floating Halo Ring */}
        <mesh ref={ringRef} position={[0, 0, 0]}>
          <torusGeometry args={[1.22, 0.035, 16, 64]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={1.6} />
        </mesh>
      </group>
    </Float>
  );
}

export default function AIAvatar3D({ contextTopic, onVoiceTopic }: AIAvatar3DProps) {
  const [open, setOpen] = useState(false);
  const [avatarState, setAvatarState] = useState<AvatarState>("idle");
  const [input, setInput] = useState("");
  const [reply, setReply] = useState(
    "Hi! I'm your 3D EdFlix AI Guide. Tap the mic or type any doubt or topic!"
  );
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  const speakText = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text.slice(0, 220));
    utter.rate = 1.05;
    utter.onstart = () => setAvatarState("talking");
    utter.onend = () => setAvatarState("idle");
    window.speechSynthesis.speak(utter);
  };

  const askAvatar = async (question: string) => {
    const q = question.trim();
    if (!q) return;

    // Quick voice command: "learn <topic>" or "generate <topic>"
    const lower = q.toLowerCase();
    if (onVoiceTopic && (lower.startsWith("learn ") || lower.startsWith("generate "))) {
      const extracted = q.replace(/^(learn|generate)\s+/i, "").trim();
      if (extracted) {
        onVoiceTopic(extracted);
        const msg = `Loaded "${extracted}" into your course builder! Hit Build Roadmap when ready.`;
        setReply(msg);
        speakText(msg);
        return;
      }
    }

    setAvatarState("thinking");
    try {
      const res = await fetch("/api/doubt-solver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          courseTopic: contextTopic || "General Computer Science & Tech",
          moduleTitle: "3D AI Guide",
          moduleSummary: "Interactive voice and text assistant for EdFlix learners.",
        }),
      });
      const data = await res.json();
      const answer = data.answer || data.error || "I couldn't reach the AI engine right now.";
      setReply(answer);
      speakText(answer);
    } catch {
      setReply("Network error. Please try again.");
      setAvatarState("idle");
    }
  };

  const toggleVoice = () => {
    if (typeof window === "undefined") return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setReply("Voice input isn't supported in this browser. Try Chrome or type below!");
      return;
    }

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      setAvatarState("idle");
      return;
    }

    const rec = new SpeechRec();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setListening(true);
      setAvatarState("listening");
      setReply("Listening... speak your question or say 'Learn C Programming'.");
    };

    rec.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      setInput(transcript);
      setListening(false);
      if (transcript) askAvatar(transcript);
    };

    rec.onerror = () => {
      setListening(false);
      setAvatarState("idle");
      setReply("Couldn't catch that. Tap the mic and try again.");
    };

    rec.onend = () => {
      setListening(false);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const q = input;
    setInput("");
    askAvatar(q);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-80 overflow-hidden rounded-3xl border border-cyan-400/30 bg-[#080d1a]/95 shadow-[0_25px_70px_rgba(0,0,0,0.85)] backdrop-blur-2xl sm:w-96">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-200">
                3D AI Learning Avatar
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
              aria-label="Close AI Avatar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* 3D Interactive Avatar Viewport */}
          <div className="relative h-44 w-full bg-gradient-to-b from-[#040711] to-[#0b1326]">
            <Canvas camera={{ position: [0, 0, 3.2], fov: 45 }} dpr={[1, 1.5]}>
              <ambientLight intensity={0.6} />
              <pointLight position={[3, 3, 4]} intensity={1.4} color="#38bdf8" />
              <pointLight position={[-3, -2, 2]} intensity={0.9} color="#818cf8" />
              <RobotModel state={avatarState} />
            </Canvas>
            <span className="pointer-events-none absolute bottom-2 left-3 rounded-full border border-white/10 bg-black/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
              Status: {avatarState}
            </span>
          </div>

          {/* AI Response Bubble */}
          <div className="max-h-32 overflow-y-auto border-t border-white/10 bg-black/30 px-4 py-3 text-xs leading-relaxed text-slate-200">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase text-cyan-400">
              <Volume2 className="h-3 w-3" /> EdFlix AI
            </div>
            {reply}
          </div>

          {/* Voice + Text Controls */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-white/10 p-3">
            <button
              type="button"
              onClick={toggleVoice}
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition ${
                listening
                  ? "animate-pulse border-rose-400 bg-rose-500/20 text-rose-300"
                  : "border-white/10 bg-white/5 text-cyan-300 hover:border-cyan-400/50"
              }`}
              title="Speak with Voice"
              aria-label="Voice input"
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask or say 'Learn C++'..."
              className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400/60"
            />
            <button
              type="submit"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 transition hover:brightness-110"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating 3D Launcher Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-cyan-400/50 bg-[#060913] shadow-[0_0_30px_rgba(34,211,238,0.35)] transition hover:scale-105"
        aria-label="Toggle 3D AI Avatar"
        title="Talk to 3D AI Avatar"
      >
        <div className="pointer-events-none h-full w-full">
          <Canvas camera={{ position: [0, 0, 3.1], fov: 45 }} dpr={[1, 1.5]}>
            <ambientLight intensity={0.7} />
            <pointLight position={[3, 3, 4]} intensity={1.4} color="#38bdf8" />
            <RobotModel state={open ? avatarState : "idle"} />
          </Canvas>
        </div>
      </button>
    </div>
  );
}