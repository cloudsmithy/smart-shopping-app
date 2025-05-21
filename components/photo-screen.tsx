"use client"

import { ChevronLeft, RefreshCw } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface PhotoScreenProps {
  onNavigate: (screen: "home" | "photo" | "chat" | "voice") => void
}

export default function PhotoScreen({ onNavigate }: PhotoScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hasCamera, setHasCamera] = useState(false)
  const [cameraError, setCameraError] = useState("")
  const [photoTaken, setPhotoTaken] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")

  // Setup or restart camera
  const setupCamera = async () => {
    // Stop any existing stream first
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
    }

    setHasCamera(false)
    setCameraError("")

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play()
            setHasCamera(true)
          }
        }
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      setCameraError("无法访问摄像头，请确保已授予摄像头权限。")
    }
  }

  // Initialize camera on component mount
  useEffect(() => {
    setupCamera()

    // Cleanup function to stop camera when component unmounts
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [facingMode]) // Re-run when facingMode changes

  // Function to capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !hasCamera) return

    const video = videoRef.current
    const canvas = canvasRef.current

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw current video frame to canvas
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL("image/jpeg")
      setPhotoUrl(dataUrl)
      setPhotoTaken(true)

      // Stop the camera stream
      if (video.srcObject) {
        const tracks = (video.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }

  // Function to retake photo
  const retakePhoto = () => {
    setPhotoTaken(false)
    setPhotoUrl(null)
    setupCamera()
  }

  // Function to flip camera
  const flipCamera = () => {
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"))
  }

  // Function to stop the camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
  }

  return (
    <div className="bg-[#ffffff] rounded-xl overflow-hidden h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#f2f2f2]">
        <button
          onClick={() => {
            stopCamera()
            onNavigate("home")
          }}
          className="p-1"
        >
          <ChevronLeft className="w-5 h-5 text-[#000000]" />
        </button>
        <div className="font-medium text-center flex-1">拍摄页</div>
        <div className="w-5"></div>
      </div>

      {/* Camera View / Photo Preview */}
      <div className="flex-1 relative bg-[#000000]">
        {/* Video element for camera feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`absolute inset-0 w-full h-full object-cover ${photoTaken || !hasCamera ? "hidden" : "block"}`}
        />

        {/* Canvas for capturing photos (hidden) */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Photo preview */}
        {photoTaken && photoUrl && (
          <img
            src={photoUrl || "/placeholder.svg"}
            alt="Captured photo"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Loading/error message */}
        {!hasCamera && !photoTaken && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            {cameraError || "正在加载摄像头..."}
          </div>
        )}
      </div>

      {/* Camera Controls */}
      <div className="bg-[#000000] py-4 px-6 flex items-center justify-between">
        <div className="w-8 h-8"></div>
        {!photoTaken ? (
          <button
            onClick={capturePhoto}
            className="w-14 h-14 rounded-full border-2 border-white flex items-center justify-center"
            disabled={!hasCamera}
          >
            <div className="w-12 h-12 bg-white rounded-full"></div>
          </button>
        ) : (
          <div className="w-14 h-14"></div> // Placeholder when photo is taken
        )}
        <button
          onClick={flipCamera}
          disabled={photoTaken}
          className={`w-8 h-8 flex items-center justify-center ${photoTaken ? "opacity-50" : ""}`}
        >
          <RefreshCw className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="bg-white py-4 flex items-center justify-center gap-4">
        {photoTaken && (
          <button onClick={retakePhoto} className="px-6 py-2 bg-[#f2f2f2] text-[#000000] rounded-full text-sm">
            重新拍
          </button>
        )}
        <button
          onClick={() => {
            stopCamera()
            onNavigate("chat")
          }}
          className="px-6 py-2 bg-[#07c160] text-white rounded-full text-sm"
        >
          提交
        </button>
      </div>
    </div>
  )
}
