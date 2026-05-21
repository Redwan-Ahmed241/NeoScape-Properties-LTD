"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  Star,
  Loader2,
  AlertCircle,
  X,
  CheckCircle,
} from "lucide-react";
import { uploadApi, propertyImagesApi } from "../lib/api";
import type { PropertyImageRecord } from "../lib/api";

interface Props {
  propertyName: string;
}

const PropertyImageManager: React.FC<Props> = ({ propertyName }) => {
  const [images, setImages] = useState<PropertyImageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const fetchImages = useCallback(async () => {
    if (!propertyName) return;
    try {
      setLoading(true);
      setError(null);
      const data = await propertyImagesApi.list(propertyName);
      setImages(data);
    } catch (err: any) {
      setError(err.message || "Failed to load property images");
    } finally {
      setLoading(false);
    }
  }, [propertyName]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !propertyName) return;
    try {
      setUploading(true);
      setError(null);
      const result = await uploadApi.uploadImages(e.target.files);
      const urls: string[] = result?.data?.urls || [];
      for (const url of urls) {
        await propertyImagesApi.create({
          property_name: propertyName,
          image_url: url,
          caption: "",
          is_primary: images.length === 0,
          sort_order: images.length,
        });
      }
      await fetchImages();
      showSuccess(`${urls.length} image${urls.length > 1 ? "s" : ""} uploaded`);
    } catch (err: any) {
      setError(err.message || "Failed to upload images");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (img: PropertyImageRecord) => {
    if (!confirm("Remove this property image?")) return;
    try {
      setError(null);
      await propertyImagesApi.remove(img.id);
      setImages((prev) => prev.filter((i) => i.id !== img.id));
      showSuccess("Image removed");
    } catch (err: any) {
      setError(err.message || "Failed to delete image");
    }
  };

  const handleSetPrimary = async (img: PropertyImageRecord) => {
    try {
      setError(null);
      // Unset current primary
      const currentPrimary = images.find((i) => i.is_primary && i.id !== img.id);
      if (currentPrimary) {
        await propertyImagesApi.update(currentPrimary.id, { is_primary: false });
      }
      await propertyImagesApi.update(img.id, { is_primary: true });
      await fetchImages();
      showSuccess("Primary image updated");
    } catch (err: any) {
      setError(err.message || "Failed to set primary image");
    }
  };

  if (!propertyName) {
    return (
      <div className="rounded-2xl py-14 text-center" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)" }}>
        <ImageIcon className="w-8 h-8 text-white/10 mx-auto mb-3" />
        <p className="text-white/30 text-sm">Select a property to manage images.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-red-400" style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.15)" }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400/50 hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-emerald-400" style={{ background: "rgba(16,185,129,0.06)", borderColor: "rgba(16,185,129,0.15)" }}>
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> {success}
        </div>
      )}

      {/* Upload area */}
      <label className="cursor-pointer block">
        <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
        <div className={`flex items-center justify-center gap-2 px-4 py-6 border border-dashed rounded-2xl text-sm font-medium transition-all ${uploading ? "border-white/10 text-white/20" : "border-white/15 text-white/40 hover:border-white/30 hover:text-white/60"}`}>
          {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Upload Property Images (JPG, PNG, WebP)</>}
        </div>
      </label>

      {/* Loading */}
      {loading ? (
        <div className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin text-white/20 mx-auto" /></div>
      ) : images.length === 0 ? (
        <div className="rounded-2xl py-14 text-center" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)" }}>
          <ImageIcon className="w-8 h-8 text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">No property images yet.</p>
          <p className="text-white/20 text-xs mt-1">Upload images to showcase this property.</p>
        </div>
      ) : (
        /* Image grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((img) => (
            <div
              key={String(img.id)}
              className="group relative rounded-xl overflow-hidden aspect-[4/3]"
              style={{ background: "var(--surface-3)", border: "1px solid var(--border-subtle)" }}
            >
              <img
                src={img.image_url}
                alt={img.caption || propertyName}
                className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-500"
                onClick={() => setPreviewUrl(img.image_url)}
              />
              {/* Primary badge */}
              {img.is_primary && (
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium text-amber-300 flex items-center gap-1" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Primary
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                {!img.is_primary && (
                  <button
                    onClick={() => handleSetPrimary(img)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="Set as primary"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(img)}
                  className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-300 transition-colors"
                  title="Delete image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] mx-4">
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute -top-3 -right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyImageManager;
