import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUserId } from "@/lib/session";
import { extractTextFromFile, parseResumeText } from "@/lib/parse";
import { scoreAts } from "@/lib/scoring/ats";
import { PLANS, Plan } from "@/lib/constants";

export async function POST(req: Request) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limit = PLANS[(user.plan as Plan) ?? "FREE"].maxResumes;
  const count = await db.resume.count({ where: { userId, isBase: true } });
  if (count >= limit) {
    return NextResponse.json(
      { error: `Your ${user.plan} plan allows ${limit} base resumes. Upgrade to Pro in Settings for more.` },
      { status: 403 }
    );
  }

  let title = "";
  let rawText = "";
  let sourceFileName: string | null = null;

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    title = String(form.get("title") ?? "");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 8 MB)." }, { status: 400 });
    }
    sourceFileName = file.name;
    const buffer = Buffer.from(await file.arrayBuffer());
    try {
      rawText = await extractTextFromFile(file.name, buffer);
    } catch {
      return NextResponse.json({ error: "Could not extract text from this file. Try PDF, DOCX or TXT." }, { status: 422 });
    }
    if (!title) title = file.name.replace(/\.[^.]+$/, "");
  } else {
    const body = await req.json().catch(() => null);
    title = String(body?.title ?? "").trim();
    rawText = String(body?.text ?? "");
  }

  if (rawText.trim().length < 100) {
    return NextResponse.json({ error: "Resume text is too short to analyze (min ~100 characters)." }, { status: 422 });
  }
  if (!title) title = "Untitled resume";

  const parsed = parseResumeText(rawText);
  const resume = await db.resume.create({
    data: {
      userId,
      title,
      sourceFileName,
      rawText,
      parsedJson: JSON.stringify(parsed),
    },
  });

  const ats = scoreAts(parsed, rawText);
  await db.atsReport.create({
    data: { resumeId: resume.id, score: ats.score, breakdownJson: JSON.stringify(ats.breakdown) },
  });

  return NextResponse.json({ id: resume.id, score: ats.score });
}
