import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { CourseModel } from "@/models/Course";

function getDurationConfig(duration: string) {
  const d = duration.toLowerCase();
  if (d.includes("hour") || d.includes("quick")) {
    return {
      moduleCount: 3,
      videoDuration: "medium", // 4-20 min videos (fits 2 hours total)
      queryHint: "crash course concise",
    };
  }
  if (d.includes("1 day") || d.includes("3 day")) {
    return {
      moduleCount: 4,
      videoDuration: "medium", // 4-20 min focused tutorials
      queryHint: "tutorial explained",
    };
  }
  return {
    moduleCount: 5,
    videoDuration: "long", // >20 min deep-dive lectures for 7+ days
    queryHint: "full in-depth tutorial",
  };
}

async function fetchYouTubeVideo(
  query: string,
  apiKey: string,
  videoDuration: string,
  usedVideoIds: Set<string>
) {
  const tryFetch = async (withDuration: boolean) => {
    const durationParam = withDuration ? `&videoDuration=${videoDuration}` : "";
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true${durationParam}&maxResults=6&q=${encodeURIComponent(
      query
    )}&key=${apiKey}`;

    const res = await fetch(url);
    if (!res.ok) {
      const errText = await res.text();
      console.error("YouTube API Error:", res.status, errText);
      return null;
    }

    const data = await res.json();
    const items = data.items || [];

    // Pick first unique video not already used in another module
    const chosen =
      items.find((item: any) => item?.id?.videoId && !usedVideoIds.has(item.id.videoId)) ||
      items[0];

    if (!chosen?.id?.videoId) return null;

    usedVideoIds.add(chosen.id.videoId);
    return {
      videoId: chosen.id.videoId,
      channelTitle: chosen.snippet.channelTitle || "YouTube Educator",
      thumbnail:
        chosen.snippet.thumbnails?.high?.url ||
        chosen.snippet.thumbnails?.default?.url ||
        "",
    };
  };

  try {
    // First try with strict duration filter; if 0 results, retry without duration filter
    const result = await tryFetch(true);
    if (result) return result;
    return await tryFetch(false);
  } catch (err) {
    console.error("YouTube fetch error:", err);
    return null;
  }
}

function buildSmartFallbackSyllabus(
  topic: string,
  level: string,
  duration: string,
  moduleCount: number,
  queryHint: string
) {
  const cleanTopic = topic.trim();
  const allModules = [
    {
      id: 1,
      title: `Introduction & Setup for ${cleanTopic}`,
      summary: `Understand why ${cleanTopic} matters, set up your environment, and learn the core building blocks for ${level.toLowerCase()} learners.`,
      searchQuery: `${cleanTopic} introduction basics ${queryHint}`,
      keyTakeaways: [
        `Core purpose and real-world use cases of ${cleanTopic}`,
        `Setting up the tools and workflow properly`,
        `Understanding foundational terminology`,
      ],
      quiz: [
        {
          question: `What is the best first step when starting with ${cleanTopic}?`,
          options: [
            "Master the core fundamentals and setup",
            "Skip directly to production deployment",
            "Memorize random syntax without practice",
            "Avoid building small examples",
          ],
          correctIndex: 0,
        },
        {
          question: `Which learning approach leads to faster mastery of ${cleanTopic}?`,
          options: [
            "Passive watching without practice",
            "Structured modules with active recall quizzes",
            "Jumping randomly between unrelated videos",
            "Ignoring core concepts",
          ],
          correctIndex: 1,
        },
        {
          question: `Why is a structured roadmap useful for ${cleanTopic}?`,
          options: [
            "It adds unnecessary complexity",
            "It removes all practical work",
            "It builds concepts step-by-step without gaps",
            "It replaces hands-on practice",
          ],
          correctIndex: 2,
        },
      ],
    },
    {
      id: 2,
      title: `Core Concepts & Syntax in ${cleanTopic}`,
      summary: `Dive into the essential rules, structures, and everyday patterns you will use constantly in ${cleanTopic}.`,
      searchQuery: `${cleanTopic} core concepts syntax ${queryHint}`,
      keyTakeaways: [
        `Key building blocks and how they interact`,
        `Common mistakes beginners make and how to avoid them`,
        `Writing clean, readable, and logical solutions`,
      ],
      quiz: [
        {
          question: `Why should you focus on core concepts in ${cleanTopic} early on?`,
          options: [
            "Advanced topics depend directly on them",
            "They are only needed for exams",
            "They are never used in real projects",
            "They slow down your progress",
          ],
          correctIndex: 0,
        },
        {
          question: `What is a good habit when learning new ${cleanTopic} concepts?`,
          options: [
            "Never test your understanding",
            "Test small examples immediately after watching",
            "Skip debugging errors",
            "Copy without reading",
          ],
          correctIndex: 1,
        },
        {
          question: `How do you avoid common beginner mistakes in ${cleanTopic}?`,
          options: [
            "By ignoring error messages",
            "By skipping documentation",
            "By reading errors carefully and practicing step-by-step",
            "By switching topics every 5 minutes",
          ],
          correctIndex: 2,
        },
      ],
    },
    {
      id: 3,
      title: `Practical Problem Solving in ${cleanTopic}`,
      summary: `Apply your knowledge of ${cleanTopic} to solve realistic problems and connect multiple concepts together.`,
      searchQuery: `${cleanTopic} practical examples exercises ${queryHint}`,
      keyTakeaways: [
        `Breaking down a problem into smaller steps`,
        `Combining core features to build working logic`,
        `Testing and verifying your outputs`,
      ],
      quiz: [
        {
          question: `What is the best way to tackle a complex ${cleanTopic} problem?`,
          options: [
            "Break it into smaller, manageable sub-problems",
            "Write everything at once without testing",
            "Guess until it works",
            "Avoid planning",
          ],
          correctIndex: 0,
        },
        {
          question: `Why is testing your work important in ${cleanTopic}?`,
          options: [
            "It wastes time",
            "It catches edge cases and logic bugs early",
            "It is only for senior engineers",
            "It makes the solution slower",
          ],
          correctIndex: 1,
        },
        {
          question: `What turns theoretical ${cleanTopic} knowledge into real skill?`,
          options: [
            "Only reading slides",
            "Watching videos at 3x speed",
            "Hands-on problem solving and building",
            "Skipping exercises",
          ],
          correctIndex: 2,
        },
      ],
    },
    {
      id: 4,
      title: `Intermediate Patterns & Best Practices`,
      summary: `Level up your ${cleanTopic} skills with industry best practices, optimization techniques, and cleaner architecture.`,
      searchQuery: `${cleanTopic} intermediate best practices ${queryHint}`,
      keyTakeaways: [
        `Writing maintainable and scalable solutions`,
        `Performance and efficiency considerations`,
        `Industry-standard patterns used by professionals`,
      ],
      quiz: [
        {
          question: `Why do professionals follow best practices in ${cleanTopic}?`,
          options: [
            "To make work easier to maintain, debug, and scale",
            "To make simple things complicated",
            "Only to impress interviewers",
            "Because it is legally required",
          ],
          correctIndex: 0,
        },
        {
          question: `When should you optimize a solution in ${cleanTopic}?`,
          options: [
            "Before understanding the problem",
            "After making it work cleanly and identifying bottlenecks",
            "Never",
            "By deleting readability",
          ],
          correctIndex: 1,
        },
        {
          question: `What makes a ${cleanTopic} project look production-ready?`,
          options: [
            "Hardcoded values everywhere",
            "No error handling",
            "Clean structure, edge-case handling, and clear logic",
            "Random file names",
          ],
          correctIndex: 2,
        },
      ],
    },
    {
      id: 5,
      title: `Mini-Project & Real-World Mastery`,
      summary: `Bring everything together by building a complete mini-project in ${cleanTopic} for your portfolio.`,
      searchQuery: `${cleanTopic} project build ${queryHint}`,
      keyTakeaways: [
        `End-to-end project planning and execution`,
        `Integrating all core concepts`,
        `Explaining your architecture confidently`,
      ],
      quiz: [
        {
          question: `What is the biggest benefit of building a mini-project in ${cleanTopic}?`,
          options: [
            "It proves you can apply concepts end-to-end",
            "It replaces learning basics",
            "It requires zero debugging",
            "It is only for decoration",
          ],
          correctIndex: 0,
        },
        {
          question: `How should you present your ${cleanTopic} project in a demo?`,
          options: [
            "Read every line of code silently",
            "Explain the problem, your solution, and show a live working demo",
            "Skip the live demo",
            "Avoid talking about challenges",
          ],
          correctIndex: 1,
        },
        {
          question: `After finishing this ${cleanTopic} roadmap, what is the best next step?`,
          options: [
            "Stop practicing completely",
            "Delete your project",
            "Build a second custom project and deploy it",
            "Forget the fundamentals",
          ],
          correctIndex: 2,
        },
      ],
    },
  ];

  return {
    description: `A focused ${level.toLowerCase()} roadmap to master ${cleanTopic} in ${duration}.`,
    modules: allModules.slice(0, moduleCount),
  };
}

async function callGeminiWithFallback(prompt: string, geminiKey: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 sec timeout

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7,
          },
        }),
      }
    );

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        return JSON.parse(rawText.replace(/```json|```/g, "").trim());
      }
    } else {
      console.error("Gemini API Error:", res.status, await res.text());
    }
  } catch (err) {
    console.error("Gemini request failed:", err);
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { topic, level = "Beginner", duration = "3 Days" } = await req.json();

    if (!topic || !topic.trim()) {
      return NextResponse.json({ error: "Please enter a learning topic." }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const youtubeKey = process.env.YOUTUBE_API_KEY;
    const { moduleCount, videoDuration, queryHint } = getDurationConfig(duration);

    const prompt = `You are an expert curriculum designer for EdFlix.
Create a structured ${moduleCount}-module learning roadmap for:
- Topic: "${topic}"
- Skill Level: "${level}"
- Target Duration: "${duration}"

IMPORTANT:
- Every module title, summary, quiz, and searchQuery MUST be strictly about "${topic}".
- Tailor the depth and searchQuery for "${duration}" (e.g., concise crash-course videos for 2 Hours, deeper tutorials for 7 Days).

Return ONLY valid JSON (no markdown, no code fences) in this exact schema:
{
  "description": "A short 1-sentence motivating overview of this course.",
  "modules": [
    {
      "id": 1,
      "title": "Short clear module title specific to ${topic}",
      "summary": "2-sentence explanation of what the learner will master in this module.",
      "searchQuery": "Exact YouTube search query for ${topic} ${queryHint}",
      "keyTakeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"],
      "quiz": [
        {
          "question": "Clear conceptual MCQ question about ${topic}?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctIndex": 0
        },
        {
          "question": "Second MCQ question about ${topic}?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctIndex": 1
        },
        {
          "question": "Third MCQ question about ${topic}?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctIndex": 2
        }
      ]
    }
  ]
}`;

    let parsed = geminiKey ? await callGeminiWithFallback(prompt, geminiKey) : null;

    if (!parsed || !Array.isArray(parsed.modules) || parsed.modules.length === 0) {
      console.warn("Gemini unavailable — using Smart Fallback Syllabus + Real YouTube API.");
      parsed = buildSmartFallbackSyllabus(topic, level, duration, moduleCount, queryHint);
    }

    // Fetch unique, duration-matched YouTube videos sequentially to prevent duplicates
    const usedVideoIds = new Set<string>();
    const modulesWithVideos = [];

    for (let idx = 0; idx < parsed.modules.length; idx++) {
      const mod = parsed.modules[idx];
      const searchQ = mod.searchQuery
        ? `${topic} ${mod.searchQuery}`
        : `${topic} ${mod.title} ${queryHint}`;

      const yt = youtubeKey
        ? await fetchYouTubeVideo(searchQ, youtubeKey, videoDuration, usedVideoIds)
        : null;

      modulesWithVideos.push({
        ...mod,
        id: idx + 1,
        videoId: yt?.videoId || "",
        channelTitle: yt?.channelTitle || "YouTube Educator",
        thumbnail: yt?.thumbnail || "",
        unlocked: idx === 0,
        completed: false,
      });
    }

    const newCourse = {
      id: `course_${Date.now()}`,
      topic: topic.trim(),
      level,
      duration,
      description: parsed.description || `Personalized ${level} roadmap for ${topic}.`,
      createdAt: new Date().toISOString(),
      modules: modulesWithVideos,
    };

    const db = await connectDB();
    if (db) {
      try {
        await CourseModel.create(newCourse);
      } catch (dbErr) {
        console.error("MongoDB save skipped:", dbErr);
      }
    }

    return NextResponse.json({ course: newCourse });
  } catch (error: any) {
    console.error("Generate course error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}