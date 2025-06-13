"use client";

import { Camera, Check } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { PageContainer } from "@/components/ui/page-container";
import MicrophoneButton from "@/components/microphone-button";
import {
  audioSpeechRecognition,
  uploadAudio,
  recognizeUrl,
  getShoppingGuide,
} from "@/api/ai";

interface PhotoData {
  imageUrl: string;
  photoUrl: string;
  recognitionResult: string;
}

interface SystemMessage {
  text: string;
  audioUrl?: string;
}

interface ConversationMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  audioUrl?: string;
  timestamp: number;
}

// 商品名称到问题的映射
const productQuestions = {
  安全的食用油: "如何选购安全的食用油？",
  无添加剂的深海鱼: "选购无含水剂的深海鱼？",
  正宗的五常大米: "如何选购正宗五常大米？",
};

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [photoData, setPhotoData] = useState<PhotoData | null>(null);
  const [userMessages, setUserMessages] = useState<string[]>([]);
  const [systemMessages, setSystemMessages] = useState<SystemMessage[]>([]);
  const [conversationMessages, setConversationMessages] = useState<
    ConversationMessage[]
  >([]);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [currentPlayingAudio, setCurrentPlayingAudio] =
    useState<HTMLAudioElement | null>(null);
  const [mockDataLoaded, setMockDataLoaded] = useState(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const apiCalledRef = useRef<string | null>(null); // 记录已经调用过API的产品名称

  useEffect(() => {
    // Check for photo data from sessionStorage
    const storedPhotoData = sessionStorage.getItem("photoData");
    if (storedPhotoData) {
      setPhotoData(JSON.parse(storedPhotoData));
      // Clear the data after reading
      sessionStorage.removeItem("photoData");
    }

    // 同步已有消息到统一对话流
    const syncExistingMessages = () => {
      const messages: ConversationMessage[] = [];
      const maxLength = Math.max(userMessages.length, systemMessages.length);

      for (let i = 0; i < maxLength; i++) {
        if (i < userMessages.length && userMessages[i]?.trim()) {
          messages.push({
            id: `user-sync-${i}`,
            type: "user",
            content: userMessages[i],
            timestamp: Date.now() - (maxLength - i) * 1000,
          });
        }

        if (i < systemMessages.length && systemMessages[i]?.text?.trim()) {
          messages.push({
            id: `assistant-sync-${i}`,
            type: "assistant",
            content: systemMessages[i].text,
            audioUrl: systemMessages[i].audioUrl,
            timestamp: Date.now() - (maxLength - i) * 1000 + 500,
          });
        }
      }

      if (messages.length > 0) {
        setConversationMessages(messages);
      }
    };

    syncExistingMessages();

    // 检查是否从商品列表进入，加载对应的mock对话
    const productName = searchParams.get("product");
    const fromParam = searchParams.get("from");

    // 如果不是从productList进入，重置状态
    if (fromParam !== "productList") {
      setMockDataLoaded(false);
      apiCalledRef.current = null; // 重置API调用标记
      return;
    }

    if (fromParam === "productList" && productName) {
      const decodedProductName = decodeURIComponent(productName);
      const question =
        productQuestions[decodedProductName as keyof typeof productQuestions];

      // 检查是否已经为这个产品调用过API
      if (question && apiCalledRef.current !== decodedProductName) {
        console.log(
          "开始调用API，产品:",
          decodedProductName,
          "之前调用过的:",
          apiCalledRef.current
        );
        // 标记已加载，防止重复
        setMockDataLoaded(true);
        apiCalledRef.current = decodedProductName; // 记录当前产品名称

        // 清空现有消息
        setUserMessages([]);
        setSystemMessages([]);
        setConversationMessages([]);

        // 清理之前的timeout
        timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
        timeoutsRef.current = [];

        // 延迟显示用户消息
        const userTimeout = setTimeout(() => {
          setUserMessages([question]);

          // 添加到统一对话流
          const userMessage: ConversationMessage = {
            id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: "user",
            content: question,
            timestamp: Date.now(),
          };
          setConversationMessages([userMessage]);
        }, 500);
        timeoutsRef.current.push(userTimeout);

        // 调用新的 API 接口获取购物指南 - 支持流式响应
        const fetchGuide = async () => {
          // 双重检查：确保在异步调用前仍然没有被重复调用
          if (apiCalledRef.current !== decodedProductName) {
            console.log("API调用被取消，因为状态已改变");
            return;
          }

          try {
            console.log("实际发起API请求，产品:", decodedProductName);
            const response = await getShoppingGuide({ question });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            if (!response.body) {
              throw new Error("No response body");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            // 初始化一个空的系统消息
            let currentMessageIndex = -1;
            let accumulatedText = "";

            const systemTimeout = setTimeout(() => {
              setSystemMessages((prev) => {
                const newMessage: SystemMessage = { text: "" };
                currentMessageIndex = prev.length;
                return [...prev, newMessage];
              });

              // 为统一对话流创建对应的消息
              const assistantMessage: ConversationMessage = {
                id: `assistant-${Date.now()}-${Math.random()
                  .toString(36)
                  .substr(2, 9)}`,
                type: "assistant",
                content: "",
                timestamp: Date.now(),
              };
              setConversationMessages((prev) => [...prev, assistantMessage]);
            }, 1000);
            timeoutsRef.current.push(systemTimeout);

            // 处理流式数据
            while (true) {
              const { done, value } = await reader.read();

              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split("\n");

              for (const line of lines) {
                if (line.trim() === "") continue;

                try {
                  const data = JSON.parse(line);

                  if (data.delta) {
                    accumulatedText += data.delta;

                    // 更新消息内容
                    setSystemMessages((prev) => {
                      if (currentMessageIndex >= 0) {
                        const updated = [...prev];
                        updated[currentMessageIndex] = {
                          ...updated[currentMessageIndex],
                          text: accumulatedText,
                        };
                        return updated;
                      }
                      return prev;
                    });

                    // 同时更新统一对话流
                    setConversationMessages((prev) => {
                      const updated = [...prev];
                      const lastMessage = updated[updated.length - 1];
                      if (lastMessage && lastMessage.type === "assistant") {
                        updated[updated.length - 1] = {
                          ...lastMessage,
                          content: accumulatedText,
                        };
                      }
                      return updated;
                    });
                  }

                  if (data.done) {
                    // 流式响应完成
                    break;
                  }
                } catch (parseError) {
                  console.error(
                    "Error parsing JSON:",
                    parseError,
                    "Line:",
                    line
                  );
                }
              }
            }
          } catch (error) {
            console.error("Error fetching shopping guide:", error);
            // 在出错时显示错误消息
            const errorTimeout = setTimeout(() => {
              setSystemMessages((prev) => [
                ...prev,
                {
                  text: "抱歉，获取购物指南时出现了问题，请稍后再试。",
                },
              ]);
            }, 1000);
            timeoutsRef.current.push(errorTimeout);
          }
        };

        fetchGuide();
      }
    }
  }, [searchParams]);

  const handleNavigate = (screen: string) => {
    if (screen === "home") {
      router.push("/");
    } else if (screen === "photo") {
      router.push("/photo");
    }
  };

  const handleAudioRecognition = async (audioFile: File) => {
    if (!audioFile) return;

    try {
      setIsProcessingAudio(true);

      // Step 1: Upload audio file to get URL
      const uploadResponse = await uploadAudio(audioFile);
      const audioUrl = uploadResponse.url;

      // Step 2: Call ASR with the audio URL
      const asrResponse = await audioSpeechRecognition(audioUrl);

      if (asrResponse.result) {
        // Display user message
        setUserMessages((prev) => [...prev, asrResponse.result]);

        // 添加到统一对话流
        const userMessage: ConversationMessage = {
          id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: "user",
          content: asrResponse.result,
          timestamp: Date.now(),
        };
        setConversationMessages((prev) => [...prev, userMessage]);

        // Step 3: Call recognizeUrl with audio_url and default query
        const recognizeResponse = await recognizeUrl({
          audio_url: audioUrl,
          fileinfo: photoData?.imageUrl || "",
          query: "请识别这个商品，并提供品牌、类别、净含量和保质期等信息",
        });

        if (recognizeResponse.result?.text_result) {
          // Add system message
          const systemMessage: SystemMessage = {
            text: recognizeResponse.result.text_result,
            audioUrl: recognizeResponse.result.audio_url,
          };
          setSystemMessages((prev) => [...prev, systemMessage]);

          // 添加到统一对话流
          const assistantMessage: ConversationMessage = {
            id: `assistant-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            type: "assistant",
            content: recognizeResponse.result.text_result,
            audioUrl: recognizeResponse.result.audio_url,
            timestamp: Date.now(),
          };
          setConversationMessages((prev) => [...prev, assistantMessage]);

          // Play audio if available
          if (recognizeResponse.result.audio_url) {
            playAudio(recognizeResponse.result.audio_url);
          }
        }
      }
    } catch (error) {
      console.error("Error processing audio:", error);
    } finally {
      setIsProcessingAudio(false);
    }
  };

  const handleUserTranscription = (text: string) => {
    // 添加用户语音转录到用户消息和统一对话流
    setUserMessages((prev) => [...prev, text]);

    const userMessage: ConversationMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "user",
      content: text,
      timestamp: Date.now(),
    };
    setConversationMessages((prev) => [...prev, userMessage]);
  };

  const handleAssistantResponse = (text: string, audioUrl?: string) => {
    // 添加AI响应到系统消息和统一对话流
    const systemMessage: SystemMessage = {
      text: text,
      audioUrl: audioUrl,
    };
    setSystemMessages((prev) => [...prev, systemMessage]);

    const assistantMessage: ConversationMessage = {
      id: `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "assistant",
      content: text,
      audioUrl: audioUrl,
      timestamp: Date.now(),
    };
    setConversationMessages((prev) => [...prev, assistantMessage]);

    // 如果有音频URL，播放音频
    if (audioUrl) {
      playAudio(audioUrl);
    }
  };

  const handleSuggestionClick = async (suggestionType: string) => {
    const suggestions = {
      成分分析: "请分析这个商品的主要成分和配料表，并评估其对健康的影响。",
      营养价值: "请分析这个商品的营养成分，并提供营养价值评估和健康建议。",
      选购建议: "请提供这类商品的选购建议，以及推荐的品牌。",
    };

    const userQuery = suggestions[suggestionType as keyof typeof suggestions];

    if (!userQuery) return;

    let apiQuery = userQuery;
    // 如果有图片识别结果，则加入上下文
    if (photoData?.recognitionResult) {
      apiQuery = `${photoData.recognitionResult}，${userQuery}`;
    }

    try {
      setIsProcessingAudio(true);

      // 清理之前的timeout
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      timeoutsRef.current = [];

      // 用户点击建议，先将问题加入对话流
      setUserMessages((prev) => [...prev, userQuery]);
      const userMessage: ConversationMessage = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: "user",
        content: userQuery,
        timestamp: Date.now(),
      };
      setConversationMessages((prev) => [...prev, userMessage]);

      // 调用 getShoppingGuide，流式处理响应
      const response = await getShoppingGuide({ question: apiQuery });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      if (!response.body) {
        throw new Error("No response body");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let currentMessageIndex = -1;
      let accumulatedText = "";
      const systemTimeout = setTimeout(() => {
        setSystemMessages((prev) => {
          const newMessage: SystemMessage = { text: "" };
          currentMessageIndex = prev.length;
          return [...prev, newMessage];
        });
        // 为统一对话流创建对应的消息
        const assistantMessage: ConversationMessage = {
          id: `assistant-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          type: "assistant",
          content: "",
          timestamp: Date.now(),
        };
        setConversationMessages((prev) => [...prev, assistantMessage]);
      }, 500);
      timeoutsRef.current.push(systemTimeout);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.trim() === "") continue;
          try {
            const data = JSON.parse(line);
            if (data.delta) {
              accumulatedText += data.delta;
              setSystemMessages((prev) => {
                if (currentMessageIndex >= 0) {
                  const updated = [...prev];
                  updated[currentMessageIndex] = {
                    ...updated[currentMessageIndex],
                    text: accumulatedText,
                  };
                  return updated;
                }
                return prev;
              });
              setConversationMessages((prev) => {
                const updated = [...prev];
                const lastMessage = updated[updated.length - 1];
                if (lastMessage && lastMessage.type === "assistant") {
                  updated[updated.length - 1] = {
                    ...lastMessage,
                    content: accumulatedText,
                  };
                }
                return updated;
              });
            }
            if (data.done) {
              break;
            }
          } catch (parseError) {
            console.error("Error parsing JSON:", parseError, "Line:", line);
          }
        }
      }
    } catch (error) {
      console.error("Error processing suggestion:", error);
      const errorTimeout = setTimeout(() => {
        setSystemMessages((prev) => [
          ...prev,
          {
            text: "抱歉，获取购物指南时出现了问题，请稍后再试。",
          },
        ]);
      }, 500);
      timeoutsRef.current.push(errorTimeout);
    } finally {
      setIsProcessingAudio(false);
    }
  };

  const playAudio = (audioUrl: string) => {
    // Stop current audio if playing
    if (currentPlayingAudio) {
      currentPlayingAudio.pause();
      currentPlayingAudio.currentTime = 0;
    }

    // Create and play new audio
    const audio = new Audio(audioUrl);
    setCurrentPlayingAudio(audio);

    audio.play().catch((error) => {
      console.error("Error playing audio:", error);
    });

    // Clean up when audio ends
    audio.onended = () => {
      setCurrentPlayingAudio(null);
    };
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (currentPlayingAudio) {
        currentPlayingAudio.pause();
        currentPlayingAudio.currentTime = 0;
      }
    };
  }, [currentPlayingAudio]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    };
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="智能助手"
        showBackButton
        onBack={() => router.push("/")}
      />

      {/* Chat Content */}
      <div className="flex-1 overflow-auto p-6 bg-gradient-to-b from-slate-50/50 to-blue-50/30">
        {/* System Message Bubbles - Only show when coming from home */}
        {searchParams.get("from") === "home" && (
          <>
            <div className="flex justify-start mb-6 animate-fade-in">
              <div className="max-w-[85%] bg-white/90 backdrop-blur-sm rounded-2xl py-4 px-5 shadow-lg shadow-blue-500/10 border border-white/20">
                <p
                  className="text-sm text-slate-800 leading-relaxed"
                  style={{ color: "#1e293b" }}
                >
                  中午好！我是您的购物健康小助手
                  <br />
                  今天来超市想买点什么呢？
                </p>
              </div>
            </div>

            <div className="flex justify-start mb-6 animate-slide-up">
              <div className="max-w-[90%] bg-white/90 backdrop-blur-sm rounded-2xl py-4 px-5 shadow-lg shadow-blue-500/10 border border-white/20">
                <p
                  className="text-sm text-slate-800 leading-relaxed mb-3"
                  style={{ color: "#1e293b" }}
                >
                  只需用手机拍摄商品，我就能立刻为您：
                </p>
                <div className="space-y-2 text-sm text-slate-700">
                  <div className="flex items-start">
                    <span
                      className="text-emerald-500 mr-3 font-medium"
                      style={{ color: "#10b981" }}
                    >
                      ✓
                    </span>
                    <span style={{ color: "#374151" }}>
                      解析隐藏风险（过敏原/添加剂预警）
                    </span>
                  </div>
                  <div className="flex items-start">
                    <span
                      className="text-emerald-500 mr-3 font-medium"
                      style={{ color: "#10b981" }}
                    >
                      ✓
                    </span>
                    <span style={{ color: "#374151" }}>
                      量化健康指数（含糖量/卡路里热量计算）
                    </span>
                  </div>
                  <div className="flex items-start">
                    <span
                      className="text-emerald-500 mr-3 font-medium"
                      style={{ color: "#10b981" }}
                    >
                      ✓
                    </span>
                    <span style={{ color: "#374151" }}>
                      全网比价（对比京东/淘宝，帮您聪明购物，锁定最佳性价比）
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="flex justify-start mb-6 animate-slide-up"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="max-w-[85%] bg-white/90 backdrop-blur-sm rounded-2xl py-4 px-5 shadow-lg shadow-blue-500/10 border border-white/20">
                <p
                  className="text-sm text-slate-800 leading-relaxed"
                  style={{ color: "#1e293b" }}
                >
                  您还可以试试按住下方的话筒，
                  <br />
                  说出您想查询的商品
                </p>
              </div>
            </div>

            <div
              className="flex justify-start mb-8 animate-slide-up"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="max-w-[90%] bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl py-4 px-5 shadow-lg shadow-blue-500/10 border border-blue-200/50">
                <p
                  className="text-sm text-slate-700 leading-relaxed"
                  style={{ color: "#374151" }}
                >
                  您可以说「请帮我查查光明酸奶的含糖量对比其他品牌如何？是否有更健康的？」
                </p>
              </div>
            </div>
          </>
        )}

        {/* Photo Recognition Result */}
        {photoData && (
          <>
            <div className="flex justify-end mb-6 animate-scale-in">
              <div className="max-w-[70%]">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 mb-2 shadow-lg shadow-blue-500/25 text-force-white"
                  style={{
                    backgroundColor: "#2563eb", // fallback color
                    color: "#ffffff",
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className="text-sm font-medium text-force-white"
                      style={{ color: "#ffffff" }}
                    >
                      图片上传完成
                    </div>
                    <Check className="w-4 h-4" style={{ color: "#ffffff" }} />
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="text-sm text-force-white"
                      style={{ color: "#ffffff" }}
                    >
                      识别为 {photoData.recognitionResult}
                    </div>
                    <Check className="w-4 h-4" style={{ color: "#ffffff" }} />
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push("/photo")}
                    className="text-blue-100 text-sm hover:text-white transition-colors underline"
                    style={{ color: "#dbeafe" }}
                  >
                    识别有误 重新拍照
                  </button>
                </div>
              </div>
              <div className="w-16 h-16 ml-3 rounded-xl overflow-hidden shadow-lg border-2 border-white">
                <img
                  src={photoData.photoUrl}
                  alt="Product thumbnail"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Suggestion Buttons */}
            <div
              className="flex justify-center mb-6 animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="flex gap-3 max-w-[95%]">
                <button
                  type="button"
                  onClick={() => handleSuggestionClick("成分分析")}
                  disabled={isProcessingAudio}
                  className="flex-1 min-w-0 bg-white/95 backdrop-blur-sm rounded-xl py-4 px-3 shadow-lg shadow-blue-500/10 border-2 border-white/40 hover:bg-white hover:border-blue-200 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center"
                >
                  <div
                    className="text-sm font-semibold text-slate-800 whitespace-nowrap"
                    style={{ color: "#1e293b" }}
                  >
                    💡 成分分析
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSuggestionClick("营养价值")}
                  disabled={isProcessingAudio}
                  className="flex-1 min-w-0 bg-white/95 backdrop-blur-sm rounded-xl py-4 px-3 shadow-lg shadow-blue-500/10 border-2 border-white/40 hover:bg-white hover:border-blue-200 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center"
                >
                  <div
                    className="text-sm font-semibold text-slate-800 whitespace-nowrap"
                    style={{ color: "#1e293b" }}
                  >
                    🏥 营养价值
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSuggestionClick("选购建议")}
                  disabled={isProcessingAudio}
                  className="flex-1 min-w-0 bg-white/95 backdrop-blur-sm rounded-xl py-4 px-3 shadow-lg shadow-blue-500/10 border-2 border-white/40 hover:bg-white hover:border-blue-200 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center"
                >
                  <div
                    className="text-sm font-semibold text-slate-800 whitespace-nowrap"
                    style={{ color: "#1e293b" }}
                  >
                    🏷️ 选购建议
                  </div>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Conversation Messages - 统一的对话流 */}
        {conversationMessages.map((message) => (
          <div
            key={message.id}
            className={`flex mb-6 ${
              message.type === "user" ? "justify-end" : "justify-start"
            } animate-fade-in`}
          >
            {message.type === "user" ? (
              // 用户消息气泡（右侧，蓝色）
              <div
                className="max-w-[85%] bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl py-4 px-5 shadow-lg shadow-blue-500/25 text-force-white"
                style={{
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                }}
              >
                <p
                  className="text-sm leading-relaxed text-force-white"
                  style={{ color: "#ffffff" }}
                >
                  {message.content}
                </p>
              </div>
            ) : (
              // AI助手消息气泡（左侧，白色）
              <div className="max-w-[85%] bg-white/90 backdrop-blur-sm rounded-2xl py-4 px-5 shadow-lg shadow-blue-500/10 border border-white/20">
                <div
                  className="text-sm text-slate-800 leading-relaxed whitespace-pre-line"
                  style={{ color: "#1e293b" }}
                >
                  {message.content}
                </div>
                {message.audioUrl && (
                  <button
                    type="button"
                    onClick={() => playAudio(message.audioUrl!)}
                    className="mt-3 inline-flex items-center text-xs text-blue-600 hover:text-blue-700 transition-colors font-medium"
                    style={{ color: "#2563eb" }}
                  >
                    🔊 点这里听
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Processing indicator */}
        {isProcessingAudio && (
          <div className="flex justify-end mb-6">
            <div
              className="max-w-[70%] bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl py-4 px-5 shadow-lg shadow-blue-500/25 text-force-white"
              style={{
                backgroundColor: "#2563eb", // fallback color
                color: "#ffffff",
              }}
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-white/70 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-white/70 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <span
                  className="text-sm ml-2 text-force-white"
                  style={{ color: "#ffffff" }}
                >
                  正在处理...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 flex items-center justify-center gap-6 bg-white/60 backdrop-blur-sm border-t border-slate-200/60">
        <button
          type="button"
          onClick={() => router.push("/photo")}
          className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center hover:from-slate-600 hover:to-slate-800 transition-all duration-200 shadow-lg shadow-slate-500/25 hover:scale-105"
          style={{
            backgroundColor: "#374151", // fallback color
          }}
          aria-label="拍照"
        >
          <Camera className="w-6 h-6" style={{ color: "#ffffff" }} />
        </button>
        <MicrophoneButton
          onNavigate={handleNavigate}
          onAudioRecorded={handleAudioRecognition}
          isProcessing={isProcessingAudio}
          onUserTranscription={handleUserTranscription}
          onAssistantResponse={handleAssistantResponse}
          initialContext={
            photoData || conversationMessages.length > 0
              ? {
                  photoData: photoData || undefined,
                  userMessages: conversationMessages
                    .filter((msg) => msg.type === "user" && msg.content?.trim())
                    .map((msg) => msg.content),
                  systemMessages: conversationMessages
                    .filter(
                      (msg) => msg.type === "assistant" && msg.content?.trim()
                    )
                    .map((msg) => ({
                      text: msg.content,
                      audioUrl: msg.audioUrl,
                    })),
                }
              : undefined
          }
        />
      </div>
    </PageContainer>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <ChatContent />
    </Suspense>
  );
}
