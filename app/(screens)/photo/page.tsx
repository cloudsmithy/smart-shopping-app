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
        !navigator.getUserMedia &&
        !(navigator as any).webkitGetUserMedia
      ) {
        throw new Error("浏览器不支持摄像头功能");
      }

      // 更完善的getUserMedia获取方式
      const getUserMedia =
        navigator.mediaDevices && navigator.mediaDevices.getUserMedia
          ? navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
          : (
              navigator.getUserMedia ||
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

      let stream = null;
      let lastError = null;

      for (const constraints of constraintOptions) {
        try {
          if (navigator.mediaDevices?.getUserMedia) {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
          } else {
            // 兼容旧版浏览器
            stream = await new Promise((resolve, reject) => {
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
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
            <div className="text-center mb-4">
              {cameraError || "正在加载摄像头..."}
            </div>
            {cameraError && (
              <button
                type="button"
                onClick={setupCamera}
                className="px-4 py-2 bg-[#07c160] text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
              >
                重试
              </button>
            )}
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
              onClick={handleSubmit}
              disabled={isUploading || isRecognizing}
              className="px-6 py-2 bg-[#07c160] text-white rounded-full text-sm hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "上传中..." : isRecognizing ? "识别中..." : "提交"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
