"use client";

import { useState } from "react";

export function FileUploadSection() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage("Processing your materials...");

    // Simulate processing delay
    setTimeout(() => {
      setMessage("✓ Materials uploaded! Study plan ready for preview.");
      setTimeout(() => setMessage(""), 3000);
      setUploading(false);
    }, 1500);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const input = document.getElementById("file-input") as HTMLInputElement;
      input.files = files;
      handleFileUpload({ target: input } as any);
    }
  };

  return (
    <div
      className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition-colors hover:border-slate-400 hover:bg-slate-100"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="mb-4">
        <svg
          className="mx-auto h-12 w-12 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-900">Upload Course Materials</h3>
      <p className="mt-2 text-sm text-slate-600">
        Drag and drop your notes, PDFs, or study guides here, or click to select files
      </p>
      <div className="mt-4 flex items-center justify-center gap-2">
        <input
          id="file-input"
          type="file"
          accept=".txt,.pdf,.md,.docx"
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
        />
        <button
          onClick={() => document.getElementById("file-input")?.click()}
          disabled={uploading}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Select Files"}
        </button>
      </div>
      {message && (
        <p className={`mt-3 text-sm ${message.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
