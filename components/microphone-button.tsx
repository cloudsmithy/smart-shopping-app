"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Mic } from "lucide-react";
import { createRealtimeSession } from "@/api/ai";
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
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logging, setLogging] = useState<string[]>([]);

  // WebRTC refs
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const log = (msg: string) => {
    console.log(msg);
    setLogging(prev => [...prev, msg]);
  };

  // Cleanup function
  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    if (dcRef.current) {
      dcRef.current.close();
      dcRef.current = null;
    }
    
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    
    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
    
    setIsRecording(false);
    setIsConnecting(false);
    setLogging([]);
  };

  useEffect(() => {
    return cleanup;
  }, []);

  const startRealtimeSession = async () => {
    try {
      setError(null);
      setIsConnecting(true);
      setLogging([]);
      
      log("🚀 开始建立实时语音会话...");

      // ① 从后端获取 ephemeral key
      const { session_id, ephemeral_key } = await createRealtimeSession();
      log(`🆗 Session ${session_id} 获取成功`);

      // ② 初始化 WebRTC
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // 收到模型返回的音频 track
      pc.ontrack = (ev) => {
        log("🎵 收到音频流");
        if (audioRef.current) {
          audioRef.current.srcObject = ev.streams[0];
        }
      };

      // 连接状态监听
      pc.onconnectionstatechange = () => {
        log(`📡 连接状态: ${pc.connectionState}`);
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          setError("连接失败，请重试");
          cleanup();
        }
      };

      // 建立数据通道
      const dc = pc.createDataChannel("realtime-channel");
      dcRef.current = dc;

      dc.onopen = () => {
        log("📡 数据通道已打开");
        setIsConnecting(false);
        setIsRecording(true);
        
        // 发送会话配置
        const sessionUpdate = {
          type: "session.update",
          session: { 
            instructions: "你是一位耐心、专业的中文购物助理。请用简洁、友好的语气回答用户关于商品的问题。",
            voice: "alloy",
            input_audio_format: "pcm16",
            output_audio_format: "pcm16",
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 200
            }
          }
        };
        dc.send(JSON.stringify(sessionUpdate));
        log("➡️ 会话配置已发送");
      };

      dc.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          log(`⬅️ ${data.type}`);
          
          // 处理不同类型的消息
          if (data.type === 'response.audio.delta' && data.delta) {
            // 处理音频数据 - 这里可以根据需要进一步处理
          } else if (data.type === 'response.text.delta' && data.delta) {
            log(`💬 回复: ${data.delta}`);
          } else if (data.type === 'error') {
            log(`❌ 错误: ${data.error?.message || '未知错误'}`);
            setError(data.error?.message || '发生未知错误');
          }
        } catch (err) {
          log(`⬅️ ${e.data}`);
        }
      };

      dc.onerror = (error) => {
        log(`❌ 数据通道错误: ${error}`);
        setError("数据通道连接失败");
      };

      // ③ 采集麦克风
      const localStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      localStreamRef.current = localStream;
      localStream.getAudioTracks().forEach(track => pc.addTrack(track, localStream));
      log("🎤 麦克风已连接");

      // ④ SDP 握手
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const webrtcURL = `https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2025-06-03`;

      const answerSDP = await fetch(webrtcURL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ephemeral_key}`,
          "Content-Type": "application/sdp"
        },
        body: offer.sdp
      }).then(r => r.text());

      await pc.setRemoteDescription({ type: "answer", sdp: answerSDP });
      log("✅ WebRTC 连接已建立");

    } catch (err) {
      console.error("启动实时会话失败:", err);
      setError(err instanceof Error ? err.message : "无法建立语音连接，请检查网络和麦克风权限");
      setIsConnecting(false);
      cleanup();
    }
  };

  const stopRealtimeSession = () => {
    log("🔚 正在关闭会话...");
    cleanup();
  };

  const handleClick = () => {
    if (isRecording) {
      stopRealtimeSession();
    } else if (!isConnecting) {
      startRealtimeSession();
    }
  };

  return (
    <>
      {/* 全屏遮罩和录音提示 */}
      {(isRecording || isConnecting) && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center"
          style={{ pointerEvents: 'auto' }}
        >
          <div className="flex flex-col items-center space-y-8 max-w-md mx-4">
            {/* 录音动画圆圈 */}
            <div className="relative">
              <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center animate-pulse">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl">
                    <Mic className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
              {/* 录音脉冲效果 */}
              {isRecording && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-blue-500/20 rounded-full animate-ping" />
                </div>
              )}
            </div>
            
            {/* 提示文字 */}
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <p className="text-white text-xl font-medium">
                  {isConnecting ? "正在连接..." : "实时语音对话中..."}
                </p>
                {isConnecting && (
                  <p className="text-white/70 text-sm">请稍候，正在建立连接</p>
                )}
              </div>
              
              {/* 日志显示（开发时可见） */}
              {process.env.NODE_ENV === 'development' && logging.length > 0 && (
                <div className="bg-black/20 rounded-lg p-3 max-h-32 overflow-y-auto">
                  <pre className="text-xs text-white/80 text-left">
                    {logging.slice(-5).join('\n')}
                  </pre>
                </div>
              )}
              
              {/* 取消按钮 */}
              {!isConnecting && (
                <div className="flex justify-center">
                  <button
                    onClick={stopRealtimeSession}
                    className="w-12 h-12 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 border border-red-500/30"
                    style={{ pointerEvents: 'auto' }}
                    aria-label="结束对话"
                  >
                    <svg 
                      className="w-6 h-6 text-white" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M6 18L18 6M6 6l12 12" 
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 隐藏的音频元素用于播放AI回复 */}
      <audio ref={audioRef} autoPlay style={{ display: 'none' }} />

      <div className="relative">
        {error && (
          <div 
            className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-red-500/90 backdrop-blur-sm rounded-xl whitespace-nowrap shadow-lg text-force-white"
            style={{
              backgroundColor: '#ef4444',
              color: '#ffffff',
              padding: '8px 16px',
              fontSize: '12px',
              zIndex: 60,
            }}
          >
            <span style={{color: '#ffffff'}}>{error}</span>
          </div>
        )}

        <button
          type="button"
          className={`w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30 transition-all duration-200 relative ${
            isRecording ? 'z-[9998]' : 'z-50'
          } ${
            isProcessing || isConnecting ? "opacity-50 cursor-not-allowed" : "hover:from-blue-700 hover:to-indigo-800 hover:shadow-2xl hover:shadow-blue-500/40"
          }`}
          style={{ backgroundColor: '#2563eb' }}
          onClick={isProcessing ? undefined : handleClick}
          disabled={isProcessing}
          aria-label={isRecording ? "结束对话" : isConnecting ? "连接中" : "开始语音对话"}
        >
          <Mic
            className={`w-7 h-7 ${
              isRecording || isConnecting || isProcessing ? "animate-pulse" : ""
            }`}
            style={{color: '#ffffff'}}
          />
        </button>
      </div>
    </>
  );
}
