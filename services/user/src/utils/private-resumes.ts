import axios from "axios";
import { pipeline } from "node:stream/promises";
import type { Readable } from "node:stream";
import type { Response } from "express";
import { sql } from "./db.js";
import ErrorHandler from "./errorHandler.js";

const internal = (action: "upload" | "download" | "migrate") => ({
  url: `${process.env.UPLOAD_SERVICE}/api/utils/private-resumes/${action}`,
  headers: { "x-internal-key": process.env.INTERNAL_API_KEY },
  timeout: 45_000,
});

export async function uploadPrivateResume(file: Express.Multer.File) {
  if (file.mimetype !== "application/pdf" || file.buffer.subarray(0, 5).toString() !== "%PDF-")
    throw new ErrorHandler(400, "Upload a valid PDF resume");

  try {
    const { data } = await axios<{ reference: string }>({
      ...internal("upload"), method: "POST",
      data: { buffer: `data:application/pdf;base64,${file.buffer.toString("base64")}` },
    });
    return data.reference;
  } catch {
    throw new ErrorHandler(502, "Resume storage is temporarily unavailable");
  }
}

export async function sendPrivateResume(reference: string | null | undefined, res: Response) {
  if (!reference) throw new ErrorHandler(404, "Resume unavailable");
  if (!reference.startsWith("resume:"))
    throw new ErrorHandler(409, "This older resume is being moved to private storage or its original file is unavailable");

  const source = await axios<Readable>({
    ...internal("download"), method: "POST", data: { reference },
    responseType: "stream", validateStatus: () => true,
  }).catch(() => {
    throw new ErrorHandler(502, "Resume storage is temporarily unavailable");
  });
  if (source.status !== 200) {
    source.data.destroy();
    throw new ErrorHandler(source.status === 404 ? 404 : 502, "Resume unavailable");
  }
  res.set({
    "Content-Type": source.headers["content-type"],
    "Content-Disposition": source.headers["content-disposition"],
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });
  try {
    await pipeline(source.data, res);
  } catch {
    res.destroy();
  }
}

let running = false;

export async function migrateLegacyResumes() {
  if (running) return;
  running = true;
  let cursor = "";
  let unavailable = 0;
  try {
    while (true) {
      const batch = await sql`SELECT resume FROM (
        SELECT resume FROM users WHERE resume > ${cursor} AND resume NOT LIKE 'resume:%'
        UNION
        SELECT resume FROM applications WHERE resume > ${cursor} AND resume NOT LIKE 'resume:%'
      ) legacy ORDER BY resume LIMIT 50`;
      if (!batch.length) break;
      for (const row of batch) {
        cursor = row.resume;
        try {
          const { data } = await axios<{ reference: string }>({
            ...internal("migrate"), method: "POST", data: { url: cursor },
          });
          await sql`WITH profiles AS (
            UPDATE users SET resume=${data.reference}, resume_public_id=NULL WHERE resume=${cursor}
          ) UPDATE applications SET resume=${data.reference} WHERE resume=${cursor}`;
        } catch {
          unavailable++;
        }
      }
    }
    if (unavailable) console.warn(`${unavailable} legacy resume asset(s) could not be secured. The migration will retry.`);
  } catch {
    console.error("Legacy resume migration could not complete");
  } finally {
    running = false;
  }
}
