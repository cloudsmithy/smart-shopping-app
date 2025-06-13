"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Mic } from "lucide-react";
import { createRealtimeSession, getRealtimeWsUrl } from "@/api/ai";
import type React from "react";

interface MicrophoneButtonProps {
  onNavigate: (screen: string) => void;
  onAudioRecorded?: (audioFile: File) => void;
  isProcessing?: boolean;
  onUserTranscription?: (text: string) => void;
  onAssistantResponse?: (text: string, audioUrl?: string) => void;
  initialContext?: {
    photoData?: {
      imageUrl: string;
      photoUrl: string;
      recognitionResult: string;
    };
    userMessages?: string[];
    systemMessages?: Array<{
      text: string;
      audioUrl?: string;
    }>;
  };
}

export default function MicrophoneButton({
  onNavigate,
  onAudioRecorded,
  isProcessing = false,
  onUserTranscription,
  onAssistantResponse,
  initialContext,
}: MicrophoneButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logging, setLogging] = useState<string[]>([]);

  // Refs for WebSocket and Audio Processing
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioQueue = useRef<AudioBuffer[]>([]);
  const isPlayingAudio = useRef(false);

  // 用于播放AI返回的音频
  const audioRef = useRef<HTMLAudioElement>(null);
  // 用于累积响应文本
  const currentResponseTextRef = useRef<string>("");

  const log = (msg: string) => {
    console.log(msg);
    setLogging((prev) => [...prev, msg]);
  };

  // Cleanup function
  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }

    audioQueue.current = [];
    isPlayingAudio.current = false;

    // 重置累积文本
    currentResponseTextRef.current = "";

    setIsRecording(false);
    setIsConnecting(false);
    setLogging([]);
  };

  useEffect(() => {
    return cleanup;
  }, []);

  // --- 音频处理辅助函数 ---

  // 将 Float32Array 转换为 16-bit PCM ArrayBuffer
  const float32To16bitPCM = (input: Float32Array): ArrayBuffer => {
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return buffer;
  };

  // 将 Base64 字符串解码为 ArrayBuffer
  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  // 将 16-bit PCM ArrayBuffer 转换为 Float32Array
  const pcm16ToFloat32 = (arrayBuffer: ArrayBuffer): Float32Array => {
    const dataView = new DataView(arrayBuffer);
    const float32Array = new Float32Array(arrayBuffer.byteLength / 2);
    for (let i = 0; i < float32Array.length; i++) {
      const int16 = dataView.getInt16(i * 2, true);
      float32Array[i] = int16 / 32768;
    }
    return float32Array;
  };

  const startRealtimeSession = async () => {
    try {
      setError(null);
      setIsConnecting(true);
      setLogging([]);
      log("🚀 开始建立实时语音会话 (WebSocket)...");

      // ① 从后端获取 session_id
      const { session_id } = await createRealtimeSession();
      log(`🆗 Session ${session_id} 获取成功`);

      // ② 采集麦克风
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      localStreamRef.current = localStream;
      log("🎤 麦克风已连接");

      // ③ 建立 WebSocket 连接
      const wsUrl = getRealtimeWsUrl(session_id);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // --- WebSocket 事件处理 ---

      ws.onopen = () => {
        log("📡 WebSocket 连接已打开");
        setIsConnecting(false);
        setIsRecording(true);

        // 构建系统指令
        let instructions =
          "你是一位耐心、专业的中文购物助理。请用简洁、友好的语气回答用户关于商品的问题。";
        if (initialContext?.photoData) {
          instructions += `\n\n当前用户已上传商品图片，识别结果：${initialContext.photoData.recognitionResult}。图片URL: ${initialContext.photoData.imageUrl}。请结合这个商品信息来回答用户的问题。`;
        }

        // 发送会话配置
        const sessionUpdate = {
          type: "session.update",
          session: {
            instructions: instructions,
            voice: "alloy",
            input_audio_format: "pcm16",
            output_audio_format: "pcm16",
            input_audio_transcription: {
              model: "whisper-1",
            },
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500,
            },
          },
        };
        ws.send(JSON.stringify(sessionUpdate));
        log("➡️ 会话配置已发送");

        // 发送对话历史
        if (
          initialContext &&
          ((initialContext.userMessages &&
            initialContext.userMessages.length > 0) ||
            (initialContext.systemMessages &&
              initialContext.systemMessages.length > 0))
        ) {
          log("📚 开始发送对话历史");
          try {
            const allMessages: Array<{
              type: "user" | "assistant";
              content: string;
            }> = [];
            const userMsgs = initialContext.userMessages || [];
            const systemMsgs = initialContext.systemMessages || [];
            const maxLength = Math.max(userMsgs.length, systemMsgs.length);

            for (let i = 0; i < maxLength; i++) {
              if (i < userMsgs.length && userMsgs[i]?.trim()) {
                allMessages.push({ type: "user", content: userMsgs[i].trim() });
              }
              if (i < systemMsgs.length && systemMsgs[i]?.text?.trim()) {
                allMessages.push({
                  type: "assistant",
                  content: systemMsgs[i].text.trim(),
                });
              }
            }

            allMessages.forEach((message, index) => {
              if (message.content && message.content.length > 0) {
                const conversationItem = {
                  type: "conversation.item.create",
                  item: {
                    type: "message",
                    role: message.type,
                    content: [{ type: "text", text: message.content }],
                  },
                };
                ws.send(JSON.stringify(conversationItem));
                log(
                  `📝 发送历史消息 ${index + 1}/${allMessages.length}: ${
                    message.type
                  } - ${message.content.substring(0, 30)}...`
                );
              }
            });
            log(`✅ 对话历史发送完成，共 ${allMessages.length} 条消息`);
          } catch (error) {
            log(`❌ 发送对话历史时出错: ${error}`);
          }
        } else {
          log("📚 无历史对话需要发送");
        }

        // ④ 设置音频处理和发送
        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(localStream);
        const scriptNode = audioContext.createScriptProcessor(4096, 1, 1);
        scriptProcessorRef.current = scriptNode;

        scriptNode.onaudioprocess = (audioProcessingEvent) => {
          if (ws.readyState === WebSocket.OPEN) {
            const inputData =
              audioProcessingEvent.inputBuffer.getChannelData(0);
            const pcmData = float32To16bitPCM(inputData);

            // 将 PCM 数据转换为 base64 并发送 input_audio_buffer.append 事件
            const base64Audio = btoa(
              String.fromCharCode(...new Uint8Array(pcmData))
            );
            const audioEvent = {
              type: "input_audio_buffer.append",
              audio: base64Audio,
            };
            ws.send(JSON.stringify(audioEvent));
          }
        };

        source.connect(scriptNode);
        scriptNode.connect(audioContext.destination);
        log("🎧 音频发送已启动");
      };

      ws.onmessage = (e) => {
        // 播放音频队列中的下一个音频
        const playNextInQueue = () => {
          if (
            !isPlayingAudio.current &&
            audioQueue.current.length > 0 &&
            audioContextRef.current
          ) {
            isPlayingAudio.current = true;

            const bufferToPlay = audioQueue.current.shift()!;
            const source = audioContextRef.current.createBufferSource();
            source.buffer = bufferToPlay;
            source.connect(audioContextRef.current.destination);
            source.start();
            source.onended = () => {
              isPlayingAudio.current = false;
              playNextInQueue();
            };
          }
        };

        if (typeof e.data === "string") {
          try {
            const data = JSON.parse(e.data);
            log(`⬅️ ${data.type}`);

            if (data.type === "input_audio_buffer.speech_stopped") {
              log("🎤 用户停止说话");
            } else if (
              data.type ===
              "conversation.item.input_audio_transcription.completed"
            ) {
              if (data.transcript && onUserTranscription) {
                log(`👤 用户说: ${data.transcript}`);
                onUserTranscription(data.transcript);
              }
            } else if (data.type === "response.audio_transcript.delta") {
              if (data.delta) {
                currentResponseTextRef.current += data.delta;
                log(`🤖 AI回复增量: ${data.delta}`);
              }
            } else if (data.type === "response.audio_transcript.done") {
              const fullText = currentResponseTextRef.current;
              if (fullText && onAssistantResponse) {
                log(`🤖 AI完整回复: ${fullText}`);
                onAssistantResponse(fullText);
              }
              currentResponseTextRef.current = "";
            } else if (data.type === "response.audio.delta") {
              // 处理 AI 返回的音频数据
              if (data.delta && audioContextRef.current) {
                try {
                  const audioArrayBuffer = base64ToArrayBuffer(data.delta);
                  const float32Data = pcm16ToFloat32(audioArrayBuffer);
                  const audioBuffer = audioContextRef.current.createBuffer(
                    1,
                    float32Data.length,
                    24000
                  );
                  audioBuffer.getChannelData(0).set(float32Data);
                  audioQueue.current.push(audioBuffer);
                  playNextInQueue();
                  log("🎵 收到音频增量数据");
                } catch (error) {
                  log(`❌ 音频解码失败: ${error}`);
                }
              }
            } else if (data.type === "error") {
              log(`❌ 错误: ${data.error?.message || "未知错误"}`);
              setError(data.error?.message || "发生未知错误");
            }
          } catch (err) {
            log(`⬅️ ${e.data}`);
          }
        }
      };

      ws.onerror = (error) => {
        log(`❌ WebSocket 错误: ${JSON.stringify(error)}`);
        setError("WebSocket 连接失败");
        cleanup();
      };

      ws.onclose = (event) => {
        log(`🔌 WebSocket 连接已关闭: ${event.code} ${event.reason}`);
        if (!event.wasClean) {
          setError("连接意外断开");
        }
        cleanup();
      };
    } catch (err) {
      console.error("启动实时会话失败:", err);
      setError(
        err instanceof Error
          ? err.message
          : "无法建立语音连接，请检查网络和麦克风权限"
      );
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
      {(isRecording || isConnecting) &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center"
            style={{ pointerEvents: "auto" }}
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
                    <p className="text-white/70 text-sm">
                      请稍候，正在建立连接
                    </p>
                  )}
                </div>

                {/* 日志显示（开发时可见） */}
                {process.env.NODE_ENV === "development" &&
                  logging.length > 0 && (
                    <div className="bg-black/20 rounded-lg p-3 max-h-32 overflow-y-auto">
                      <pre className="text-xs text-white/80 text-left">
                        {logging.slice(-5).join("\n")}
                      </pre>
                    </div>
                  )}

                {/* 取消按钮 */}
                {!isConnecting && (
                  <div className="flex justify-center">
                    <button
                      onClick={stopRealtimeSession}
                      className="w-12 h-12 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 border border-red-500/30"
                      style={{ pointerEvents: "auto" }}
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
      <audio ref={audioRef} autoPlay style={{ display: "none" }} />

      <div className="relative">
        {error && (
          <div
            className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-red-500/90 backdrop-blur-sm rounded-xl whitespace-nowrap shadow-lg text-force-white"
            style={{
              backgroundColor: "#ef4444",
              color: "#ffffff",
              padding: "8px 16px",
              fontSize: "12px",
              zIndex: 60,
            }}
          >
            <span style={{ color: "#ffffff" }}>{error}</span>
          </div>
        )}

        <button
          type="button"
          className={`w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30 transition-all duration-200 relative ${
            isRecording ? "z-[9998]" : "z-50"
          } ${
            isProcessing || isConnecting
              ? "opacity-50 cursor-not-allowed"
              : "hover:from-blue-700 hover:to-indigo-800 hover:shadow-2xl hover:shadow-blue-500/40"
          }`}
          style={{ backgroundColor: "#2563eb" }}
          onClick={isProcessing ? undefined : handleClick}
          disabled={isProcessing}
          aria-label={
            isRecording ? "结束对话" : isConnecting ? "连接中" : "开始语音对话"
          }
        >
          <Mic
            className={`w-7 h-7 ${
              isRecording || isConnecting || isProcessing ? "animate-pulse" : ""
            }`}
            style={{ color: "#ffffff" }}
          />
        </button>
      </div>
    </>
  );
}
