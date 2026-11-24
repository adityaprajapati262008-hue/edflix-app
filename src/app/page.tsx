"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Sparkles,
  Lock,
  CheckCircle2,
  MessageSquare,
  Send,
  BookOpen,
  Clock,
  Award,
  ArrowLeft,
  Loader2,
  Trash2,
  Zap,
  StickyNote,
  Trophy,
  Timer,
  Target,
  Flame,
  LogOut,
  Download,
  Search,
  Printer,
  ShieldCheck,
  X,
  Layers,
  ExternalLink,
  Compass,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { Course, CourseModule, QuizQuestion } from "@/types/course";
import AuthModal, { UserProfile } from "@/components/AuthModal";

const STORAGE_KEY = "edflix_saved_courses_v1";
const NOTES_KEY = "edflix_notes_v1";
const STATS_KEY = "edflix_stats_v2";
const USER_KEY = "edflix_user";

type ChatMessage = { role: "user" | "ai"; text: string };
type Stats = {
  quizCorrect: number;
  quizTotal: number;
  focusSeconds: number;
  visitDays: string[];
};
type Celebration = { kind: "module" | "course"; title: string; detail: string };

const CHIPS: { label: string; level: string; duration: string }[] = [
  { label: "C Programming", level: "Beginner", duration: "2 Hours Crash Course" },
  { label: "Next.js 14 Full-Stack", level: "Intermediate", duration: "1 Week" },
  { label: "DSA in C++", level: "Intermediate", duration: "1 Week" },
  { label: "System Design", level: "Advanced", duration: "3 Days" },
];

function dayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function streakFrom(days: string[]) {
  const set = new Set(days);
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 400; i++) {
    if (!set.has(dayKey(cursor))) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function mcq(question: string, options: string[], correctIndex: number): QuizQuestion {
  const shift = question.length % options.length;
  const rotated = options.map((_, i) => options[(i + shift) % options.length]);
  const nextCorrect = (correctIndex - shift + options.length) % options.length;
  return { question, options: rotated, correctIndex: nextCorrect };
}

function mod(
  id: number,
  title: string,
  summary: string,
  searchQuery: string,
  keyTakeaways: string[],
  videoId: string,
  channelTitle: string,
  quiz: QuizQuestion[],
  unlocked = false
): CourseModule {
  return {
    id,
    title,
    summary,
    searchQuery,
    keyTakeaways,
    videoId,
    channelTitle,
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    quiz,
    unlocked,
    completed: false,
  };
}

const STARTER_COURSES: Course[] = [
  {
    id: "starter_nextjs",
    topic: "Next.js 14 Full-Stack",
    level: "Intermediate",
    duration: "1 Week",
    description: "Ship a React interface, App Router pages, and a Node API without the tutorial rabbit holes.",
    createdAt: "2024-11-01T00:00:00.000Z",
    modules: [
      mod(
        1,
        "Next.js in 100 Seconds",
        "See how file-based routing, server components, and the App Router fit together. You leave with a map of the framework before writing features.",
        "Next.js in 100 seconds Fireship",
        ["App Router vs pages", "Server vs client components", "Why Next owns the full stack"],
        "Sklc_fQBmcs",
        "Fireship",
        [
          mcq("What does the Next.js App Router use for routes?", ["The pages directory only", "Folders and page files inside app/", "A separate routes.json", "PHP templates"], 1),
          mcq("Which component type can fetch on the server by default in the App Router?", ["Server Components", "Only class components", "CSS modules", "Service workers"], 0),
          mcq("Next.js is best described as which kind of framework?", ["A CSS-only toolkit", "A React full-stack framework", "A database", "A design system"], 1),
        ],
        true
      ),
      mod(
        2,
        "Next.js Fundamentals",
        "Walk the first tutorial path: project structure, pages, and how a request becomes UI. This is the foundation the later modules build on.",
        "Next.js tutorial introduction Codevolution",
        ["Project layout", "How a page is rendered", "Where navigation lives"],
        "9P8mASSREYM",
        "Codevolution",
        [
          mcq("A Next.js page file is responsible for what?", ["Styling only", "The UI for that route", "Database backups", "DNS records"], 1),
          mcq("React components in Next.js still return what?", ["SQL rows", "JSX", "Binary blobs", "CSV"], 1),
          mcq("Why start with fundamentals before full-stack features?", ["So routing and rendering are familiar first", "Because APIs cannot be tested", "Next.js has no routing", "CSS must be avoided"], 0),
        ]
      ),
      mod(
        3,
        "Next.js Crash Course",
        "Build the core loop: pages, layout, and data on the screen. You practice the pieces you will reuse in every module after this.",
        "Next.js crash course Traversy Media",
        ["Layouts wrap pages", "Links stay client-side", "Data can load with the page"],
        "mTz0GXj8NN0",
        "Traversy Media",
        [
          mcq("A shared layout in Next.js is useful because it:", ["Reloads the header on every click", "Keeps chrome mounted across pages", "Replaces React", "Deletes the API"], 1),
          mcq("Client-side navigation with Link mainly avoids:", ["Using JavaScript", "A full browser reload", "Writing components", "CSS"], 1),
          mcq("Which layer is Next.js built on?", ["React", "jQuery", "Django templates only", "Java Swing"], 0),
        ]
      ),
      mod(
        4,
        "React for the Interface",
        "The UI half of a full-stack app is still React. Components, state, and props are how every screen in this course is composed.",
        "React course beginners freeCodeCamp",
        ["Props flow down", "State is local data", "Components are reusable"],
        "bMknfKXIFA8",
        "freeCodeCamp.org",
        [
          mcq("Props are best described as:", ["Inputs passed into a component", "A database index", "CSS variables only", "HTTP headers"], 0),
          mcq("useState stores:", ["Data that can change and re-render the UI", "Only server logs", "DNS zones", "Git history"], 0),
          mcq("A React list should include:", ["A stable key", "A random key each render on purpose", "No parent", "Inline SQL"], 0),
        ]
      ),
      mod(
        5,
        "APIs with Node & Express",
        "Full-stack means a real backend. You learn routes, JSON responses, and how the Next.js UI will eventually call an API you control.",
        "Node.js Express full course freeCodeCamp",
        ["Routes map URLs to handlers", "JSON is the usual payload", "Middleware runs before the handler"],
        "Oe421EPjeBE",
        "freeCodeCamp.org",
        [
          mcq("An Express route pairs a path with:", ["A handler function", "A CSS file only", "A font", "A browser extension"], 0),
          mcq("REST APIs commonly send data as:", ["JSON", "Raw bitmap frames only", "Printed paper", "MIDI"], 0),
          mcq("Middleware is code that:", ["Runs in the request pipeline", "Replaces the operating system", "Compiles C++", "Styles buttons"], 0),
        ]
      ),
    ],
  },
  {
    id: "starter_python",
    topic: "Python for Data Science",
    level: "Beginner",
    duration: "1 Week",
    description: "Go from first Python syntax to Pandas, charts, and a real data-science workflow.",
    createdAt: "2024-11-02T00:00:00.000Z",
    modules: [
      mod(
        1,
        "Python in One Hour",
        "Learn variables, conditions, loops, and functions fast enough to read a notebook. This is the language every later data tool assumes.",
        "Python for beginners Programming with Mosh",
        ["Variables hold values", "Indentation defines blocks", "Functions package logic"],
        "kqtD5dpn9C8",
        "Programming with Mosh",
        [
          mcq("Python blocks are defined by:", ["Indentation", "Curly braces only", "Semicolons only", "Line numbers"], 0),
          mcq("A function is used to:", ["Reuse a named block of code", "Delete the interpreter", "Compile Java", "Draw pixels directly"], 0),
          mcq("Which type holds text?", ["str", "int", "bool only", "None always"], 0),
        ],
        true
      ),
      mod(
        2,
        "Python Foundations",
        "Slow down and make the basics solid: types, collections, and control flow. You need this fluency before Pandas will feel obvious.",
        "Learn Python full course freeCodeCamp",
        ["Lists and dicts", "Loops and conditions", "Reading errors"],
        "rfscVS0vtbw",
        "freeCodeCamp.org",
        [
          mcq("A Python list is:", ["An ordered collection", "A single character", "A CSS rule", "A network port"], 0),
          mcq("A dict maps:", ["Keys to values", "Pixels to fonts", "Only numbers to numbers with no keys", "HTML to SQL automatically"], 0),
          mcq("An if statement runs code when:", ["Its condition is true", "The file is empty always", "Python restarts", "The loop is a string"], 0),
        ]
      ),
      mod(
        3,
        "Pandas, NumPy & Matplotlib",
        "Load a table, compute on columns, and plot the result. This is the daily toolkit of a Python data scientist.",
        "Python for data science Pandas NumPy Matplotlib",
        ["DataFrames are tables", "NumPy is numeric arrays", "Matplotlib draws charts"],
        "LHBE6Q9XlzI",
        "freeCodeCamp.org",
        [
          mcq("A Pandas DataFrame is closest to:", ["A table of rows and columns", "A single integer", "An HTTP server", "A CSS grid"], 0),
          mcq("NumPy is mainly used for:", ["Fast numerical arrays", "Writing CSS", "Hosting video", "Designing logos"], 0),
          mcq("Matplotlib helps you:", ["Visualize data", "Mine Bitcoin", "Replace Python", "Compile C++"], 0),
        ]
      ),
      mod(
        4,
        "Data Analysis Projects",
        "Practice the full clean-analyze-chart loop on real tables. You will filter, aggregate, and explain what the numbers say.",
        "Data analysis with Python NumPy Pandas freeCodeCamp",
        ["Clean before you chart", "Group and aggregate", "Tell the story of the chart"],
        "r-uOLxNrNk8",
        "freeCodeCamp.org",
        [
          mcq("Before charting, analysts usually:", ["Clean and inspect the data", "Delete every column", "Skip missing values silently always", "Convert text to video"], 0),
          mcq("Aggregation means:", ["Summarizing many rows into a metric", "Encrypting a disk", "Changing the font", "Restarting the kernel only"], 0),
          mcq("Pandas is used in this module to:", ["Analyze tabular data", "Render 3D games", "Train the browser", "Route packets"], 0),
        ]
      ),
      mod(
        5,
        "The Data Science Workflow",
        "Zoom out from syntax to the job: questions, data, analysis, and a result someone can act on. You finish with the shape of a real project.",
        "Data science tutorial full course beginners",
        ["Start with a question", "Data has a lifecycle", "Results need an explanation"],
        "ua-CiDNNj30",
        "freeCodeCamp.org",
        [
          mcq("A data science project should start with:", ["A clear question", "A random model", "A logo", "A deployment region"], 0),
          mcq("Exploratory analysis is for:", ["Understanding the data before modeling", "Replacing all charts with logs", "Deleting the dataset", "Writing CSS"], 0),
          mcq("A useful result is one you can:", ["Explain and act on", "Hide from stakeholders", "Store only as a binary with no labels", "Ignore"], 0),
        ]
      ),
    ],
  },
  {
    id: "starter_dsa",
    topic: "DSA in C++",
    level: "Intermediate",
    duration: "1 Week",
    description: "Learn C++ memory and syntax, then the structures and patterns behind coding interviews.",
    createdAt: "2024-11-03T00:00:00.000Z",
    modules: [
      mod(
        1,
        "C++ in One Hour",
        "Get the language in your hands: types, I/O, functions, and the compile-run loop. Later structures will assume this speed.",
        "C++ tutorial for beginners Mosh",
        ["Compile then run", "Types are explicit", "Functions take arguments"],
        "ZzaPdXTrSb8",
        "Programming with Mosh",
        [
          mcq("C++ source is typically:", ["Compiled to a binary", "Only interpreted in the browser", "Stored as CSS", "Executed by Pandas"], 0),
          mcq("iostream is used for:", ["Console input and output", "Sorting graphs", "HTTP/3", "GPU shaders only"], 0),
          mcq("A function parameter is:", ["A value the function receives", "The linker", "A header guard", "A makefile target"], 0),
        ],
        true
      ),
      mod(
        2,
        "C++ Language Basics",
        "Fill in control flow, arrays, and the habits that keep C++ readable. You are building the muscle memory DSA problems require.",
        "C++ tutorial for beginners full course freeCodeCamp",
        ["Loops walk collections", "Arrays are contiguous", "Conditions steer control flow"],
        "vLnPwxZdW4Y",
        "freeCodeCamp.org",
        [
          mcq("An array stores elements in:", ["Contiguous memory", "Random CSS layers", "A remote queue only", "JSON files by default"], 0),
          mcq("A for loop is ideal when you:", ["Know how many times to repeat", "Never need an index", "Are writing SQL only", "Cannot use integers"], 0),
          mcq("C++ is which kind of language?", ["Statically typed", "Typeless", "Markup", "A spreadsheet formula language"], 0),
        ]
      ),
      mod(
        3,
        "C++ Beginner to Advanced",
        "Pointers, references, and the standard library turn C++ from syntax into a tool. This is the bridge into serious data structures.",
        "C++ programming course beginner to advanced",
        ["Pointers hold addresses", "References alias objects", "The STL saves reinvention"],
        "8jLOx1hD3_o",
        "freeCodeCamp.org",
        [
          mcq("A pointer stores:", ["A memory address", "Only a CSS color", "A database URL always", "A font name"], 0),
          mcq("A reference in C++ is:", ["An alias for an existing object", "A second copy you must free", "A Python decorator", "A network socket"], 0),
          mcq("The STL gives you:", ["Ready-made containers and algorithms", "A browser engine", "Pandas DataFrames", "JSX"], 0),
        ]
      ),
      mod(
        4,
        "Structures in C and C++",
        "Arrays, lists, stacks, and queues stop being vocabulary and become code. You will trace how each structure grows and shrinks.",
        "Data structures full course using C and C++",
        ["Stacks are LIFO", "Queues are FIFO", "Linked lists trade locality for flexibility"],
        "B31LgI4Y4DQ",
        "freeCodeCamp.org",
        [
          mcq("A stack removes items in which order?", ["Last in, first out", "Random", "Alphabetical only", "Largest key always"], 0),
          mcq("A queue removes items in which order?", ["First in, first out", "Last in, first out", "Only from the middle", "By hash only"], 0),
          mcq("A linked list node typically stores:", ["A value and a pointer to the next node", "Only a boolean", "A CSS class", "An HTTP method"], 0),
        ]
      ),
      mod(
        5,
        "Dynamic Programming",
        "Stop recomputing the same subproblems. Overlapping subproblems and optimal substructure are the two ideas every DP problem hides.",
        "Dynamic programming algorithmic problems freeCodeCamp",
        ["Cache overlapping subproblems", "Optimal substructure", "Bottom-up vs top-down"],
        "oBt53YbR9Kk",
        "freeCodeCamp.org",
        [
          mcq("Dynamic programming helps when subproblems:", ["Overlap and can be reused", "Are all unique and tiny", "Cannot be defined", "Require CSS"], 0),
          mcq("Memoization means:", ["Storing results of expensive calls", "Deleting the stack", "Sorting with CSS", "Inlining assembly only"], 0),
          mcq("Optimal substructure means:", ["An optimal solution uses optimal solutions of smaller pieces", "The largest loop always wins", "Greedy is always wrong", "Recursion is illegal"], 0),
        ]
      ),
    ],
  },
  {
    id: "starter_system",
    topic: "System Design",
    level: "Advanced",
    duration: "3 Days",
    description: "Practice the interview arc: requirements, scaling, load balancing, and a structured design.",
    createdAt: "2024-11-04T00:00:00.000Z",
    modules: [
      mod(
        1,
        "How a Design Interview Flows",
        "Learn the shape of the conversation before the diagrams. Requirements, estimates, and a clear API keep the rest of the design honest.",
        "System design introduction for interview",
        ["Clarify requirements first", "Estimate scale", "Sketch the API and data"],
        "UzLMhqg3_Wc",
        "Tushar Roy - Coding Made Simple",
        [
          mcq("The first move in a system design interview is usually to:", ["Clarify requirements", "Pick a database brand immediately", "Draw every microservice", "Benchmark the laptop"], 0),
          mcq("Back-of-the-envelope estimates help you:", ["Choose capacity with rough numbers", "Avoid all tradeoffs", "Skip the API", "Replace testing"], 0),
          mcq("A good design names:", ["Components and how data moves", "Only the logo", "The CSS framework", "A single function with no boundaries"], 0),
        ],
        true
      ),
      mod(
        2,
        "Horizontal vs Vertical Scaling",
        "Know when to buy a bigger box and when to add more boxes. This choice shows up in almost every capacity conversation.",
        "Horizontal vs vertical scaling system design",
        ["Vertical scaling grows one machine", "Horizontal scaling adds machines", "State makes horizontal scaling harder"],
        "xpDnVSmNFX0",
        "Gaurav Sen",
        [
          mcq("Vertical scaling means:", ["A larger machine", "More machines behind a balancer", "More CSS", "A shorter API"], 0),
          mcq("Horizontal scaling means:", ["Adding more machines", "Only increasing RAM on one host", "Deleting replicas", "Using a single thread forever"], 0),
          mcq("Shared state makes horizontal scaling harder because:", ["Nodes must agree on that state", "CPUs cannot add", "Disks forbid reads", "HTTP has no verbs"], 0),
        ]
      ),
      mod(
        3,
        "Load Balancing",
        "Spread traffic so one node is not the whole product. You will compare strategies and see where health checks belong.",
        "What is load balancing system design",
        ["Balancers spread requests", "Health checks drop dead nodes", "Algorithms change who gets the next request"],
        "K0Ta65OqQkY",
        "Gaurav Sen",
        [
          mcq("A load balancer’s job is to:", ["Distribute traffic across servers", "Compile the frontend", "Replace the database", "Store user passwords in the URL"], 0),
          mcq("A health check is used to:", ["Stop sending traffic to a failed node", "Increase CSS specificity", "Encrypt disks with CSS", "Sort an array"], 0),
          mcq("Round robin is an example of:", ["A balancing algorithm", "A database index", "A cache eviction policy only", "A DNS record type only"], 0),
        ]
      ),
      mod(
        4,
        "Core Design Concepts",
        "Caching, databases, queues, and tradeoffs in one pass. This is the vocabulary you will reach for in the final mock.",
        "System design concepts course interview prep",
        ["Caches trade freshness for speed", "SQL and NoSQL fit different shapes", "Queues absorb spikes"],
        "F2FmTdLtb_4",
        "freeCodeCamp.org",
        [
          mcq("A cache is mainly for:", ["Serving hot data faster", "Permanent legal archive only", "Replacing all databases", "Compiling C++"], 0),
          mcq("A message queue helps when you need to:", ["Decouple producers from consumers and smooth spikes", "Render JSX", "Store CSS", "Avoid all asynchronous work"], 0),
          mcq("Choosing SQL vs NoSQL is mostly about:", ["Data shape, queries, and consistency needs", "The logo color", "Which font the API uses", "The load balancer algorithm only"], 0),
        ]
      ),
      mod(
        5,
        "A Step-by-Step Design",
        "Put the pieces in interview order and talk through one system end to end. You finish able to narrate tradeoffs out loud.",
        "System design interview step by step guide",
        ["Narrate tradeoffs", "Start broad, then deepen", "Call out bottlenecks"],
        "bUHFg8CZFws",
        "System Design Interview",
        [
          mcq("A strong interview design:", ["States tradeoffs out loud", "Hides every assumption", "Uses one server for the planet with no comment", "Skips the user journey"], 0),
          mcq("After the high-level diagram you should:", ["Deepen the risky components", "Stop talking", "Rewrite it in assembly", "Remove the database"], 0),
          mcq("Bottlenecks are worth naming because they:", ["Show where the design will fail first", "Are always the CSS file", "Replace requirements", "Remove the need for caches"], 0),
        ]
      ),
    ],
  },
];

function TiltCard3D({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = x / rect.width;
    const py = y / rect.height;
    const rotY = (px - 0.5) * 12;
    const rotX = (0.5 - py) * 12;
    setStyle({
      transform: `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: "transform 120ms ease-out",
    });
    setGlare({ x: px * 100, y: py * 100, opacity: 1 });
  };

  const handleLeave = () => {
    setStyle({
      transform: "perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
      transition: "transform 450ms cubic-bezier(0.22, 1, 0.36, 1)",
    });
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ ...style, transformStyle: "preserve-3d" }}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300"
        style={{
          opacity: glare.opacity,
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(229,9,20,0.18), transparent 55%)`,
        }}
      />
      {children}
    </div>
  );
}

function Interactive3DStage({
  topicPreview,
  durationPreview,
  streak,
  xp,
}: {
  topicPreview: string;
  durationPreview: string;
  streak: number;
  xp: number;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 6, ry: -10 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ rx: -py * 18, ry: px * 20 });
  };

  const handleLeave = () => setTilt({ rx: 6, ry: -10 });

  const displayTopic = topicPreview.trim() || "C Programming";
  const modCount = durationPreview.toLowerCase().includes("hour")
    ? 3
    : durationPreview.toLowerCase().includes("3 day")
    ? 4
    : 5;

  return (
    <div
      ref={stageRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="relative flex min-h-[370px] w-full items-center justify-center select-none"
      style={{ perspective: "1200px" }}
    >
      <div className="pointer-events-none absolute h-64 w-64 rounded-full bg-[#E50914]/20 blur-[95px]" />

      <div
        className="relative w-full max-w-[400px] rounded-2xl border border-white/15 bg-gradient-to-br from-[#18181b]/95 via-[#141414]/95 to-[#0a0a0c]/95 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.85)] backdrop-blur-xl"
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transformStyle: "preserve-3d",
          transition: "transform 180ms ease-out",
        }}
      >
        <div
          className="mb-5 flex items-center justify-between"
          style={{ transform: "translateZ(30px)" }}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E50914]/40 bg-[#E50914]/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-red-400">
            <Layers className="h-3.5 w-3.5" /> Series Preview
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-zinc-300">
            {durationPreview}
          </span>
        </div>

        <div
          className="rounded-xl border border-white/10 bg-black/50 p-4 shadow-inner"
          style={{ transform: "translateZ(45px)" }}
        >
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#E50914]">
            EdFlix Original Track
          </p>
          <h3 className="mt-1 truncate text-xl font-bold text-white">{displayTopic}</h3>
          <div className="mt-3 space-y-2">
            {Array.from({ length: modCount }).map((_, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                  idx === 0
                    ? "border-[#E50914]/50 bg-[#E50914]/15 text-white"
                    : "border-white/5 bg-white/[0.03] text-zinc-400"
                }`}
              >
                <span className="flex items-center gap-2">
                  {idx === 0 ? (
                    <Play className="h-3.5 w-3.5 fill-[#E50914] text-[#E50914]" />
                  ) : (
                    <Lock className="h-3 w-3 text-zinc-500" />
                  )}
                  Episode 0{idx + 1} · {idx === 0 ? "Play Now" : "Pass Quiz to Unlock"}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  {durationPreview.toLowerCase().includes("hour") ? "~15m" : "~35m"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="absolute -bottom-5 -left-4 flex items-center gap-2.5 rounded-xl border border-white/15 bg-[#141414]/95 px-4 py-2.5 shadow-2xl backdrop-blur-md"
          style={{ transform: "translateZ(65px)" }}
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#E50914]/20 text-[#E50914]">
            <Zap className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-400">Your XP</p>
            <p className="text-sm font-bold text-white">{xp.toLocaleString()}</p>
          </div>
        </div>

        <div
          className="absolute -right-4 -top-5 flex items-center gap-2 rounded-xl border border-amber-400/30 bg-[#1a1308]/95 px-3.5 py-2 shadow-2xl backdrop-blur-md"
          style={{ transform: "translateZ(70px)" }}
        >
          <Flame className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-bold text-amber-200">{streak}d Streak</span>
        </div>
      </div>
    </div>
  );
}

function CertificateModal({
  course,
  user,
  onClose,
}: {
  course: Course;
  user: UserProfile | null;
  onClose: () => void;
}) {
  const learnerName = user?.name || "EdFlix Scholar";
  const issueDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const certId = `EDFLIX-${course.id.slice(-6).toUpperCase()}`;

  const handlePrintCertificate = () => {
    const win = window.open("", "_blank", "width=960,height=680");
    if (!win) return;
    win.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>EdFlix Certificate - ${course.topic}</title>
          <style>
            body { margin: 0; font-family: 'Segoe UI', system-ui, sans-serif; background: #0a0a0c; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
            .cert { width: 820px; padding: 52px; border-radius: 16px; background: linear-gradient(145deg, #18181b 0%, #0a0a0c 100%); border: 3px solid #E50914; box-shadow: 0 25px 60px rgba(0,0,0,0.7); text-align: center; }
            .badge { color: #E50914; font-weight: 800; letter-spacing: 4px; font-size: 13px; text-transform: uppercase; }
            h1 { font-size: 38px; margin: 14px 0 8px; letter-spacing: -0.5px; }
            .sub { color: #a1a1aa; font-size: 15px; margin-bottom: 28px; }
            .name { font-size: 34px; font-weight: 800; color: #fbbf24; margin: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.15); display: inline-block; padding: 0 28px 8px; }
            .course { font-size: 24px; font-weight: 700; color: #ffffff; margin: 16px 0 8px; }
            .meta { color: #d4d4d8; font-size: 14px; margin-bottom: 36px; }
            .footer { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid rgba(255,255,255,0.12); padding-top: 20px; font-size: 12px; color: #a1a1aa; }
            .sig { text-align: left; }
            .sig strong { display: block; color: #fff; font-size: 14px; margin-bottom: 2px; }
            @media print { body { background: #fff; } .cert { box-shadow: none; } }
          </style>
        </head>
        <body>
          <div class="cert">
            <div class="badge">EDFLIX · AI-POWERED SMART LEARNING</div>
            <h1>Certificate of Mastery</h1>
            <p class="sub">This certifies that</p>
            <div class="name">${learnerName}</div>
            <p class="sub" style="margin-top:18px;margin-bottom:6px;">has successfully completed all ${course.modules.length} modules and unlock quizzes of</p>
            <div class="course">${course.topic}</div>
            <div class="meta">Level: ${course.level} &nbsp;•&nbsp; Track Duration: ${course.duration}</div>
            <div class="footer">
              <div class="sig"><strong>EdFlix Academic Engine</strong>Verified AI Curriculum Completion</div>
              <div>Date: ${issueDate}</div>
              <div>Certificate ID: <strong>${certId}</strong></div>
            </div>
          </div>
          <script>window.onload = () => { window.print(); }</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-2xl border border-[#E50914]/40 bg-gradient-to-br from-[#18181b] to-[#0a0a0c] p-6 text-center shadow-2xl sm:p-10">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
          aria-label="Close certificate"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-[#E50914]/35 bg-[#E50914]/15 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-red-400">
          <ShieldCheck className="h-4 w-4" /> Verified Completion
        </div>

        <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Certificate of Mastery</h2>
        <p className="mt-2 text-sm text-zinc-400">Proudly presented to</p>

        <p className="mx-auto mt-3 inline-block border-b border-white/15 px-6 pb-2 text-2xl font-bold text-amber-300 sm:text-3xl">
          {learnerName}
        </p>

        <p className="mt-4 text-sm text-zinc-300">
          for completing all {course.modules.length} distraction-free modules and passing every active-recall quiz in
        </p>

        <h3 className="mt-2 text-xl font-bold text-white sm:text-2xl">{course.topic}</h3>
        <p className="mt-1 text-xs text-zinc-400">
          {course.level} · {course.duration} · Issued {issueDate} · ID: {certId}
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={handlePrintCertificate}
            className="inline-flex items-center gap-2 rounded-lg bg-[#E50914] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/25 transition hover:bg-[#f6121d]"
          >
            <Printer className="h-4 w-4" /> Download / Print PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-200 hover:bg-white/10"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function TopNav({
  streak,
  xp,
  user,
  theater,
  onDiscover,
  onCourses,
  onSignOut,
}: {
  streak: number;
  xp: number;
  user: UserProfile;
  theater?: { title: string; meta: string; progress: number; onBack: () => void };
  onDiscover: () => void;
  onCourses: () => void;
  onSignOut: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0c]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 sm:gap-5 sm:px-6">
        <button type="button" onClick={onDiscover} className="flex shrink-0 items-center gap-2.5" aria-label="EdFlix home">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#E50914] shadow-lg shadow-red-600/30">
            <Play className="h-3.5 w-3.5 fill-white text-white" />
          </span>
          <span className="text-xl font-black tracking-tight text-[#E50914] sm:text-2xl">
            EDFLIX
          </span>
        </button>

        {theater ? (
          <button
            type="button"
            onClick={theater.onBack}
            className="hidden items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-200 transition hover:border-[#E50914]/60 hover:text-white sm:inline-flex"
          >
            <ArrowLeft className="h-4 w-4" /> Library
          </button>
        ) : null}

        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          <button type="button" className="text-sm font-medium text-zinc-300 transition hover:text-white" onClick={onDiscover}>
            Discover
          </button>
          <button type="button" className="text-sm font-medium text-zinc-300 transition hover:text-white" onClick={onCourses}>
            My Courses
          </button>
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {theater ? (
            <div className="hidden items-center gap-2 text-xs text-zinc-300 lg:flex">
              <span className="max-w-[180px] truncate">
                {theater.progress}% · {theater.title}
              </span>
              <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-[#E50914] transition-all duration-500" style={{ width: `${theater.progress}%` }} />
              </div>
            </div>
          ) : null}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200" title="Learning streak">
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Streak</span> {streak}d
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E50914]/35 bg-[#E50914]/15 px-3 py-1 text-xs font-medium text-red-200" title="XP points">
            <Zap className="h-3.5 w-3.5 text-[#E50914]" />
            <strong className="font-semibold text-white">{xp.toLocaleString()}</strong> XP
          </span>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="relative grid h-9 w-9 cursor-pointer place-items-center overflow-hidden rounded-md border border-white/20 bg-[#E50914] text-sm font-bold text-white"
              aria-label="Account menu"
              title={user.name}
            >
              {user.image ? (
                <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-60 rounded-xl border border-white/15 bg-[#141414]/95 p-3 shadow-2xl backdrop-blur-xl">
                <div className="border-b border-white/10 pb-2.5">
                  <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                  <p className="truncate text-xs text-zinc-400">{user.email}</p>
                  <p className="mt-1 inline-block rounded-full bg-[#E50914]/20 px-2 py-0.5 text-[10px] font-semibold text-red-300">
                    {user.role}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onSignOut();
                  }}
                  className="mt-2 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
                >
                  <LogOut className="h-3.5 w-3.5 text-[#E50914]" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default function EdFlixHome() {
  const { data: session } = useSession();

  const [authReady, setAuthReady] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeModIdx, setActiveModIdx] = useState(0);
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [duration, setDuration] = useState("2 Hours Crash Course");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [sideTab, setSideTab] = useState<"tutor" | "notes">("tutor");
  const [notes, setNotes] = useState("");
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const [stats, setStats] = useState<Stats>({ quizCorrect: 0, quizTotal: 0, focusSeconds: 0, visitDays: [] });
  const [streak, setStreak] = useState(1);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [certificateCourse, setCertificateCourse] = useState<Course | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const topicRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session?.user) {
      setUser({
        name: session.user.name || "Google User",
        email: session.user.email || "",
        image: session.user.image || undefined,
        role: "Verified Google Account",
      });
    }
  }, [session]);

  useEffect(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        /* ignore */
      }
    }
    setAuthReady(true);

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setCourses(JSON.parse(saved));
      } catch {
        /* ignore corrupt cache */
      }
    }

    fetch("/api/courses")
      .then((r) => r.json())
      .then((data) => {
        if (data.mode === "mongodb" && Array.isArray(data.courses) && data.courses.length > 0) {
          setCourses((current) => {
            const remoteIds = new Set(data.courses.map((c: Course) => c.id));
            const localOnly = current.filter((c) => !remoteIds.has(c.id));
            const merged = [...data.courses, ...localOnly];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            return merged;
          });
        }
      })
      .catch(() => {});

    try {
      const raw = localStorage.getItem(STATS_KEY);
      const parsed: Stats | null = raw ? JSON.parse(raw) : null;
      const visitDays = new Set(parsed?.visitDays ?? []);
      visitDays.add(dayKey());
      const next: Stats = {
        quizCorrect: parsed?.quizCorrect ?? 0,
        quizTotal: parsed?.quizTotal ?? 0,
        focusSeconds: parsed?.focusSeconds ?? 0,
        visitDays: Array.from(visitDays),
      };
      localStorage.setItem(STATS_KEY, JSON.stringify(next));
      setStats(next);
      setStreak(streakFrom(next.visitDays));
    } catch {
      /* keep defaults */
    }
  }, []);

  useEffect(() => {
    if (!activeCourse) return;
    const id = window.setInterval(() => {
      setStats((prev) => {
        const next = { ...prev, focusSeconds: prev.focusSeconds + 15 };
        localStorage.setItem(STATS_KEY, JSON.stringify(next));
        return next;
      });
    }, 15000);
    return () => window.clearInterval(id);
  }, [activeCourse?.id]);

  useEffect(() => {
    if (!celebration) return;
    const t = window.setTimeout(() => setCelebration(null), 9000);
    return () => window.clearTimeout(t);
  }, [celebration]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isAsking]);

  useEffect(() => {
    if (!activeCourse) return;
    try {
      const all = JSON.parse(localStorage.getItem(NOTES_KEY) || "{}");
      setNotes(all[`${activeCourse.id}:${activeModIdx}`] || "");
    } catch {
      setNotes("");
    }
  }, [activeCourse?.id, activeModIdx]);

  const handleSignOut = () => {
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setActiveCourse(null);
    signOut({ redirect: false });
  };

  const persistCourses = (updated: Course[]) => {
    setCourses(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const getProgress = (course: Course) => {
    if (!course.modules.length) return 0;
    const done = course.modules.filter((m) => m.completed).length;
    return Math.round((done / course.modules.length) * 100);
  };

  const modulesMastered = courses.reduce(
    (sum, course) => sum + course.modules.filter((m) => m.completed).length,
    0
  );
  const quizAccuracy = stats.quizTotal ? Math.round((stats.quizCorrect / stats.quizTotal) * 100) : 0;
  const xp = useMemo(
    () => modulesMastered * 120 + stats.quizCorrect * 40 + Math.floor(stats.focusSeconds / 60) * 8 + streak * 30,
    [modulesMastered, stats.quizCorrect, stats.focusSeconds, streak]
  );
  const focusHours = (stats.focusSeconds / 3600).toFixed(1);

  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;
    const q = searchQuery.toLowerCase();
    return courses.filter(
      (c) =>
        c.topic.toLowerCase().includes(q) ||
        c.level.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [courses, searchQuery]);

  const scrollTo = (id: string) => {
    if (activeCourse) {
      setActiveCourse(null);
      window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const fillChip = (chip: (typeof CHIPS)[number]) => {
    setTopic(chip.label);
    setLevel(chip.level);
    setDuration(chip.duration);
    setErrorMsg("");
    topicRef.current?.focus();
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setIsGenerating(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/generate-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, level, duration }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");

      const updatedList = [data.course, ...courses];
      persistCourses(updatedList);
      openCourse(data.course, updatedList);
      setTopic("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate course.";
      setErrorMsg(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const openCourse = (course: Course, list = courses) => {
    const saved = list.find((c) => c.id === course.id);
    const target = saved ?? course;
    if (!saved) persistCourses([course, ...list]);
    setActiveCourse(target);
    setActiveModIdx(0);
    setShowQuiz(false);
    setQuizResult(null);
    setSelectedAnswers({});
    setCelebration(null);
    setSideTab("tutor");
    setChatMessages([
      {
        role: "ai",
        text: `Hi${user ? ` ${user.name.split(" ")[0]}` : ""}! I'm your EdFlix AI Tutor for "${target.topic}". Ask me any doubt about this video!`,
      },
    ]);
  };

  const deleteCourse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    persistCourses(courses.filter((c) => c.id !== id));
  };

  const handleNotes = (value: string) => {
    setNotes(value);
    if (!activeCourse) return;
    try {
      const all = JSON.parse(localStorage.getItem(NOTES_KEY) || "{}");
      all[`${activeCourse.id}:${activeModIdx}`] = value;
      localStorage.setItem(NOTES_KEY, JSON.stringify(all));
    } catch {
      /* storage unavailable */
    }
  };

  const handleExportNotes = () => {
    if (!activeCourse) return;
    const currentMod = activeCourse.modules[activeModIdx];
    const content = [
      `EdFlix Study Notes`,
      `==================`,
      `Course: ${activeCourse.topic} (${activeCourse.level})`,
      `Module ${currentMod.id}: ${currentMod.title}`,
      `Student: ${user?.name || "EdFlix Learner"}`,
      `Date: ${new Date().toLocaleDateString()}`,
      ``,
      `Notes:`,
      notes.trim() || "(No notes written for this module yet.)",
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeCourse.topic.replace(/\s+/g, "_")}_Module_${currentMod.id}_Notes.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleQuizSubmit = () => {
    if (!activeCourse) return;
    const modCurrent = activeCourse.modules[activeModIdx];
    let score = 0;
    modCurrent.quiz.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) score++;
    });

    const passed = score >= 2;
    setQuizResult({ score, passed });

    setStats((prev) => {
      const next = {
        ...prev,
        quizCorrect: prev.quizCorrect + score,
        quizTotal: prev.quizTotal + modCurrent.quiz.length,
      };
      localStorage.setItem(STATS_KEY, JSON.stringify(next));
      return next;
    });

    if (passed) {
      const updatedModules = activeCourse.modules.map((m, idx) => {
        if (idx === activeModIdx) return { ...m, completed: true };
        if (idx === activeModIdx + 1) return { ...m, unlocked: true };
        return m;
      });
      const updatedCourse = { ...activeCourse, modules: updatedModules };
      setActiveCourse(updatedCourse);

      const updatedList = courses.some((c) => c.id === updatedCourse.id)
        ? courses.map((c) => (c.id === updatedCourse.id ? updatedCourse : c))
        : [updatedCourse, ...courses];
      persistCourses(updatedList);

      const allDone = updatedModules.every((m) => m.completed);
      const nextMod = updatedModules[activeModIdx + 1];
      setCelebration(
        allDone
          ? {
              kind: "course",
              title: "Course Completed!",
              detail: `You mastered ${activeCourse.topic}. Your official certificate is ready.`,
            }
          : {
              kind: "module",
              title: "Episode Unlocked",
              detail: nextMod ? `${nextMod.title} is now open on your roadmap.` : "The next lesson is ready.",
            }
      );

      fetch("/api/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: updatedCourse.id, modules: updatedModules }),
      }).catch(() => {});
    }
  };

  const handleAskDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeCourse) return;

    const userQ = chatInput.trim();
    const currentMod = activeCourse.modules[activeModIdx];
    setChatMessages((prev) => [...prev, { role: "user", text: userQ }]);
    setChatInput("");
    setIsAsking(true);

    try {
      const res = await fetch("/api/doubt-solver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userQ,
          courseTopic: activeCourse.topic,
          moduleTitle: currentMod.title,
          moduleSummary: currentMod.summary,
        }),
      });
      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        { role: "ai", text: data.answer || data.error || "Could not answer right now." },
      ]);
    } catch {
      setChatMessages((prev) => [...prev, { role: "ai", text: "Network error. Try again." }]);
    } finally {
      setIsAsking(false);
    }
  };

  const selectModule = (idx: number) => {
    setActiveModIdx(idx);
    setShowQuiz(false);
    setQuizResult(null);
    setSelectedAnswers({});
    setCelebration(null);
  };

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0c] text-zinc-300">
        <Loader2 className="h-6 w-6 animate-spin text-[#E50914]" />
      </div>
    );
  }

  if (!user) {
    return (
      <AuthModal
        isOpen={true}
        fullScreen={true}
        onClose={() => {}}
        onAuthSuccess={(loggedInUser) => setUser(loggedInUser)}
      />
    );
  }

  const modals = (
    <>
      {certificateCourse && (
        <CertificateModal
          course={certificateCourse}
          user={user}
          onClose={() => setCertificateCourse(null)}
        />
      )}
    </>
  );

  if (activeCourse) {
    const currentMod = activeCourse.modules[activeModIdx];
    const progress = getProgress(activeCourse);
    const isCourseComplete = progress === 100;

    return (
      <div className="relative min-h-screen bg-[#0a0a0c] text-zinc-100">
        <div
          className="pointer-events-none fixed inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 0%, rgba(229,9,20,0.18), transparent 45%)",
          }}
        />
        <TopNav
          streak={streak}
          xp={xp}
          user={user}
          onSignOut={handleSignOut}
          onDiscover={() => scrollTo("discover")}
          onCourses={() => scrollTo("my-courses")}
          theater={{
            title: activeCourse.topic,
            meta: `${activeCourse.level} • ${activeCourse.duration}`,
            progress,
            onBack: () => setActiveCourse(null),
          }}
        />

        <div className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-white sm:text-xl">{activeCourse.topic}</h1>
              <p className="text-xs text-zinc-400">
                {activeCourse.level} · {activeCourse.duration} · Distraction-free theater
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isCourseComplete && (
                <button
                  type="button"
                  onClick={() => setCertificateCourse(activeCourse)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-400/25"
                >
                  <Trophy className="h-3.5 w-3.5" /> View Certificate
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveCourse(null)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm sm:hidden"
              >
                <ArrowLeft className="h-4 w-4" /> Library
              </button>
            </div>
          </div>

          {celebration && (
            <div
              className="flex items-center gap-3 rounded-xl border border-[#E50914]/40 bg-[#E50914]/15 p-4 backdrop-blur-md"
              role="status"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10">
                <Trophy className="h-5 w-5 text-amber-300" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">{celebration.title}</p>
                <p className="text-sm text-zinc-200">{celebration.detail}</p>
              </div>
              {celebration.kind === "course" && (
                <button
                  type="button"
                  onClick={() => setCertificateCourse(activeCourse)}
                  className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-black hover:bg-amber-300"
                >
                  Get Certificate
                </button>
              )}
              <button
                type="button"
                onClick={() => setCelebration(null)}
                className="px-2 text-lg text-zinc-300 hover:text-white"
                aria-label="Dismiss celebration"
              >
                ×
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <aside className="h-fit rounded-xl border border-white/10 bg-[#141414]/90 p-4 backdrop-blur-xl lg:col-span-3 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">
              <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                <BookOpen className="h-4 w-4 text-[#E50914]" /> Episodes
              </h2>
              <div className="flex flex-col gap-2">
                {activeCourse.modules.map((module, idx) => {
                  const isSelected = idx === activeModIdx;
                  const isLocked = !module.unlocked;
                  return (
                    <button
                      key={module.id}
                      type="button"
                      disabled={isLocked}
                      onClick={() => selectModule(idx)}
                      className={`flex items-start gap-3 rounded-lg border p-3 text-left transition ${
                        isSelected
                          ? "border-[#E50914]/70 bg-[#E50914]/15 text-white"
                          : isLocked
                          ? "cursor-not-allowed border-white/5 bg-black/40 text-zinc-600"
                          : "border-white/10 bg-white/[0.03] text-zinc-200 hover:border-white/25"
                      }`}
                    >
                      <span className="mt-0.5">
                        {module.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        ) : isLocked ? (
                          <Lock className="h-4 w-4 text-zinc-600" />
                        ) : (
                          <Play className="h-4 w-4 fill-[#E50914] text-[#E50914]" />
                        )}
                      </span>
                      <span>
                        <span className="block text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                          Module {module.id}
                        </span>
                        <span className="block text-sm font-medium leading-snug">{module.title}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 rounded-lg border border-white/10 bg-black/40 p-3">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Certificate</span>
                  <span>{progress}%</span>
                </div>
                <button
                  type="button"
                  disabled={!isCourseComplete}
                  onClick={() => setCertificateCourse(activeCourse)}
                  className={`mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${
                    isCourseComplete
                      ? "bg-amber-400 text-black hover:bg-amber-300"
                      : "cursor-not-allowed bg-white/5 text-zinc-500"
                  }`}
                >
                  <Trophy className="h-3.5 w-3.5" />
                  {isCourseComplete
                    ? "Download Certificate"
                    : `Finish all ${activeCourse.modules.length} modules to unlock`}
                </button>
              </div>
            </aside>

            <main className="flex flex-col gap-4 lg:col-span-6">
              <div className="relative">
                <div className="pointer-events-none absolute -inset-1 rounded-2xl bg-[#E50914]/15 blur-xl" />
                <div className="relative z-10 aspect-video w-full overflow-hidden rounded-xl border border-white/15 bg-black shadow-2xl">
                  {currentMod.videoId ? (
                    <iframe
                      key={`${currentMod.id}-${currentMod.videoId}`}
                      className="h-full w-full"
                      src={`https://www.youtube-nocookie.com/embed/${currentMod.videoId}?rel=0&modestbranding=1`}
                      title={currentMod.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                      <p className="text-sm font-medium text-zinc-300">
                        YouTube video could not be embedded automatically (API quota or key restriction).
                      </p>
                      <a
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                          currentMod.searchQuery || `${activeCourse.topic} ${currentMod.title}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-[#E50914] px-4 py-2 text-xs font-semibold text-white hover:bg-[#f6121d]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Open Lesson on YouTube
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <section className="rounded-xl border border-white/10 bg-[#141414]/90 p-5 backdrop-blur-xl">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#E50914]">
                      Module {currentMod.id} · {currentMod.channelTitle}
                    </p>
                    <h2 className="text-xl font-bold text-white">{currentMod.title}</h2>
                    <p className="mt-1 text-xs text-zinc-400">
                      {activeCourse.level} · {activeCourse.duration} · Distraction-free theater
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuiz(!showQuiz);
                      setQuizResult(null);
                      setSelectedAnswers({});
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#E50914] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition hover:bg-[#f6121d]"
                  >
                    <Award className="h-4 w-4" />
                    {currentMod.completed ? "Retake Quiz" : "Take Unlock Quiz"}
                  </button>
                </div>

                <p className="mb-4 text-sm leading-relaxed text-zinc-300">{currentMod.summary}</p>

                <div className="rounded-lg border border-white/10 bg-black/40 p-3.5">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Key Takeaways</h3>
                  <ul className="space-y-1.5 text-sm text-zinc-200">
                    {currentMod.keyTakeaways?.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#E50914]">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {showQuiz && (
                  <div className="mt-5 space-y-4 border-t border-white/10 pt-5">
                    <h3 className="flex items-center gap-2 font-bold text-white">
                      <Sparkles className="h-4 w-4 text-amber-300" />
                      Module {currentMod.id} unlock quiz · score 2/3 to continue
                    </h3>
                    {currentMod.quiz.map((q, qIdx) => (
                      <div key={qIdx} className="rounded-lg border border-white/10 bg-black/40 p-4">
                        <p className="mb-2.5 text-sm font-medium text-white">
                          {qIdx + 1}. {q.question}
                        </p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {q.options.map((opt, oIdx) => {
                            const selected = selectedAnswers[qIdx] === oIdx;
                            return (
                              <button
                                key={oIdx}
                                type="button"
                                onClick={() => setSelectedAnswers((prev) => ({ ...prev, [qIdx]: oIdx }))}
                                className={`rounded-lg border p-2.5 text-left text-xs transition ${
                                  selected
                                    ? "border-[#E50914] bg-[#E50914]/20 text-white"
                                    : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/30"
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    <div className="flex flex-wrap items-center gap-4">
                      <button
                        type="button"
                        onClick={handleQuizSubmit}
                        className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
                      >
                        Submit Answers
                      </button>
                      {quizResult && (
                        <p className={`text-sm font-semibold ${quizResult.passed ? "text-emerald-300" : "text-amber-300"}`}>
                          {quizResult.passed
                            ? activeCourse.modules.every((m) => m.completed)
                              ? `Passed (${quizResult.score}/3). Course completed!`
                              : `Passed (${quizResult.score}/3). Next module unlocked.`
                            : `Scored ${quizResult.score}/3. Need at least 2/3 — try again.`}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </section>
            </main>

            <aside className="flex h-[540px] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#141414]/90 backdrop-blur-xl lg:col-span-3 lg:h-[calc(100vh-120px)]">
              <div className="border-b border-white/10 p-3">
                <div className="grid grid-cols-2 gap-1 rounded-lg bg-black/50 p-1">
                  <button
                    type="button"
                    className={`inline-flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition ${
                      sideTab === "tutor" ? "bg-[#E50914] text-white" : "text-zinc-400 hover:text-white"
                    }`}
                    onClick={() => setSideTab("tutor")}
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> AI Doubt Solver
                  </button>
                  <button
                    type="button"
                    className={`inline-flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition ${
                      sideTab === "notes" ? "bg-[#E50914] text-white" : "text-zinc-400 hover:text-white"
                    }`}
                    onClick={() => setSideTab("notes")}
                  >
                    <StickyNote className="h-3.5 w-3.5" /> Quick Notes
                  </button>
                </div>
              </div>

              {sideTab === "tutor" ? (
                <>
                  <div className="flex-1 space-y-3 overflow-y-auto p-4">
                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`rounded-xl p-3 text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "ml-6 bg-[#E50914] text-white"
                            : "mr-4 border border-white/10 bg-black/50 text-zinc-200"
                        }`}
                      >
                        {msg.text}
                      </div>
                    ))}
                    {isAsking && (
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#E50914]" /> AI Tutor is thinking...
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <form onSubmit={handleAskDoubt} className="flex gap-2 border-t border-white/10 p-3">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask a doubt about this video..."
                      className="flex-1 rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#E50914]"
                    />
                    <button
                      type="submit"
                      disabled={isAsking}
                      className="rounded-lg bg-[#E50914] p-2.5 text-white transition hover:bg-[#f6121d] disabled:opacity-50"
                      aria-label="Send doubt"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex flex-1 flex-col p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <label htmlFor="quick-notes" className="text-xs font-medium text-zinc-400">
                      Module {currentMod.id} notes · auto-saved
                    </label>
                    <button
                      type="button"
                      onClick={handleExportNotes}
                      className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-zinc-200 transition hover:bg-white/15"
                    >
                      <Download className="h-3 w-3" /> Export .txt
                    </button>
                  </div>
                  <textarea
                    id="quick-notes"
                    value={notes}
                    onChange={(e) => handleNotes(e.target.value)}
                    placeholder="Timestamp, formula, or a question to revisit..."
                    className="min-h-0 flex-1 resize-none rounded-lg border border-white/15 bg-black/50 px-3 py-3 text-sm leading-relaxed text-white outline-none focus:border-[#E50914]"
                  />
                </div>
              )}
            </aside>
          </div>
        </div>
        {modals}
      </div>
    );
  }

  const statsCards = [
    { label: "Courses Active", value: String(courses.length), hint: "In library", icon: BookOpen, color: "text-[#E50914]" },
    { label: "Modules Mastered", value: String(modulesMastered), hint: "Quizzes passed", icon: CheckCircle2, color: "text-emerald-400" },
    {
      label: "Quiz Accuracy",
      value: `${quizAccuracy}%`,
      hint: stats.quizTotal ? `${stats.quizCorrect}/${stats.quizTotal} correct` : "No attempts yet",
      icon: Target,
      color: "text-amber-400",
    },
    {
      label: "Focus Hours",
      value: focusHours,
      hint: `${Math.floor(stats.focusSeconds / 60)} min theater`,
      icon: Timer,
      color: "text-zinc-200",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0a0a0c] pb-16 text-zinc-100 md:pb-0">
      {/* Netflix Cinematic Red Vignette */}
      <div
        className="pointer-events-none fixed inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 12%, rgba(229,9,20,0.20), transparent 42%), radial-gradient(circle at 82% 18%, rgba(229,9,20,0.10), transparent 45%)",
        }}
      />

      <TopNav
        streak={streak}
        xp={xp}
        user={user}
        onSignOut={handleSignOut}
        onDiscover={() => scrollTo("discover")}
        onCourses={() => scrollTo("my-courses")}
      />

      <main className="relative z-10">
        {/* Netflix-Style Split Hero */}
        <section className="mx-auto max-w-[1440px] px-4 pb-10 pt-10 sm:px-6 lg:pt-16">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            {/* Left Column: Headline + Course Builder */}
            <div className="lg:col-span-7">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#E50914]/35 bg-[#E50914]/15 px-3.5 py-1 text-xs font-semibold text-red-400">
                <Compass className="h-3.5 w-3.5" />
                Welcome back, {user.name.split(" ")[0]} · EdFlix Studio
              </div>

              <h1 className="text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-5xl xl:text-6xl">
                Turn any topic into a{" "}
                <span className="text-[#E50914]">timed, zero-distraction</span>{" "}
                course.
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
                Pick your exact timeline — from a 2-hour crash course to a 1-week deep dive. EdFlix curates duration-matched YouTube lessons, active-recall unlock quizzes, and an AI tutor.
              </p>

              <form
                onSubmit={handleGenerate}
                className="mt-7 space-y-3 rounded-2xl border border-white/10 bg-[#141414]/95 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.75)] backdrop-blur-xl sm:p-5"
              >
                <label className="sr-only" htmlFor="topic">
                  Course topic
                </label>
                <input
                  id="topic"
                  ref={topicRef}
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Type a topic (e.g. C Programming, React Hooks, DBMS Normalization)..."
                  className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-3.5 text-base text-white placeholder-zinc-500 outline-none transition focus:border-[#E50914]"
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="rounded-lg border border-white/15 bg-[#1c1c1e] px-3.5 py-3 text-sm text-zinc-200 outline-none focus:border-[#E50914]"
                    aria-label="Skill level"
                  >
                    <option value="Beginner">Level: Beginner</option>
                    <option value="Intermediate">Level: Intermediate</option>
                    <option value="Advanced">Level: Advanced</option>
                  </select>

                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="rounded-lg border border-white/15 bg-[#1c1c1e] px-3.5 py-3 text-sm text-zinc-200 outline-none focus:border-[#E50914]"
                    aria-label="Duration"
                  >
                    <option value="2 Hours Crash Course">2 Hours (3 Short Modules)</option>
                    <option value="3 Days">3 Days (4 Modules)</option>
                    <option value="1 Week">7 Days (5 Deep Modules)</option>
                  </select>

                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#E50914] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/25 transition hover:bg-[#f6121d] disabled:opacity-60"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Building...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" /> Build Roadmap
                      </>
                    )}
                  </button>
                </div>

                {errorMsg && (
                  <p className="break-words rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">
                    {errorMsg}
                  </p>
                )}
              </form>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Quick Try:</span>
                {CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => fillChip(chip)}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-zinc-300 transition hover:border-[#E50914]/60 hover:bg-[#E50914]/15 hover:text-white"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Clean 3D Tilt Live Syllabus Preview */}
            <div className="lg:col-span-5">
              <Interactive3DStage
                topicPreview={topic}
                durationPreview={duration}
                streak={streak}
                xp={xp}
              />
            </div>
          </div>
        </section>

        {/* Stats Strip */}
        <section className="mx-auto max-w-[1440px] px-4 pb-6 sm:px-6" aria-label="Learning analytics">
          <div className="grid grid-cols-2 divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-[#141414]/85 backdrop-blur-md sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
            {statsCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{card.label}</p>
                    <p className="mt-1 text-2xl font-bold text-white tabular-nums">{card.value}</p>
                    <p className="text-[11px] text-zinc-500">{card.hint}</p>
                  </div>
                  <span className={`grid h-10 w-10 place-items-center rounded-lg bg-white/5 ${card.color}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Featured Netflix-Style Row */}
        <section id="discover" className="mx-auto max-w-[1440px] scroll-mt-24 px-4 py-8 sm:px-6">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E50914]">Trending on EdFlix</p>
              <h2 className="text-2xl font-bold text-white">Featured Roadmaps</h2>
            </div>
            <p className="hidden text-sm text-zinc-400 sm:block">Click any track to launch theater</p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {STARTER_COURSES.map((course) => {
              const saved = courses.find((c) => c.id === course.id);
              const prog = saved ? getProgress(saved) : 0;
              const cover = course.modules[0]?.thumbnail;
              return (
                <TiltCard3D
                  key={course.id}
                  onClick={() => openCourse(saved ?? course)}
                  className="group cursor-pointer rounded-xl border border-white/10 bg-[#141414] shadow-xl"
                >
                  <div className="relative h-44 w-full overflow-hidden bg-zinc-900">
                    {cover ? (
                      <img
                        src={cover}
                        alt={course.topic}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-black/30" />
                    <span className="absolute left-3 top-3 rounded-md bg-[#E50914] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      Top Pick
                    </span>
                    <span className="absolute right-3 top-3 rounded-md border border-white/15 bg-black/70 px-2 py-0.5 text-[11px] font-medium text-zinc-200">
                      {course.level}
                    </span>
                  </div>
                  <div className="space-y-2 p-4">
                    <h3 className="text-base font-bold text-white transition group-hover:text-[#E50914]">
                      {course.topic}
                    </h3>
                    <p className="line-clamp-2 text-xs leading-relaxed text-zinc-400">{course.description}</p>
                    <div className="flex items-center justify-between pt-1 text-xs text-zinc-300">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-[#E50914]" /> {course.duration}
                      </span>
                      <span className="text-zinc-400">{course.modules.length} modules</span>
                    </div>
                    {prog > 0 && (
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full bg-[#E50914]" style={{ width: `${prog}%` }} />
                      </div>
                    )}
                  </div>
                </TiltCard3D>
              );
            })}
          </div>
        </section>

        {/* User Library */}
        <section id="my-courses" className="mx-auto max-w-[1440px] scroll-mt-24 px-4 py-6 sm:px-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white">
              <Clock className="h-5 w-5 text-[#E50914]" /> My List
              <span className="text-sm font-medium text-zinc-500">({courses.length})</span>
            </h2>
            {courses.length > 0 && (
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your courses..."
                  className="w-full rounded-lg border border-white/10 bg-[#141414] py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-[#E50914]"
                />
              </div>
            )}
          </div>

          {courses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-12 text-center text-sm text-zinc-400">
              Your list is empty. Generate a topic above, or start one of the featured roadmaps.
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center text-sm text-zinc-400">
              No courses match &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredCourses.map((course) => {
                const prog = getProgress(course);
                const cover = course.modules.find((m) => m.thumbnail)?.thumbnail;
                return (
                  <TiltCard3D
                    key={course.id}
                    onClick={() => openCourse(course)}
                    className="flex cursor-pointer flex-col rounded-xl border border-white/10 bg-[#141414] shadow-xl"
                  >
                    <div className="relative h-40 w-full overflow-hidden bg-zinc-900">
                      {cover ? (
                        <img src={cover} alt={course.topic} className="h-40 w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950 text-xs text-zinc-500">
                          {course.topic}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#E50914]">
                          {course.level} · {course.duration}
                        </span>
                        <div className="flex items-center gap-2">
                          {prog === 100 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCertificateCourse(course);
                              }}
                              className="inline-flex items-center gap-1 rounded-md bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300 hover:bg-amber-400/25"
                            >
                              <Trophy className="h-3 w-3" /> Certificate
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => deleteCourse(course.id, e)}
                            className="text-zinc-500 hover:text-[#E50914]"
                            title="Delete course"
                            aria-label={`Delete ${course.topic}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <h3 className="mb-1 text-lg font-bold text-white">{course.topic}</h3>
                      <p className="mb-4 line-clamp-2 text-xs text-zinc-400">{course.description}</p>
                      <div className="mt-auto">
                        <div className="mb-1.5 flex justify-between text-xs text-zinc-400">
                          <span>{course.modules.length} modules</span>
                          <span>{prog}% complete</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full bg-[#E50914]" style={{ width: `${prog}%` }} />
                        </div>
                      </div>
                    </div>
                  </TiltCard3D>
                );
              })}
            </div>
          )}
        </section>

        <footer className="mx-auto max-w-[1440px] px-4 py-10 text-center text-xs text-zinc-500 sm:px-6">
          EdFlix · AI Smart Learning · NIET PBL · Group A-06 · SDG 4 & SDG 9
        </footer>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0a0a0c]/95 px-4 py-2.5 backdrop-blur-xl md:hidden" aria-label="Mobile">
        <div className="mx-auto flex max-w-lg justify-around">
          <button type="button" className="text-xs font-semibold text-zinc-300 hover:text-[#E50914]" onClick={() => scrollTo("discover")}>
            Discover
          </button>
          <button type="button" className="text-xs font-semibold text-zinc-300 hover:text-[#E50914]" onClick={() => scrollTo("my-courses")}>
            My Courses
          </button>
        </div>
      </nav>
      {modals}
    </div>
  );
}