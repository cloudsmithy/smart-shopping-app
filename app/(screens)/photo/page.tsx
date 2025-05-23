"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";

export default function PhotoPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [photoTaken, setPhotoTaken] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );

  const setupCamera = async () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }

    setHasCamera(false);
    setCameraError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play();
            setHasCamera(true);
          }
        };
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraError("无法访问摄像头，请确保已授予摄像头权限。");
    }
  };

  useEffect(() => {
    setupCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !hasCamera) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL("image/jpeg");
      setPhotoUrl(dataUrl);
      setPhotoTaken(true);

      if (video.srcObject) {
        const tracks = (video.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    }
  };

  const retakePhoto = () => {
    setPhotoTaken(false);
    setPhotoUrl(null);
    setupCamera();
  };

  const flipCamera = () => {
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  return (
    <div className="bg-[#ffffff] rounded-xl overflow-hidden h-[100vh] flex flex-col">
      <PageHeader 
        title="拍摄页"
        showBackButton
        onBack={() => {
          stopCamera();
          router.push("/");
        }}
      />

      {/* Camera View / Photo Preview */}
      <div className="flex-1 relative bg-[#000000]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`absolute inset-0 w-full h-full object-cover ${
            photoTaken || !hasCamera ? "hidden" : "block"
          }`}
        />

        <canvas ref={canvasRef} className="hidden" />

        {photoTaken && photoUrl && (
          <img
            src={photoUrl}
            alt="Captured photo"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {!hasCamera && !photoTaken && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            {cameraError || "正在加载摄像头..."}
          </div>
        )}
      </div>

      {/* Camera Controls */}
      {!photoTaken ? (
        <div className="bg-[#000000] py-4 px-6 flex items-center justify-between">
          <div className="w-8 h-8"></div>
          <button
            type="button"
            onClick={capturePhoto}
            className="w-14 h-14 rounded-full border-2 border-white flex items-center justify-center"
            disabled={!hasCamera}
            aria-label="拍照"
          >
            <div className="w-12 h-12 bg-white rounded-full"></div>
          </button>

          <button
            type="button"
            onClick={flipCamera}
            disabled={photoTaken}
            className={`w-8 h-8 flex items-center justify-center ${
              photoTaken ? "opacity-50" : ""
            }`}
            aria-label="切换摄像头"
          >
            <RefreshCw className="w-5 h-5 text-white" />
          </button>
        </div>
      ) : (
        <div></div>
      )}

      {/* Action Buttons */}
      <div className="bg-white py-4 flex items-center justify-center gap-4">
        {photoTaken && (
          <>
            <button
              type="button"
              onClick={retakePhoto}
              className="px-6 py-2 bg-[#f2f2f2] text-[#000000] rounded-full text-sm hover:bg-gray-300 transition-colors"
            >
              重新拍
            </button>

            <button
              type="button"
              onClick={() => {
                stopCamera();
                router.push("/chat");
              }}
              className="px-6 py-2 bg-[#07c160] text-white rounded-full text-sm hover:bg-green-600 transition-colors"
            >
              提交
            </button>
          </>
        )}
      </div>
    </div>
  );
}
