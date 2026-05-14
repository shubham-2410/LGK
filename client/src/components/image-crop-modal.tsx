import Cropper from "react-easy-crop";
import { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Crop, ZoomIn, Check, X } from "lucide-react";

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropModalProps {
  file: File;
  defaultAspect?: number;
  onDone: (croppedFile: File) => void;
  onCancel: () => void;
}

const ASPECT_OPTIONS: { label: string; value: number | undefined }[] = [
  { label: "16:9", value: 16 / 9 },
  { label: "4:3", value: 4 / 3 },
  { label: "1:1", value: 1 },
  { label: "Free", value: undefined },
];

const QUALITY_OPTIONS: { label: string; desc: string; quality: number; maxPx: number }[] = [
  { label: "Web", desc: "~100–250 KB, fast loading", quality: 0.80, maxPx: 1280 },
  { label: "High", desc: "~300–700 KB, crisp detail", quality: 0.92, maxPx: 2000 },
];

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("FileReader failed"));
    reader.readAsDataURL(blob);
  });
}

function canBrowserDisplay(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    const cleanup = () => URL.revokeObjectURL(url);
    img.onload = () => { cleanup(); resolve(true); };
    img.onerror = () => { cleanup(); resolve(false); };
    // Timeout safety — some HEIC files stall instead of erroring
    const t = setTimeout(() => { cleanup(); resolve(false); }, 4000);
    img.onload = () => { clearTimeout(t); cleanup(); resolve(true); };
    img.onerror = () => { clearTimeout(t); cleanup(); resolve(false); };
    img.src = url;
  });
}

async function normalizeToDataUrl(file: File): Promise<string> {
  // Step 1: let the browser try to display it natively (works for JPEG, PNG, WebP, GIF
  //         and HEIC on iOS Safari / macOS Safari)
  const nativeOk = await canBrowserDisplay(file);
  if (nativeOk) {
    return blobToDataUrl(file);
  }

  // Step 2: browser can't decode it — try heic2any (HEIC/HEIF converter)
  console.log("[ImageCropModal] Native load failed, trying heic2any for:", file.name, file.type);
  try {
    // Dynamic import handles CJS/ESM interop correctly
    const mod = await import("heic2any");
    const convert: Function = (mod as any).default ?? mod;
    if (typeof convert !== "function") {
      throw new Error("heic2any did not export a function");
    }
    const result = await convert({ blob: file, toType: "image/jpeg", quality: 0.92 });
    const blob: Blob = Array.isArray(result) ? result[0] : result;
    return blobToDataUrl(blob);
  } catch (err) {
    console.error("[ImageCropModal] heic2any failed:", err);
    throw new Error("Could not convert image. Please try saving it as JPEG first.");
  }
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);
    img.setAttribute("crossOrigin", "anonymous");
    img.src = url;
  });
}

async function getCroppedBlob(
  imageSrc: string,
  pixelCrop: CropArea,
  quality: number,
  maxPx: number
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y,
    pixelCrop.width, pixelCrop.height,
    0, 0,
    pixelCrop.width, pixelCrop.height
  );
  const scale = Math.min(1, maxPx / Math.max(canvas.width, canvas.height));
  if (scale < 1) {
    const scaled = document.createElement("canvas");
    scaled.width = Math.round(canvas.width * scale);
    scaled.height = Math.round(canvas.height * scale);
    const sctx = scaled.getContext("2d")!;
    sctx.fillStyle = "#ffffff";
    sctx.fillRect(0, 0, scaled.width, scaled.height);
    sctx.drawImage(canvas, 0, 0, scaled.width, scaled.height);
    return new Promise((res) => scaled.toBlob((b) => res(b!), "image/jpeg", quality));
  }
  return new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", quality));
}

export function ImageCropModal({ file, defaultAspect = 16 / 9, onDone, onCancel }: ImageCropModalProps) {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [loadError, setLoadError] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [aspect, setAspect] = useState<number | undefined>(defaultAspect);
  const [qualityIdx, setQualityIdx] = useState(0);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    setImageSrc("");
    normalizeToDataUrl(file)
      .then((src) => { setImageSrc(src); setLoading(false); })
      .catch((err) => { setLoadError(err.message || "Could not load image."); setLoading(false); });
  }, [file]);

  const onCropComplete = useCallback((_: CropArea, areaPixels: CropArea) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleDone = async () => {
    if (!croppedAreaPixels || !imageSrc) return;
    setProcessing(true);
    try {
      const q = QUALITY_OPTIONS[qualityIdx];
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels, q.quality, q.maxPx);
      const baseName = file.name.replace(/\.[^.]+$/, "");
      const outFile = new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
      onDone(outFile);
    } finally {
      setProcessing(false);
    }
  };

  const loadingMessage = (() => {
    const name = file.name.toLowerCase();
    if (name.endsWith(".heic") || name.endsWith(".heif") || file.type.includes("heic")) {
      return "Converting HEIC → JPEG…";
    }
    return "Loading image…";
  })();

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Crop className="w-4 h-4 text-primary" />
            Crop & Convert to JPEG
          </DialogTitle>
        </DialogHeader>

        <div className="relative w-full bg-black" style={{ height: "280px" }}>
          {loading && (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <div className="w-7 h-7 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <p className="text-white/60 text-sm">{loadingMessage}</p>
            </div>
          )}
          {!loading && imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              style={{ containerStyle: { borderRadius: 0 } }}
            />
          )}
          {!loading && (loadError || !imageSrc) && (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-6 text-center">
              <p className="text-red-400 text-sm font-medium">Could not load this image</p>
              <p className="text-white/40 text-xs">
                {loadError || "Unsupported format. Please convert to JPEG or PNG first."}
              </p>
            </div>
          )}
        </div>

        <div className="px-4 pt-3 pb-1 space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1.5 font-medium">Aspect Ratio</p>
            <div className="flex gap-2">
              {ASPECT_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setAspect(opt.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                    aspect === opt.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-muted/40 text-foreground hover:border-primary/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1.5 font-medium flex items-center gap-1">
              <ZoomIn className="w-3 h-3" /> Zoom
            </p>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.05}
              onValueChange={([v]) => setZoom(v)}
              className="w-full"
              disabled={!imageSrc || loading}
            />
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1.5 font-medium">JPEG Quality</p>
            <div className="flex gap-2">
              {QUALITY_OPTIONS.map((opt, i) => (
                <button
                  key={opt.label}
                  onClick={() => setQualityIdx(i)}
                  className={`flex-1 px-3 py-2 rounded-lg text-left border transition-all ${
                    qualityIdx === i
                      ? "border-primary bg-primary/5"
                      : "border-border bg-muted/20 hover:border-primary/40"
                  }`}
                >
                  <div className="text-xs font-semibold">{opt.label}</div>
                  <div className="text-[10px] text-muted-foreground leading-tight">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 px-4 py-3 border-t">
          <Button variant="outline" size="sm" className="flex-1" onClick={onCancel} disabled={processing}>
            <X className="w-4 h-4 mr-1" /> Cancel
          </Button>
          <Button size="sm" className="flex-1" onClick={handleDone} disabled={processing || loading || !imageSrc}>
            <Check className="w-4 h-4 mr-1" />
            {processing ? "Processing…" : "Crop & Use"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
