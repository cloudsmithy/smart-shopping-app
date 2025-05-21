"use client"

import { useState, useRef, useEffect } from "react"
import { Mic } from "lucide-react"
import type React from "react"

interface MicrophoneButtonProps {
  onNavigate: (screen: string) => void
}

export default function MicrophoneButton({ onNavigate }: MicrophoneButtonProps) {
  const [isPressed, setIsPressed] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 })
  const [gesture, setGesture] = useState<"none" | "left" | "up">("none")
  const [instructions, setInstructions] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const [audioData, setAudioData] = useState<Float32Array | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Float32Array | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Initialize audio context
  useEffect(() => {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)()
    setAudioContext(context)

    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop())
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (context.state !== "closed") {
        context.close()
      }
    }
  }, [])

  // Start recording function
  const startRecording = async () => {
    try {
      setError(null)

      if (!audioContext) {
        throw new Error("Audio context not initialized")
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setAudioStream(stream)

      // Create analyzer for visualizing audio
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Float32Array(bufferLength)

      // Connect microphone to analyzer
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      // Store references
      analyserRef.current = analyser
      dataArrayRef.current = dataArray

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        // Process recorded audio
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
        audioChunksRef.current = []

        // Here you could send the audio to a server or process it
        console.log("Recording completed", audioBlob)
      }

      // Start recording
      mediaRecorder.start()
      setIsRecording(true)

      // Start visualization
      visualizeAudio()
    } catch (err) {
      console.error("Error starting recording:", err)
      setError("无法访问麦克风，请确保已授予麦克风权限。")
    }
  }

  // Stop recording function
  const stopRecording = (shouldSave: boolean) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
    }

    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop())
      setAudioStream(null)
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    setIsRecording(false)

    if (!shouldSave) {
      // Clear recorded chunks if not saving
      audioChunksRef.current = []
    }
  }

  // Visualize audio function
  const visualizeAudio = () => {
    if (!analyserRef.current || !dataArrayRef.current) return

    const updateVisualization = () => {
      analyserRef.current!.getFloatTimeDomainData(dataArrayRef.current!)
      setAudioData([...dataArrayRef.current!])
      animationFrameRef.current = requestAnimationFrame(updateVisualization)
    }

    animationFrameRef.current = requestAnimationFrame(updateVisualization)
  }

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsPressed(true)
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
    setStartPos({ x: clientX, y: clientY })
    setCurrentPos({ x: clientX, y: clientY })
    setGesture("none")
    setInstructions("左滑取消，上滑发送")

    // Start recording when button is pressed
    startRecording()
  }

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isPressed) return

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
    setCurrentPos({ x: clientX, y: clientY })

    const deltaX = startPos.x - clientX
    const deltaY = startPos.y - clientY

    // Determine gesture based on direction and distance
    if (deltaX > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      setGesture("left")
      setInstructions("松开取消")
    } else if (deltaY > 50 && Math.abs(deltaY) > Math.abs(deltaX)) {
      setGesture("up")
      setInstructions("松开发送")
    } else {
      setGesture("none")
      setInstructions("左滑取消，上滑发送")
    }
  }

  const handleTouchEnd = () => {
    if (!isPressed) return

    if (gesture === "left") {
      // Cancel action - stop recording without saving
      stopRecording(false)
      console.log("Speech canceled")
    } else if (gesture === "up") {
      // Send action - stop recording and save
      stopRecording(true)
      console.log("Speech sent")
      onNavigate("voice")
    } else {
      // Normal release - stop recording and save
      stopRecording(true)
    }

    setIsPressed(false)
    setInstructions(null)
  }

  // Calculate button styles based on gesture
  const buttonTransform = isPressed
    ? gesture === "left"
      ? `translateX(-20px)`
      : gesture === "up"
        ? `translateY(-20px)`
        : "scale(1.1)"
    : "scale(1)"

  const buttonStyle = {
    transform: buttonTransform,
    transition: isPressed ? "none" : "transform 0.2s ease",
    backgroundColor: gesture === "left" ? "#ff4d4f" : gesture === "up" ? "#52c41a" : "#000000",
  }

  return (
    <div className="relative">
      {instructions && (
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white text-xs py-1 px-3 rounded-full whitespace-nowrap">
          {instructions}
        </div>
      )}

      {error && (
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-red-500 bg-opacity-70 text-white text-xs py-1 px-3 rounded-full whitespace-nowrap">
          {error}
        </div>
      )}

      {isRecording && audioData && (
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 rounded-full p-2 w-32 h-8 flex items-center justify-center">
          <div className="flex items-center h-4 space-x-0.5">
            {audioData
              .filter((_, i) => i % 8 === 0)
              .slice(0, 16)
              .map((value, index) => (
                <div
                  key={index}
                  className="w-1 bg-white"
                  style={{
                    height: `${Math.abs(value) * 20 + 4}px`,
                    opacity: isRecording ? 1 : 0.5,
                  }}
                ></div>
              ))}
          </div>
        </div>
      )}

      <button
        className="w-16 h-16 bg-[#000000] rounded-full flex items-center justify-center"
        style={buttonStyle}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        <Mic className={`w-8 h-8 text-white ${isRecording ? "animate-pulse" : ""}`} />
      </button>
    </div>
  )
}
