import { NextRequest, NextResponse } from "next/server";

function buildSmartFallbackAnswer(
  question: string,
  courseTopic: string,
  moduleTitle: string,
  moduleSummary: string
) {
  const q = question.toLowerCase();

  // Specific question checks FIRST (before generic words like "syntax" or "code")
  if (q.includes("first step") || q.includes("starting with") || q.includes("begin")) {
    return `The best first step when starting with ${courseTopic} is to **master the core fundamentals and setup**. Skipping straight to deployment or memorizing syntax without practice creates gaps—build a small working example right away to lock in the basics!`;
  }

  if (q.includes("learning approach") || q.includes("faster mastery")) {
    return `**Structured modules with active recall quizzes** (plus hands-on practice) lead to the fastest mastery of ${courseTopic}. Passive watching or jumping randomly between videos rarely sticks.`;
  }

  if (q.includes("structured roadmap") || q.includes("roadmap useful")) {
    return `A structured roadmap is useful for ${courseTopic} because **it builds concepts step-by-step without gaps**, making sure you master the foundations before tackling harder topics.`;
  }

  if (q.includes("core concepts") && q.includes("early")) {
    return `You should focus on core concepts in ${courseTopic} early on because **advanced topics depend directly on them**. Strong basics make debugging and building real projects much easier.`;
  }

  if (q.includes("common beginner mistakes") || q.includes("avoid")) {
    return `The best way to avoid common beginner mistakes in ${courseTopic} is **by reading error messages carefully and practicing step-by-step** instead of skipping debugging or copying without understanding.`;
  }

  if (q.includes("complex") && q.includes("problem")) {
    return `The best way to tackle a complex ${courseTopic} problem is to **break it into smaller, manageable sub-problems** and test each piece as you build it.`;
  }

  if (q.includes("testing") && q.includes("important")) {
    return `Testing your work in ${courseTopic} is important because **it catches edge cases and logic bugs early**, before they turn into bigger issues.`;
  }

  if (q.includes("best practices")) {
    return `Professionals follow best practices in ${courseTopic} **to make their work easier to maintain, debug, and scale** over time.`;
  }

  if (q.includes("mini-project")) {
    return `The biggest benefit of building a mini-project in ${courseTopic} is that **it proves you can apply concepts end-to-end** in a real-world scenario.`;
  }

  if (q.includes("what is syntax") || (q.includes("syntax") && q.length < 40)) {
    return `In ${courseTopic}, **syntax** is the exact set of grammar rules and structure the compiler/runtime expects (like semicolons, brackets, indentation, and keywords). Follow the patterns shown in "${moduleTitle}" and practice typing small snippets yourself.`;
  }

  if (q.includes("example") || q.includes("code")) {
    return `For "${moduleTitle}" in ${courseTopic}, start with a minimal working example: define a small input, apply the core concept from this lesson, and print the output to verify it step-by-step.`;
  }

  return `Good question! In "${moduleTitle}" for ${courseTopic}, the key idea is to connect theory directly to practice: ${moduleSummary} Try testing a small example in your editor and then use the Unlock Quiz to verify your understanding.`;
}

async function callGeminiTutor(prompt: string, geminiKey: string) {
  const models = ["gemini-3.8-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"];

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (answer) return answer;
      }
    } catch {
      // Try next model or fallback
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { question, courseTopic, moduleTitle, moduleSummary } = await req.json();

    if (!question?.trim()) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey) {
      const prompt = `You are EdFlix AI Tutor, a friendly, concise tutor helping a college student.
Course: ${courseTopic}
Current Module: ${moduleTitle}
Module Context: ${moduleSummary}

Student Question: "${question}"

Give a direct, accurate, beginner-friendly answer in 2-4 sentences.`;

      const aiAnswer = await callGeminiTutor(prompt, geminiKey);
      if (aiAnswer) {
        return NextResponse.json({ answer: aiAnswer });
      }
    }

    const fallbackAnswer = buildSmartFallbackAnswer(
      question,
      courseTopic || "this topic",
      moduleTitle || "this module",
      moduleSummary || "this lesson covers the core fundamentals."
    );

    return NextResponse.json({ answer: fallbackAnswer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error" }, { status: 500 });
  }
}