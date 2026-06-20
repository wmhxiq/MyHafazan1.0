"use client";
import { useState } from "react";
import { IconPlus, IconUpload } from "./icons";
import { useDropzone } from "react-dropzone";

type PhotoUploadProps = {
  id: string;
  type: "staf" | "pelajar";
  currentUrl?: string;
  onUploadComplete: (url: string) => void;
};

export default function PhotoUpload({
  id,
  type,
  currentUrl,
  onUploadComplete,
}: PhotoUploadProps) {
  const [preview, setPreview] = useState(currentUrl || "");
  const [uploading, setUploading] = useState(false);

  const processFile = async (file: File) => {
    //const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Sila pilih fail imej (JPG/PNG)");
      return;
    }

    // Validate file size (max 50KB)
    if (file.size > 50 * 1024) {
      alert("Saiz fail terlalu besar. Maksimum 50KB.");
      return;
    }

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    // Upload to DigitalOcean Spaces
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("id", id);
    formData.append("type", type);

    try {
      const res = await fetch("/api/upload-photo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      console.log("UPLOAD RESPONSE:", data);
      console.log(data.url);

      if (data.error) {
        alert("Gagal memuat naik: " + data.error);
        setUploading(false);
        return;
      }

      onUploadComplete(data.url);
    } catch (err) {
      alert("Ralat semasa memuat naik gambar");
    }

    setUploading(false);
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    noClick: true,
    multiple: false,
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,

    accept: {
      "image/jpeg": [],
      "image/png": [],
    },

    onDropAccepted: ([file]) => {
      processFile(file);
    },

    onDropRejected: () => {
      alert("Hanya JPG, PNG, WEBP dibenarkan. Maksimum 5MB.");
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center gap-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        {/* Avatar Preview */}
        <div className="relative group">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-gray-100">
            {preview ? (
              <img
                src={preview}
                alt="Profile Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-400 text-xs text-center px-2">
                Tiada Gambar
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={open}
            disabled={uploading}
            className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-indigo-800 text-white shadow-lg transition hover:bg-blue-700"
          >
            <IconPlus />
          </button>
        </div>

        {/* Upload Info */}
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">Gambar Profil</h3>
          <div
            {...getRootProps()}
            className={`
              mt-3 cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition
              ${
                isDragActive
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-300 bg-gray-50 hover:border-indigo-500 hover:bg-indigo-50"
              }
            `}
          >
            <input {...getInputProps()} />

            <div className="mb-3 flex justify-center text-indigo-600">
              <IconUpload />
            </div>

            <p className="font-medium text-gray-700">
              {isDragActive
                ? "Lepaskan gambar di sini"
                : "Seret gambar ke sini"}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              atau klik ikon (+) pada gambar profil
            </p>

            <p className="mt-2 text-xs text-gray-400">
              JPG, JPEG, PNG • Maksimum 5MB
            </p>
          </div>

          {uploading && (
            <div className="mt-3">
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-600" />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Memuat naik gambar...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
