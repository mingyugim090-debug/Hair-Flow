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
      className={`relative rounded-2xl transition-all duration-500 ${
        dragActive
          ? "border-2 border-rose bg-rose/5 soft-shadow-lg"
          : preview
          ? "border border-clay/20 bg-white soft-shadow"
          : "border border-dashed border-clay/30 bg-white/60 hover:border-rose/30 hover:bg-white soft-shadow"
      }`}
    >
      {preview ? (
        <div className="relative aspect-[3/4] overflow-hidden m-2 rounded-xl">
          <img src={preview} alt={label} className="w-full h-full object-cover" />
          <button
            onClick={() => onImageSelect("")}
            className="absolute top-3 right-3 w-8 h-8 bg-charcoal/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white/80 hover:text-white transition-colors text-[12px]"
          >
            ✕
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center p-10 cursor-pointer min-h-[240px]">
          <div className="w-14 h-14 border border-clay/20 rounded-2xl flex items-center justify-center mb-4 bg-ivory">
            <span className="text-rose/50 text-[22px]">+</span>
          </div>
          <p className="text-[14px] font-light text-deep-brown mb-1">{label}</p>
          {description && <p className="text-[12px] text-warm-taupe text-center font-light">{description}</p>}
          <span className="mt-5 px-6 py-2.5 bg-rose/10 text-rose text-[11px] tracking-[2px] uppercase rounded-xl hover:bg-rose hover:text-white transition-all duration-500">
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
