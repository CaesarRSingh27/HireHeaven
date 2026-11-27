"use client";

import axios from "axios";
import Cookies from "js-cookie";
import { useState } from "react";
import toast from "react-hot-toast";
import { user_service } from "@/context/AppContext";

export default function ResumeDownload({ applicationId, className, children = "Download resume" }: {
  applicationId?: number;
  className?: string;
  children?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function download() {
    const path = applicationId === undefined ? "/resume" : `/application/${applicationId}/resume`;
    setBusy(true);
    try {
      const { data } = await axios.get<Blob>(`${user_service}/api/user${path}`, {
        responseType: "blob",
        headers: { Authorization: `Bearer ${Cookies.get("token") ?? ""}` },
      });
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      const format = data.type.split("/")[1];
      link.download = `resume.${["jpeg", "png", "webp"].includes(format) ? format : "pdf"}`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      const response = axios.isAxiosError(error) ? error.response?.data : null;
      const detail = response instanceof Blob ? await response.text().then(JSON.parse).catch(() => null) : null;
      toast.error(typeof detail?.message === "string" ? detail.message : "Could not download this resume. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <button type="button" className={className} disabled={busy} onClick={() => void download()}>
    {busy ? "Downloading…" : children}
  </button>;
}
