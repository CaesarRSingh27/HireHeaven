import { createHash, randomUUID } from "node:crypto";
import { pipeline } from "node:stream/promises";
import { v2 as cloudinary } from "cloudinary";
import { Router, type RequestHandler } from "express";

const folder = "hireheaven-resumes";
const formats = ["pdf", "jpg", "jpeg", "png", "webp"];
const mimeTypes: Record<string, string> = {
  pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg",
  png: "image/png", webp: "image/webp",
};

export function privateResumeRoutes(requireInternalKey: RequestHandler) {
  const router = Router();
  router.use(requireInternalKey);

  router.post("/upload", async (req, res) => {
    const { buffer } = req.body;
    if (typeof buffer !== "string" || !/^data:application\/pdf;base64,JVBERi0/.test(buffer))
      return res.status(400).json({ message: "Upload a valid PDF resume" });

    try {
      const asset = await cloudinary.uploader.upload(buffer, {
        resource_type: "image", type: "authenticated",
        public_id: `${folder}/${randomUUID()}`, overwrite: false,
      });
      return res.json({ reference: `resume:image:pdf:${asset.public_id}` });
    } catch {
      return res.status(502).json({ message: "Resume storage is temporarily unavailable" });
    }
  });

  router.post("/download", async (req, res) => {
    const reference: unknown = req.body.reference;
    const parts = typeof reference === "string"
      ? /^resume:(image|raw):(pdf|jpg|jpeg|png|webp):(hireheaven-resumes\/[\w.-]+)$/.exec(reference)
      : null;
    if (!parts) return res.status(404).json({ message: "Resume unavailable" });

    const [, resourceType, format, publicId] = parts;
    try {
      const url = cloudinary.utils.private_download_url(publicId, resourceType === "raw" ? "" : format, {
        resource_type: resourceType, type: "authenticated", expires_at: Math.floor(Date.now() / 1000) + 60,
      });
      const source = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (!source.ok || !source.body) {
        await source.body?.cancel();
        return res.status(source.status === 404 ? 404 : 502).json({ message: "Resume unavailable" });
      }
      res.set({
        "Content-Type": mimeTypes[format],
        "Content-Disposition": `attachment; filename="resume.${format}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      });
      await pipeline(source.body, res);
    } catch {
      if (!res.headersSent && !res.destroyed)
        return res.status(502).json({ message: "Resume storage is temporarily unavailable" });
      res.destroy();
    }
  });

  router.post("/migrate", async (req, res) => {
    let source: URL;
    try { source = new URL(req.body.url); }
    catch { return res.status(400).json({ message: "Unsupported legacy resume reference" }); }

    const [, cloud, resourceType, assetPath] =
      /^\/([^/]+)\/(image|raw)\/upload\/(?:v\d+\/)?(.+)$/.exec(source.pathname) ?? [];
    const extension = /\.([a-z0-9]+)$/i.exec(assetPath ?? "");
    const format = extension?.[1].toLowerCase();
    if (source.protocol !== "https:" || source.host !== "res.cloudinary.com" ||
      cloud !== cloudinary.config().cloud_name || !format || !formats.includes(format))
      return res.status(400).json({ message: "Unsupported legacy resume reference" });

    const publicId = resourceType === "raw" ? assetPath : assetPath.slice(0, -extension![0].length);
    if (!/^[\w./-]+$/.test(publicId) || publicId.split("/").some(part => !part || part === "." || part === ".."))
      return res.status(400).json({ message: "Unsupported legacy resume reference" });

    const fingerprint = createHash("sha256").update(`${resourceType}:${publicId}`).digest("hex");
    const target = `${folder}/legacy-${fingerprint}${resourceType === "raw" ? `.${format}` : ""}`;
    try {
      await cloudinary.uploader.rename(publicId, target, {
        resource_type: resourceType, type: "upload", to_type: "authenticated",
        invalidate: true, overwrite: false,
      });
    } catch {
      // A retry can reach this path after Cloudinary moved the file but before Postgres recorded it.
      try {
        await cloudinary.api.resource(target, { resource_type: resourceType, type: "authenticated" });
      } catch (error) {
        const missing = (error as { error?: { http_code?: number } }).error?.http_code === 404;
        return res.status(missing ? 404 : 502).json({ message: "Legacy resume could not be secured" });
      }
    }
    return res.json({ reference: `resume:${resourceType}:${format}:${target}` });
  });

  return router;
}
