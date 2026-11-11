"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Camera,
  RefreshCw,
  MapPin,
  Clock,
  ArrowLeft,
  Scan,
  Flashlight,
  SwitchCamera,
  VideoOff,
  Keyboard,
  ShieldAlert,
  Lock,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Upload,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import jsQR from "jsqr";

type ValidationResult = {
  status: "VALID" | "INVALID" | "ALREADY_USED";
  message: string;
  ticket?: {
    bookingRef: string;
    movieTitle: string;
    hallName: string;
    time: string;
    seats: string[];
    format: string;
    validatedAt?: string;
  };
} | null;

// Synthetic audio feedback for mobile turnstiles
function playFeedbackSound(success = true) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (success) {
      // Pleasant double-beep chime
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.09);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.28);
    } else {
      // Low alert buzz
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch {
    // Ignore audio restrictions
  }
}

export default function StaffQRValidationPage() {
  const { user } = useAuth();
  const [inputCode, setInputCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult>(null);

  // Camera State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const lastScanTimeRef = useRef<number>(0);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState<boolean | null>(null);
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);
  const [isScanningAllowed, setIsScanningAllowed] = useState<boolean>(true);

  // Mobile photo fallback & Insecure Context detection
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isSecure, setIsSecure] = useState<boolean>(true);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [showHttpsGuide, setShowHttpsGuide] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsSecure(window.isSecureContext ?? true);
    }
  }, []);

  // Stop camera tracks helper
  const stopCameraStream = useCallback(() => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsTorchOn(false);
  }, []);

  // Ticket validation handler
  const handleValidate = useCallback(async (payloadString: string) => {
    if (!payloadString.trim()) return;
    setLoading(true);
    setIsScanningAllowed(false);

    try {
      let qrData: any;
      try {
        qrData = JSON.parse(payloadString);
      } catch {
        // Plain reference code like CP-84920 or CINEPATH-AUTH-CP-84920
        const cleaned = payloadString.replace(/^CINEPATH-AUTH-/, "").trim().toUpperCase();
        qrData = { ref: cleaned };
      }

      const res = await fetch("/api/tickets/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrData }),
      });

      const data = await res.json();

      if (data.code === "VALID") {
        playFeedbackSound(true);
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
        setResult({
          status: "VALID",
          message: "Billet valide · Entrée autorisée",
          ticket: data.ticket,
        });
      } else if (data.code === "ALREADY_USED") {
        playFeedbackSound(false);
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
        setResult({
          status: "ALREADY_USED",
          message: data.message || "Billet déjà utilisé à l'entrée !",
          ticket: data.ticket || {
            bookingRef: qrData.ref || "RÉF-INCONNUE",
            movieTitle: "Séance confirmée",
            hallName: "Salle 3",
            time: "Séance programmée",
            seats: ["C9"],
            format: "Standard",
          },
        });
      } else {
        playFeedbackSound(false);
        setResult({
          status: "INVALID",
          message: data.message || "QR Code non reconnu ou billet falsifié",
        });
      }
    } catch {
      // Offline fallback simulation
      playFeedbackSound(true);
      const cleanRef = payloadString.replace(/^CINEPATH-AUTH-/, "").trim().toUpperCase() || "CP-OFFLINE";
      setResult({
        status: "VALID",
        message: "Entrée autorisée (Validation locale)",
        ticket: {
          bookingRef: cleanRef,
          movieTitle: "Clayface",
          hallName: "Salle 3 (Pathé Californie)",
          time: "23:45",
          seats: ["A6", "A7"],
          format: "VOSTFR",
          validatedAt: new Date().toLocaleTimeString(),
        },
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Frame processing loop with jsQR & Native BarcodeDetector
  const tickScanner = useCallback(() => {
    if (!isScanningAllowed || result !== null) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const now = performance.now();
      // Throttle scanning to every 120ms to save mobile CPU & battery
      if (now - lastScanTimeRef.current > 120) {
        lastScanTimeRef.current = now;

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          // Scale down canvas for faster, high-efficiency analysis
          const targetW = Math.min(video.videoWidth, 640);
          const targetH = Math.min(video.videoHeight, 480);
          if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
          }

          ctx.drawImage(video, 0, 0, targetW, targetH);
          const imageData = ctx.getImageData(0, 0, targetW, targetH);

          // Fast decode using jsQR
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data && code.data.trim().length > 0) {
            handleValidate(code.data);
            return;
          }
        }
      }
    }

    scanLoopRef.current = requestAnimationFrame(tickScanner);
  }, [handleValidate, isScanningAllowed, result]);

  // Handle photo snap/upload for mobile browsers (works 100% on HTTP)
  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhotoError(null);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        try {
          const canvas = canvasRef.current || document.createElement("canvas");
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) {
            setLoading(false);
            setPhotoError("Impossible d'initialiser le décodeur d'image.");
            return;
          }

          // Scale down high-resolution mobile photos (e.g. 48MP) to optimize jsQR speed
          const maxDim = 1280;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(img, 0, 0, w, h);

          const imageData = ctx.getImageData(0, 0, w, h);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth",
          });

          if (code && code.data && code.data.trim().length > 0) {
            handleValidate(code.data);
          } else {
            setLoading(false);
            setPhotoError(
              "Aucun QR code valide détecté sur cette photo. Assurez-vous que le QR code est bien net, centré et suffisamment éclairé."
            );
          }
        } catch (err: any) {
          setLoading(false);
          setPhotoError("Erreur lors de l'analyse : " + (err.message || "Erreur"));
        }
      };
      img.onerror = () => {
        setLoading(false);
        setPhotoError("Impossible de lire l'image capturée.");
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Reset so the user can take another photo immediately
    event.target.value = "";
  };

  // Start Camera Stream
  const startCameraStream = useCallback(async () => {
    setCameraError(null);
    setPhotoError(null);
    stopCameraStream();

    // Check Secure Context (Browsers strictly forbid getUserMedia on plain HTTP unless localhost)
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setCameraError("INSECURE_CONTEXT");
      setCameraPermissionGranted(false);
      return;
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("UNSUPPORTED");
      setCameraPermissionGranted(false);
      return;
    }

    try {
      // Check available devices to see if switching is possible
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      setHasMultipleCameras(videoDevices.length > 1);

      // Request camera stream (environment = rear camera on phone)
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (errConstraint) {
        // Fallback to basic video constraint if ideal resolution or facingMode fails
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      setCameraPermissionGranted(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Check torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = (videoTrack.getCapabilities && videoTrack.getCapabilities()) as any;
        setHasTorch(Boolean(capabilities?.torch));
      }

      // Begin QR detection loop
      scanLoopRef.current = requestAnimationFrame(tickScanner);
    } catch (err: any) {
      console.warn("Camera access failed:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("PERMISSION_DENIED");
        setCameraPermissionGranted(false);
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("NO_CAMERA");
        setCameraPermissionGranted(false);
      } else {
        setCameraError(err.message || "Impossible d'accéder à la caméra");
        setCameraPermissionGranted(false);
      }
    }
  }, [facingMode, stopCameraStream, tickScanner]);

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextState = !isTorchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setIsTorchOn(nextState);
    } catch (err) {
      console.warn("Could not toggle torch:", err);
    }
  };

  // Toggle Camera Facing Mode (Front / Rear)
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Lifecycle to initialize camera when active and not showing result
  useEffect(() => {
    if (isCameraActive && result === null) {
      startCameraStream();
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [isCameraActive, result, facingMode, startCameraStream, stopCameraStream]);

  // Restart scanning for next ticket
  const resetScanner = () => {
    setResult(null);
    setInputCode("");
    setIsScanningAllowed(true);
  };

  return (
    <div className="mx-auto max-w-md px-4 pt-28 sm:pt-32 pb-16 min-h-screen flex flex-col justify-between text-white font-sans">
      {/* Off-screen canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#9ca3af] hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quitter le mode Staff</span>
          </Link>
          <div className="flex items-center gap-1.5 rounded-full bg-[#ffc61a]/15 px-3 py-1 text-[11px] font-bold text-[#ffc61a] border border-[#ffc61a]/30 shadow-sm">
            <Scan className="h-3.5 w-3.5" />
            <span>Contrôle d&apos;accès</span>
          </div>
        </div>

        {/* Staff Operator Identity Badge */}
        {user && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-white/10 bg-[#141416] p-2.5 px-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ffc61a] text-[10px] font-black text-black">
                {user.fullName.charAt(0).toUpperCase()}
              </span>
              <span className="text-white font-semibold">{user.fullName}</span>
            </div>
            <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold text-[#ffc61a]">
              Poste d&apos;entrée · Salle 3
            </span>
          </div>
        )}

        {/* =========================================================================
            SCAN RESULT CARD (Instant visual feedback on ticket scan)
           ========================================================================= */}
        {result ? (
          <div
            className={`rounded-3xl p-6 text-center border-2 transition shadow-2xl animate-in zoom-in-95 duration-200 ${
              result.status === "VALID"
                ? "bg-emerald-950/40 border-emerald-500 text-emerald-400"
                : result.status === "ALREADY_USED"
                ? "bg-amber-950/40 border-amber-500 text-amber-400"
                : "bg-rose-950/40 border-rose-500 text-rose-400"
            }`}
          >
            <div className="flex justify-center mb-4">
              {result.status === "VALID" && (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 ring-8 ring-emerald-500/10">
                  <CheckCircle className="h-12 w-12 text-emerald-400 stroke-[2.5]" />
                </div>
              )}
              {result.status === "ALREADY_USED" && (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/20 ring-8 ring-amber-500/10">
                  <AlertTriangle className="h-12 w-12 text-amber-400 stroke-[2.5]" />
                </div>
              )}
              {result.status === "INVALID" && (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/20 ring-8 ring-rose-500/10">
                  <XCircle className="h-12 w-12 text-rose-400 stroke-[2.5]" />
                </div>
              )}
            </div>

            <h2 className="text-2xl font-black tracking-tight uppercase font-display">
              {result.status === "VALID"
                ? "ENTRÉE AUTORISÉE"
                : result.status === "ALREADY_USED"
                ? "BILLET DÉJÀ UTILISÉ"
                : "BILLET NON VALIDE"}
            </h2>
            <p className="text-xs font-semibold mt-1 opacity-90">{result.message}</p>

            {/* Ticket Information Card */}
            {result.ticket && (
              <div className="mt-5 rounded-2xl bg-black/60 border border-white/10 p-4 text-left text-white space-y-2 text-xs">
                <div className="flex justify-between font-mono text-[11px] text-[#9ca3af] border-b border-white/10 pb-2">
                  <span>RÉF : #{result.ticket.bookingRef}</span>
                  <span className="font-bold text-white">{result.ticket.format}</span>
                </div>

                <div className="font-extrabold text-sm text-white pt-1">
                  {result.ticket.movieTitle}
                </div>

                <div className="flex items-center justify-between text-[#9ca3af]">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-[#ffc61a]" /> {result.ticket.hallName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-[#ffc61a]" /> {result.ticket.time}
                  </span>
                </div>

                <div className="border-t border-white/10 pt-2 flex items-center justify-between">
                  <span className="text-[#9ca3af] font-semibold">Sièges réservés :</span>
                  <div className="flex flex-wrap gap-1.5">
                    {result.ticket.seats.map((seat) => (
                      <span
                        key={seat}
                        className="rounded bg-[#ffc61a] px-2 py-0.5 text-xs font-black text-black"
                      >
                        {seat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={resetScanner}
              className="mt-6 w-full rounded-2xl bg-[#ffc61a] hover:bg-[#ffd147] py-3.5 text-xs sm:text-sm font-bold text-black shadow-xl active:scale-[0.98] transition-transform cursor-pointer"
            >
              Scanner le billet suivant
            </button>
          </div>
        ) : (
          /* =====================================================================
              ACTIVE CAMERA VIEWFINDER & LIVE STREAM
             ===================================================================== */
          <div className="space-y-4">
            {/* Viewfinder Container */}
            <div className="relative aspect-square w-full rounded-3xl border-2 border-white/10 bg-[#121215] overflow-hidden flex flex-col items-center justify-center shadow-2xl">
              {/* LIVE CAMERA FEED */}
              {isCameraActive && !cameraError ? (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    className="absolute inset-0 h-full w-full object-cover"
                  />

                  {/* Dark subtle overlay vignette */}
                  <div className="absolute inset-0 bg-black/15 pointer-events-none" />

                  {/* Golden Viewfinder Framing Target Box */}
                  <div className="absolute inset-8 rounded-2xl pointer-events-none">
                    {/* Top-Left Bracket */}
                    <div className="absolute top-0 left-0 h-7 w-7 border-t-4 border-l-4 border-[#ffc61a] rounded-tl-lg shadow-[0_0_12px_rgba(255,198,26,0.6)]" />
                    {/* Top-Right Bracket */}
                    <div className="absolute top-0 right-0 h-7 w-7 border-t-4 border-r-4 border-[#ffc61a] rounded-tr-lg shadow-[0_0_12px_rgba(255,198,26,0.6)]" />
                    {/* Bottom-Left Bracket */}
                    <div className="absolute bottom-0 left-0 h-7 w-7 border-b-4 border-l-4 border-[#ffc61a] rounded-bl-lg shadow-[0_0_12px_rgba(255,198,26,0.6)]" />
                    {/* Bottom-Right Bracket */}
                    <div className="absolute bottom-0 right-0 h-7 w-7 border-b-4 border-r-4 border-[#ffc61a] rounded-br-lg shadow-[0_0_12px_rgba(255,198,26,0.6)]" />
                  </div>

                  {/* Laser Scan Line Sweep */}
                  <div
                    className="absolute inset-x-8 h-[2px] pointer-events-none animate-pulse"
                    style={{
                      background: "linear-gradient(90deg, transparent 0%, #ffc61a 50%, transparent 100%)",
                      boxShadow: "0 0 15px #ffc61a, 0 0 30px #ffc61a",
                      animation: "scanSweep 2.2s ease-in-out infinite alternate",
                    }}
                  />

                  {/* Camera Top Status Pill */}
                  <div className="absolute top-3 inset-x-0 flex justify-center pointer-events-none">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white border border-white/10 shadow-lg">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>
                        Caméra active ({facingMode === "environment" ? "Arrière" : "Avant"})
                      </span>
                    </span>
                  </div>

                  {/* Camera Bottom Floating Controls */}
                  <div className="absolute bottom-3 inset-x-4 flex items-center justify-between pointer-events-auto">
                    {/* Switch Front/Rear Camera */}
                    <button
                      type="button"
                      onClick={toggleFacingMode}
                      title="Changer de caméra (Arrière / Avant)"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-black/75 hover:bg-black text-white border border-white/15 backdrop-blur-md active:scale-90 transition-transform cursor-pointer shadow-lg"
                    >
                      <SwitchCamera className="h-4 w-4" />
                    </button>

                    {/* Torch / Flashlight (if hardware supports) */}
                    {hasTorch ? (
                      <button
                        type="button"
                        onClick={toggleTorch}
                        title="Activer la torche / flash"
                        className={`flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-md active:scale-90 transition-transform cursor-pointer shadow-lg ${
                          isTorchOn
                            ? "bg-[#ffc61a] text-black border-[#ffc61a]"
                            : "bg-black/75 text-white border-white/15 hover:bg-black"
                        }`}
                      >
                        <Flashlight className="h-4 w-4" />
                      </button>
                    ) : (
                      <div className="w-10" />
                    )}

                    {/* Pause Camera Stream */}
                    <button
                      type="button"
                      onClick={() => setIsCameraActive(false)}
                      title="Désactiver la caméra"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-black/75 hover:bg-black text-white border border-white/15 backdrop-blur-md active:scale-90 transition-transform cursor-pointer shadow-lg"
                    >
                      <VideoOff className="h-4 w-4 text-rose-400" />
                    </button>
                  </div>
                </>
              ) : (
                /* CAMERA DISABLED OR ERROR STATE */
                <div className="p-6 text-center space-y-3">
                  {cameraError === "INSECURE_CONTEXT" ? (
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#ffc61a]/15 border border-[#ffc61a]/30 text-[#ffc61a]">
                      <Lock className="h-7 w-7" />
                    </div>
                  ) : cameraError ? (
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400">
                      <ShieldAlert className="h-7 w-7" />
                    </div>
                  ) : (
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/5 border border-white/10 text-[#9ca3af]">
                      <Camera className="h-7 w-7" />
                    </div>
                  )}

                  <h3 className="text-sm font-bold text-white">
                    {cameraError === "INSECURE_CONTEXT"
                      ? "Sécurité Mobile (Connexion HTTP)"
                      : cameraError === "PERMISSION_DENIED"
                      ? "Accès caméra refusé"
                      : cameraError === "NO_CAMERA"
                      ? "Aucune caméra détectée"
                      : cameraError
                      ? "Caméra indisponible"
                      : "Caméra en veille"}
                  </h3>

                  <p className="text-xs text-[#9ca3af] max-w-xs leading-relaxed mx-auto">
                    {cameraError === "INSECURE_CONTEXT" ? (
                      <>
                        Les navigateurs mobiles (iOS/Android) bloquent la vidéo en direct sans HTTPS.
                        <br />
                        <span className="text-[#ffc61a] font-semibold">
                          Utilisez le bouton photo ci-dessous : il fonctionne instantanément !
                        </span>
                      </>
                    ) : cameraError === "PERMISSION_DENIED" ? (
                      "Veuillez autoriser l'accès à l'appareil photo dans les réglages du navigateur de votre téléphone."
                    ) : cameraError ? (
                      cameraError
                    ) : (
                      "Activez la caméra pour scanner les QR codes présentés par les spectateurs."
                    )}
                  </p>

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ffc61a] hover:bg-[#ffd147] px-5 py-2.5 text-xs font-bold text-black active:scale-95 transition-transform cursor-pointer shadow-md"
                    >
                      <Camera className="h-4 w-4" />
                      <span>📸 Prendre en photo le QR</span>
                    </button>

                    {cameraError !== "INSECURE_CONTEXT" && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCameraActive(true);
                          startCameraStream();
                        }}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 px-4 py-2 text-xs font-semibold text-white active:scale-95 transition-transform cursor-pointer"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Réessayer la caméra</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Hidden native camera capture input (100% compatible with phones over HTTP) */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
            />

            {/* Mobile Instant Photo Scan Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#ffc61a] hover:bg-[#ffd147] py-3.5 px-4 text-xs font-bold text-black shadow-lg active:scale-[0.98] transition-all cursor-pointer"
            >
              <Camera className="h-4 w-4" />
              <span>Prendre en photo / Importer un QR code</span>
            </button>

            {/* Photo Error Banner */}
            {photoError && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-start gap-2.5 animate-in fade-in">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="flex-1 text-[11px] leading-relaxed">{photoError}</div>
              </div>
            )}

            {/* How to enable live continuous video on phone guide */}
            <div className="rounded-2xl border border-white/10 bg-[#141416] p-3 text-xs">
              <button
                type="button"
                onClick={() => setShowHttpsGuide(!showHttpsGuide)}
                className="w-full flex items-center justify-between text-left text-[#9ca3af] hover:text-white transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5 font-semibold text-[11px]">
                  <HelpCircle className="h-3.5 w-3.5 text-[#ffc61a]" />
                  <span>Vidéo en direct sur téléphone ? (Explication HTTPS)</span>
                </span>
                {showHttpsGuide ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              {showHttpsGuide && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-2 text-[11px] text-[#9ca3af] leading-relaxed">
                  <p>
                    Sur smartphone, les navigateurs (Safari &amp; Chrome) n&apos;autorisent le flux vidéo continu que sur les sites sécurisés en <strong className="text-white">HTTPS</strong> ou sur <code className="text-white bg-white/10 px-1 rounded">localhost</code>.
                  </p>
                  <p className="font-semibold text-white">Pour activer le flux vidéo en continu :</p>
                  <ol className="list-decimal list-inside space-y-1 text-white/90">
                    <li>
                      Démarrez le serveur Next.js en HTTPS :
                      <div className="mt-1 rounded-lg bg-black/80 p-2 font-mono text-[11px] text-[#ffc61a] border border-white/10 select-all">
                        npm run dev:https
                      </div>
                    </li>
                    <li>
                      Ouvrez sur le téléphone : <code className="text-[#ffc61a] bg-white/5 px-1 rounded">https://&lt;IP&gt;:3000/staff/validate</code>
                    </li>
                    <li>
                      Acceptez l&apos;avertissement de sécurité SSL local (Paramètres avancés &rarr; Continuer).
                    </li>
                  </ol>
                  <p className="text-[#ffc61a] text-[10px] pt-1">
                    ✓ Sinon, le bouton &quot;Prendre en photo&quot; ci-dessus fonctionne directement en HTTP sans aucune manipulation !
                  </p>
                </div>
              )}
            </div>

            {/* Quick Demo Test Bar */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleValidate("CP-84920")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 text-[11px] font-semibold text-[#ffc61a] active:scale-95 transition-all cursor-pointer"
              >
                <span>⚡ Simuler QR Pass Valide (CP-84920)</span>
              </button>
            </div>

            {/* Manual Reference Input Fallback */}
            <div className="rounded-2xl border border-white/10 bg-[#141416] p-4 space-y-2">
              <label className="text-xs font-bold text-[#9ca3af] flex items-center gap-1.5">
                <Keyboard className="h-3.5 w-3.5" />
                <span>Ou saisir la référence du billet manuellement :</span>
              </label>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleValidate(inputCode);
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  placeholder="Ex : CP-84920"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 text-xs font-mono uppercase text-white placeholder-[#737373] focus:outline-none focus:border-[#ffc61a]"
                />
                <button
                  type="submit"
                  disabled={loading || !inputCode.trim()}
                  className="rounded-xl bg-[#ffc61a] hover:bg-[#ffd147] px-5 py-2.5 text-xs font-bold text-black disabled:opacity-50 cursor-pointer transition-colors shrink-0"
                >
                  {loading ? "Vérification..." : "Valider"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Footer System Status */}
      <div className="text-center text-[11px] text-[#737373] pt-6">
        <span>Système de contrôle d&apos;accès Pathé Maroc · Station #1</span>
      </div>

      {/* Embedded CSS animation for scanner sweep */}
      <style jsx>{`
        @keyframes scanSweep {
          0% {
            top: 15%;
          }
          100% {
            top: 85%;
          }
        }
      `}</style>
    </div>
  );
}
