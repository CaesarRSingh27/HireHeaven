import express, { json } from "express";
import cloudinary from "cloudinary";
import crypto from "crypto";
import rateLimit from "express-rate-limit";

const router = express.Router();

// ---- protection helpers -------------------------------------------------
// /upload and /delete are for other backend services only. They require the
// shared INTERNAL_API_KEY, and nginx additionally refuses to route them.
const requireInternalKey: express.RequestHandler = (req, res, next) => {
  const expected = process.env.INTERNAL_API_KEY;
  const provided = req.headers["x-internal-key"];

  if (
    !expected ||
    typeof provided !== "string" ||
    provided.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
  ) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  next();
};

// The AI endpoints are public (resume analyser is on the home page), so they
// are rate limited to protect the Gemini quota.
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many requests, please try again in a minute" },
});

const ALLOWED_DATA_URI = /^data:(application\/pdf|image\/(png|jpeg|webp));base64,/;

router.post("/upload", requireInternalKey, async (req, res) => {
  try {
    const { buffer, public_id } = req.body;

    if (typeof buffer !== "string" || !ALLOWED_DATA_URI.test(buffer)) {
      return res
        .status(400)
        .json({ message: "buffer must be a PDF/PNG/JPEG/WEBP data URI" });
    }

    if (public_id) {
      await cloudinary.v2.uploader.destroy(public_id);
    }

    const cloud = await cloudinary.v2.uploader.upload(buffer);

    res.json({
      url: cloud.secure_url,
      public_id: cloud.public_id,
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.post("/delete", requireInternalKey, async (req, res) => {
  try {
    const { public_id } = req.body;

    if (!public_id || typeof public_id !== "string") {
      return res.status(400).json({ message: "public_id is required" });
    }

    await cloudinary.v2.uploader.destroy(public_id);

    res.json({ message: "Deleted" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

import { GoogleGenAI, type GenerateContentParameters } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY_GEMINI });
const GEMINI_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.5-flash-lite",
];

async function generateAIContent(contents: GenerateContentParameters["contents"]) {
  let lastError: unknown;

  for (const model of GEMINI_MODELS) {
    try {
      return await ai.models.generateContent({ model, contents });
    } catch (error) {
      const details = error as { status?: number; code?: number; message?: string };
      const status = Number(details.status ?? details.code);
      const message = details.message ?? String(error);

      if (
        ![404, 429, 503].includes(status) &&
        !/NOT_FOUND|RESOURCE_EXHAUSTED|UNAVAILABLE/i.test(message)
      ) {
        throw error;
      }

      lastError = error;
    }
  }

  throw lastError;
}

router.post("/career", aiLimiter, async (req, res) => {
  try {
    const { skills } = req.body;

    if (!skills || JSON.stringify(skills).length > 2000) {
      return res.status(400).json({
        message: "Skills Required",
      });
    }

    const prompt = ` 
Based on the following skills: ${skills}. 
 
Please act as a career advisor and generate a career path suggestion. 
Your entire response must be in a valid JSON format. Do not include any text or markdown 
formatting outside of the JSON structure. 
 
The JSON object should have the following structure: 
{ 
 "summary": "A brief, encouraging summary of the user's skill set and their general job 
title.", 
 "jobOptions": [ 
 { 
"title": "The name of the job role.", 
"responsibilities": "A description of what the user would do in this role.", 
"why": "An explanation of why this role is a good fit for their skills." 
 } 
 ], 
 "skillsToLearn": [ 
 { 
"category": "A general category for skill improvement (e.g., 'Deepen Your Existing Stack 
Mastery', 'DevOps & Cloud').", 
"skills": [ 
 { 
 "title": "The name of the skill to learn.", 
 "why": "Why learning this skill is important.", 
 "how": "Specific examples of how to learn or apply this skill." 
 } 
] 
 } 
 ], 
 "learningApproach": { 
"title": "How to Approach Learning", 
"points": ["A bullet point list of actionable advice for learning."] 
 } 
} 
 `;

    const response = await generateAIContent(prompt);

    let jsonResponse;

    try {
      const rawText = response.text
        ?.replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      if (!rawText) {
        throw new Error("Ai did not return a valid text response.");
      }

      jsonResponse = JSON.parse(rawText);
    } catch (error) {
      return res.status(500).json({
        message: "Ai returned response that was not valid JSON",
        rawResponse: response.text,
      });
    }

    res.json(jsonResponse);
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.post("/resume-analyser", aiLimiter, async (req, res) => {
  try {
    const { pdfBase64 } = req.body;

    if (
      !pdfBase64 ||
      typeof pdfBase64 !== "string" ||
      pdfBase64.length > 35 * 1024 * 1024
    ) {
      return res.status(400).json({ message: "PDF data is required" });
    }

    const prompt = ` 
You are an expert ATS (Applicant Tracking System) analyzer. Analyze the following resume 
and provide: 
1. An ATS compatibility score (0-100) 
2. Detailed suggestions to improve the resume for better ATS performance 
 
Your entire response must be in valid JSON format. Do not include any text or markdown 
formatting outside of the JSON structure. 
 
The JSON object should have the following structure: 
{ 
  "atsScore": 85, 
  "scoreBreakdown": { 
    "formatting": { 
      "score": 90, 
      "feedback": "Brief feedback on formatting" 
    }, 
    "keywords": { 
      "score": 80, 
      "feedback": "Brief feedback on keyword usage" 
    }, 
    "structure": { 
      "score": 85, 
      "feedback": "Brief feedback on resume structure" 
    }, 
    "readability": { 
      "score": 88, 
      "feedback": "Brief feedback on readability" 
    } 
  }, 
  "suggestions": [ 
    { 
      "category": "Category name (e.g., 'Formatting', 'Content', 'Keywords', 
'Structure')", 
      "issue": "Description of the issue found", 
      "recommendation": "Specific actionable recommendation to fix it", 
      "priority": "high/medium/low" 
    } 
  ], 
  "strengths": [ 
    "List of things the resume does well for ATS" 
  ], 
  "summary": "A brief 2-3 sentence summary of the overall ATS performance" 
} 
 
Focus on: - File format and structure compatibility - Proper use of standard section headings - Keyword optimization - Formatting issues (tables, columns, graphics, special characters) - Contact information placement - Date formatting - Use of action verbs and quantifiable achievements - Section organization and flow 
`;

    const response = await generateAIContent([
        {
          role: "user",
          parts: [
            {
              text: prompt,
            },
            {
              inlineData: {
                mimeType: "application/pdf",
                data: pdfBase64.replace(/^data:application\/pdf;base64,/, ""),
              },
            },
          ],
        },
      ]);

    let jsonResponse;

    try {
      const rawText = response.text
        ?.replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      if (!rawText) {
        throw new Error("Ai did not return a valid text response.");
      }

      jsonResponse = JSON.parse(rawText);
    } catch (error) {
      return res.status(500).json({
        message: "Ai returned response that was not valid JSON",
        rawResponse: response.text,
      });
    }

    res.json(jsonResponse);
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
    });
  }
});

export default router;
