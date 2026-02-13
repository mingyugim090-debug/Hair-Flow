"use client";

import { useCallback, useState } from "react";

interface ImageUploaderProps {
  label: string;
  description?: string;
  onImageSelect: (base64: string) => void;
  preview?: string | null;
}

export function ImageUploader({ label, description, onImageSelect, preview }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (file.size > 10 * 1024 * 1024) {
        alert("파일 크기는 10MB 이하만 가능합니다.");
        return;
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        alert("JPG, PNG, WEBP 파일만 업로드 가능합니다.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageSelect(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    [onImageSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      className={`relative border transition-all duration-500 ${
        dragActive
          ? "border-gold bg-gold/10"
          : preview
          ? "border-gold/20"
          : "border-gold/10 hover:border-gold/30"
      }`}
    >
      {preview ? (
        <div className="relative aspect-[3/4] overflow-hidden m-2">
          <img src={preview} alt={label} className="w-full h-full object-cover" />
          <button
            onClick={() => onImageSelect("")}
            className="absolute top-3 right-3 w-8 h-8 bg-charcoal/80 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white transition-colors text-[12px]"
          >
            ✕
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center p-10 cursor-pointer min-h-[240px]">
          <div className="w-12 h-12 border border-gold/20 flex items-center justify-center mb-4">
            <span className="text-gold/40 text-[20px]">+</span>
          </div>
          <p className="text-[14px] font-light text-white mb-1">{label}</p>
          {description && <p className="text-[12px] text-white/30 text-center font-light">{description}</p>}
          <span className="mt-5 px-6 py-2 border border-gold/20 text-gold/60 text-[11px] tracking-[2px] uppercase hover:border-gold hover:text-gold transition-all duration-500">
            사진 선택
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
      )}
    </div>
  );
}
