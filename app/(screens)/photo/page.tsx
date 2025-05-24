"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { uploadPhoto, recognizeImage } from "@/api/ai";

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
  const [isUploading, setIsUploading] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);

  const setupCamera = async () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }

    setHasCamera(false);
    setCameraError("");

    try {
      // 检查是否为HTTPS（移动端必需）
      if (
        location.protocol !== "https:" &&
        location.hostname !== "localhost" &&
        location.hostname !== "127.0.0.1"
      ) {
        throw new Error("移动端需要HTTPS才能访问摄像头，请使用HTTPS访问");
      }

      // 改进的兼容性检查 - 专门针对移动端
      if (
        !navigator.mediaDevices &&
        !(navigator as any).getUserMedia &&
        !(navigator as any).webkitGetUserMedia
      ) {
        throw new Error("浏览器不支持摄像头功能");
      }

      // 更完善的getUserMedia获取方式
      const getUserMedia =
        navigator.mediaDevices && navigator.mediaDevices.getUserMedia
          ? navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
          : (
              (navigator as any).getUserMedia ||
              (navigator as any).webkitGetUserMedia ||
              (navigator as any).mozGetUserMedia ||
              (navigator as any).msGetUserMedia
            )?.bind(navigator);

      if (!getUserMedia) {
        throw new Error("浏览器不支持摄像头功能");
      }

      // 改进的约束配置，移动端优先
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );

      const constraintOptions = [
        // 移动端优化配置
        isMobile
          ? {
              video: {
                facingMode,
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
              audio: false,
            }
          : {
              video: { facingMode },
              audio: false,
            },
        // 基础配置
        {
          video: true,
          audio: false,
        },
        // 最简配置
        {
          video: {},
          audio: false,
        },
      ];

      let stream: MediaStream | null = null;
      let lastError = null;

      for (const constraints of constraintOptions) {
        try {
          if (navigator.mediaDevices?.getUserMedia) {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
          } else {
            // 兼容旧版浏览器
            stream = await new Promise<MediaStream>((resolve, reject) => {
              getUserMedia(constraints, resolve, reject);
            });
          }
          break;
        } catch (err) {
          lastError = err;
          console.warn("Failed with constraints:", constraints, err);
        }
      }

      if (!stream) {
        throw lastError || new Error("无法访问摄像头");
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // 移动端特殊处理
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.setAttribute("webkit-playsinline", "true");

        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current
              .play()
              .then(() => {
                setHasCamera(true);
              })
              .catch((playError) => {
                console.error("Error playing video:", playError);
                setCameraError("视频播放失败，请重试");
              });
          }
        };

        videoRef.current.onerror = () => {
          setCameraError("摄像头加载失败，请重试");
        };
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);

      let errorMessage = "无法访问摄像头";

      if (err.name === "NotAllowedError") {
        errorMessage = "摄像头权限被拒绝，请在浏览器设置中允许访问摄像头";
      } else if (err.name === "NotFoundError") {
        errorMessage = "未找到摄像头设备";
      } else if (err.name === "NotReadableError") {
        errorMessage = "摄像头被其他应用占用，请关闭其他使用摄像头的应用";
      } else if (err.name === "OverconstrainedError") {
        errorMessage = "摄像头不支持当前配置，请尝试切换摄像头";
      } else if (err.name === "NotSupportedError") {
        errorMessage = "浏览器不支持摄像头功能，请尝试更新浏览器";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setCameraError(errorMessage);
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

  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleSubmit = async () => {
    if (!photoUrl) return;

    try {
      setIsUploading(true);

      // Convert dataURL to File
      const file = dataURLtoFile(photoUrl, "photo.jpg");

      // Upload photo to get URL
      const uploadResponse = await uploadPhoto(file);
      const imageUrl = uploadResponse.url;

      setIsUploading(false);
      setIsRecognizing(true);

      // Recognize image
      const recognizeResponse = await recognizeImage(imageUrl);

      // Store results in sessionStorage to pass to chat page
      sessionStorage.setItem(
        "photoData",
        JSON.stringify({
          imageUrl,
          photoUrl,
          recognitionResult: recognizeResponse.result,
        })
      );

      stopCamera();
      router.push("/chat");
    } catch (error) {
      console.error("Error uploading or recognizing photo:", error);
      setIsUploading(false);
      setIsRecognizing(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-glass rounded-3xl shadow-2xl shadow-blue-500/10 overflow-hidden min-h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] flex flex-col border border-white/20">
      <PageHeader
        title="商品拍摄"
        showBackButton
        onBack={() => {
          stopCamera();
          router.push("/");
        }}
      />

      {/* Camera View / Photo Preview */}
      <div className="flex-1 relative bg-slate-900 rounded-t-2xl overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          webkit-playsinline="true"
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
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
            <div className="text-center mb-6">
              <div className="text-lg font-medium mb-2">摄像头加载中</div>
              <div className="text-sm text-slate-300">{cameraError || "正在初始化摄像头..."}</div>
            </div>
            {cameraError && (
              <button
                type="button"
                onClick={setupCamera}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition-all duration-200 shadow-lg font-medium"
              >
                重新尝试
              </button>
            )}
          </div>
        )}
      </div>

      {/* Camera Controls */}
      {!photoTaken ? (
        <div className="bg-slate-900 py-6 px-6 flex items-center justify-between">
          <div className="w-10 h-10"></div>
          <button
            type="button"
            onClick={capturePhoto}
            className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 transition-transform duration-200 disabled:opacity-50"
            disabled={!hasCamera}
            aria-label="拍照"
          >
            <div className="w-12 h-12 bg-white rounded-full"></div>
          </button>

          <button
            type="button"
            onClick={flipCamera}
            disabled={photoTaken}
            className={`w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200 ${
              photoTaken ? "opacity-50" : ""
            }`}
            aria-label="切换摄像头"
          >
            <RefreshCw className="w-5 h-5 text-white" />
          </button>
        </div>
      ) : (
        <div className="h-6"></div>
      )}

      {/* Action Buttons */}
      <div className="bg-white/60 backdrop-blur-sm py-6 flex items-center justify-center gap-4 border-t border-slate-200/60">
        {photoTaken && (
          <>
            <button
              type="button"
              onClick={retakePhoto}
              className="px-8 py-3 bg-slate-200 hover:bg-slate-300 transition-all duration-200 font-medium rounded-xl text-sm"
              style={{
                color: '#374151',
                backgroundColor: '#e2e8f0', // fallback color
              }}
            >
              <span style={{color: '#374151'}}>重新拍摄</span>
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isUploading || isRecognizing}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 font-medium rounded-xl text-sm"
              style={{
                color: '#ffffff',
                backgroundColor: '#2563eb', // fallback color
              }}
            >
              <span style={{color: '#ffffff'}}>
                {isUploading ? "上传中..." : isRecognizing ? "识别中..." : "开始识别"}
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
