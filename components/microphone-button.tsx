"use client";

import { useState, useRef, useEffect } from "react";
import { Mic } from "lucide-react";
import type React from "react";

interface MicrophoneButtonProps {
  onNavigate: (screen: string) => void;
  onAudioRecorded?: (audioFile: File) => void;
  isProcessing?: boolean;
}

export default function MicrophoneButton({
  onNavigate,
  onAudioRecorded,
  isProcessing = false,
}: MicrophoneButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [gesture, setGesture] = useState<"none" | "left" | "up">("none");
  const [isRecording, setIsRecording] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [audioData, setAudioData] = useState<Float32Array | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Float32Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize audio context
  useEffect(() => {
    const context = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    setAudioContext(context);

    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (context.state !== "closed") {
        context.close();
      }
    };
  }, []);

  // Start recording function
  const startRecording = async () => {
    try {
      setError(null);

      if (!audioContext) {
        throw new Error("Audio context not initialized");
      }

      // Resume audio context if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);

      // Create analyzer for visualizing audio
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Float32Array(bufferLength);
      // Initialize with zeros to prevent NaN values
      dataArray.fill(0);

      // Connect microphone to analyzer
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // Store references
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Process recorded audio
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        audioChunksRef.current = [];

        // Create File object and send to parent
        if (audioBlob.size > 0 && onAudioRecorded) {
          try {
            const audioFile = new File([audioBlob], "recording.wav", {
              type: "audio/wav",
            });
            onAudioRecorded(audioFile);
          } catch (error) {
            console.error("Error creating audio file:", error);
          }
        }
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);

      // Start visualization
      visualizeAudio();
    } catch (err) {
      console.error("Error starting recording:", err);
      setError("无法访问麦克风，请确保已授予麦克风权限。");
    }
  };

  // Stop recording function
  const stopRecording = (shouldSave: boolean) => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop());
      setAudioStream(null);
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setIsRecording(false);

    if (!shouldSave) {
      // Clear recorded chunks if not saving
      audioChunksRef.current = [];
    }
  };

  // Visualize audio function
  const visualizeAudio = () => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    const updateVisualization = () => {
      if (analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getFloatTimeDomainData(dataArrayRef.current as any);
        // Create a copy of the array to avoid reference issues
        const dataArray = Array.from(dataArrayRef.current);
        // Filter out NaN values and replace with 0
        const cleanData = dataArray.map(value => isNaN(value) ? 0 : value);
        setAudioData(cleanData as any);
      }
      animationFrameRef.current = requestAnimationFrame(updateVisualization);
    };

    animationFrameRef.current = requestAnimationFrame(updateVisualization);
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsPressed(true);
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setStartPos({ x: clientX, y: clientY });
    setCurrentPos({ x: clientX, y: clientY });
    setGesture("none");

    // Start recording when button is pressed
    startRecording();
  };

  const handleTouchMove = () => {
    if (!isPressed) return;
  };

  const handleTouchEnd = () => {
    if (!isPressed) return;

    // 不管任何手势，都直接停止录音并保存
    stopRecording(true);
    setIsPressed(false);
  };

  // 简化按钮样式，只有按下缩放效果
  const buttonTransform = isPressed ? "scale(1.1)" : "scale(1)";

  const buttonStyle = {
    transform: buttonTransform,
    transition: isPressed ? "none" : "transform 0.2s ease",
  };

  return (
    <div className="relative">
      {error && (
        <div 
          className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-red-500/90 backdrop-blur-sm rounded-xl whitespace-nowrap shadow-lg text-force-white"
          style={{
            backgroundColor: '#ef4444',
            color: '#ffffff',
            padding: '8px 16px',
            fontSize: '12px'
          }}
        >
          <span style={{color: '#ffffff'}}>{error}</span>
        </div>
      )}

      {isRecording && audioData && (
        <div 
          className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-slate-900/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/10 flex items-center justify-center"
          style={{
            backgroundColor: '#1e293b',
            padding: '12px',
            width: '144px',
            height: '40px'
          }}
        >
          <div className="flex items-center h-6 space-x-1">
            {Array.from(audioData)
              .filter((_, i) => i % 8 === 0)
              .slice(0, 16)
              .map((value, index) => {
                const height = Math.max(4, Math.min(20, Math.abs(value || 0) * 25 + 4));
                return (
                  <div
                    key={index}
                    className="w-1 rounded-full transition-all duration-100"
                    style={{
                      height: `${height}px`,
                      background: isRecording 
                        ? 'linear-gradient(to top, #60a5fa, #818cf8)' 
                        : '#94a3b8',
                      opacity: isRecording ? 1 : 0.5,
                    }}
                  />
                );
              })}
          </div>
        </div>
      )}

      <button
        type="button"
        className={`w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30 transition-all duration-200 ${
          isProcessing ? "opacity-50 cursor-not-allowed" : "hover:from-blue-700 hover:to-indigo-800 hover:shadow-2xl hover:shadow-blue-500/40"
        } ${isPressed ? "scale-110" : "scale-100"}`}
        style={{
          ...buttonStyle,
          backgroundColor: '#2563eb', // fallback color
        }}
        onTouchStart={isProcessing ? undefined : handleTouchStart}
        onTouchMove={isProcessing ? undefined : handleTouchMove}
        onTouchEnd={isProcessing ? undefined : handleTouchEnd}
        onMouseDown={isProcessing ? undefined : handleTouchStart}
        onMouseMove={isProcessing ? undefined : handleTouchMove}
        onMouseUp={isProcessing ? undefined : handleTouchEnd}
        onMouseLeave={isProcessing ? undefined : handleTouchEnd}
        disabled={isProcessing}
        aria-label="录音按钮"
      >
        <Mic
          className={`w-7 h-7 ${
            isRecording || isProcessing ? "animate-pulse" : ""
          }`}
          style={{color: '#ffffff'}}
        />
      </button>
    </div>
  );
}
