"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, Image, Film, CheckCircle } from "lucide-react";
import { fileUrl } from "@/lib/storage";

interface FileUploadProps {
  label: string;
  accept: "image" | "video";
  folder: string;
  value?: string | null;
  onChange: (url: string) => void;
  onClear?: () => void;
}

const ACCEPT_MAP = {
  image: "image/jpeg,image/png,image/webp",
  video: "video/mp4,video/webm,video/quicktime",
};

export function FileUpload({ label, accept, folder, value, onChange, onClear }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      setProgress(30);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      setProgress(80);

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "خطا در آپلود");
        return;
      }

      setProgress(100);
      onChange(data.key);

    } catch {
      setError("خطا در آپلود فایل");
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const Icon = accept === "image" ? Image : Film;

  return (
    <div>
      <label className="block text-xs font-medium mb-1">{label}</label>

      {value ? (
        <div className="relative border border-surface-container rounded-xl overflow-hidden">
          {accept === "image" ? (
            <img src={fileUrl(value)} alt="" className="w-full h-32 object-cover" />
          ) : (
            <div className="flex items-center gap-3 p-3 bg-surface-dim">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
              <p className="text-xs text-on-surface-muted truncate flex-1" dir="ltr">{(value || "").split("/").pop()}</p>
            </div>
          )}
          {onClear && (
            <button
              onClick={() => onClear()}
              className="absolute top-2 left-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-surface-container rounded-xl p-6 flex flex-col items-center gap-2 hover:border-primary/30 transition-colors"
        >
          {uploading ? (
            <>
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <span className="text-xs text-on-surface-muted">در حال آپلود...</span>
              <div className="w-full h-1.5 bg-surface-dim rounded-full overflow-hidden mt-1">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </>
          ) : (
            <>
              <Icon className="w-6 h-6 text-on-surface-muted" />
              <span className="text-xs text-on-surface-muted">
                {accept === "image" ? "انتخاب تصویر" : "انتخاب ویدیو"}
              </span>
              <span className="text-[10px] text-on-surface-muted">
                {accept === "image" ? "JPG, PNG, WebP — حداکثر ۱۰MB" : "MP4, WebM — حداکثر ۵۰۰MB"}
              </span>
            </>
          )}
        </button>
      )}

      {error && <p className="text-xs text-error mt-1">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_MAP[accept]}
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
