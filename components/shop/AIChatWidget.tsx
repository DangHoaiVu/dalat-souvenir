"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { X, Send, Sparkles, AlertCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { authFetch } from "@/lib/auth-fetch";
import { useAuthStore } from "@/stores/authStore";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

function isStoredMessage(value: unknown): value is Omit<Message, "timestamp"> & { timestamp: string } {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    (item.role === "user" || item.role === "assistant") &&
    typeof item.content === "string" &&
    typeof item.timestamp === "string"
  );
}

const QUICK_PROMPTS = [
  "Sản phẩm quà tặng tiêu biểu?",
  "Liên hệ và địa chỉ shop ở đâu?",
  "Đặc sản nào tốt cho sức khỏe?",
  "Có khuyến mãi gì hôm nay không?",
  "Shop hỗ trợ thanh toán bằng cách nào?",
];

const GUEST_CHAT_KEY = "dalat_souvenir_chat_history:guest";
const SPEECH_BUBBLES = [
  "Chào bạn iu! Cần bé tư vấn món quà xinh nào hông nè?",
  "Đà Lạt hôm nay se lạnh, bạn cần tìm chút ấm áp hông?",
  "Bé thấy bạn rồi nha, ghé hỏi bé một câu đi nè.",
  "Quà xinh đang chờ chủ nhân dễ thương đó nha.",
  "Bạn đang tìm đặc sản hay đồ lưu niệm đáng yêu nè?",
  "Bấm vào bé đi, bé tư vấn quà Đà Lạt siêu có tâm.",
  "Mua quà mà phân vân thì để bé lo nha.",
  "Bé trực 24/7, chỉ chờ bạn hỏi thôi á.",
];

function getWelcomeMessage(): Message {
  return {
    id: "welcome",
    role: "assistant",
    content: "Dạ em chào anh/chị! Em là trợ lý ảo 24/7 của Đà Lạt Souvenir. Em có thể giúp anh/chị tìm hiểu về đặc sản, quà lưu niệm, khuyến mãi, phương thức thanh toán, thông tin liên hệ của shop hoặc tư vấn các sản phẩm tốt cho sức khỏe ạ. Anh/chị cần em hỗ trợ gì ạ?",
    timestamp: new Date(),
  };
}

function renderMessageContent(content: string) {
  const nodes: React.ReactNode[] = [];
  const boldPattern = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = boldPattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(content.slice(lastIndex, match.index));
    }

    nodes.push(
      <strong key={`bold-${match.index}`} className="font-bold">
        {match[1]}
      </strong>,
    );
    lastIndex = boldPattern.lastIndex;
  }

  if (lastIndex < content.length) {
    nodes.push(content.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : content;
}

export default function AIChatWidget() {
  const pathname = usePathname();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [speechText, setSpeechText] = useState(SPEECH_BUBBLES[0]);
  const [attentionKey, setAttentionKey] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hideSpeechTimerRef = useRef<number | null>(null);
  const suppressNextClickRef = useRef(false);

  // Hidden on checkout page and cart page as per user request to avoid distraction
  const isHidden = pathname === "/checkout" || pathname === "/cart";

  const chatStorageKey = currentUserId
    ? `dalat_souvenir_chat_history:user:${currentUserId}`
    : GUEST_CHAT_KEY;

  // Load chat history from sessionStorage when the current chat owner changes.
  useEffect(() => {
    const saved = sessionStorage.getItem(chatStorageKey);
    if (saved) {
      try {
        const parsed: unknown = JSON.parse(saved);
        const restored = Array.isArray(parsed)
          ? parsed.filter(isStoredMessage).map((message) => ({
              ...message,
              timestamp: new Date(message.timestamp),
            }))
          : [];
        setMessages(restored.length > 0 ? restored : [getWelcomeMessage()]);
      } catch (e) {
        console.error("Failed to parse chat history", e);
        setMessages([getWelcomeMessage()]);
      }
    } else {
      setMessages([getWelcomeMessage()]);
    }
    setErrorMsg("");
    setInputValue("");
  }, [chatStorageKey]);

  // Save history to sessionStorage whenever it changes
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(chatStorageKey, JSON.stringify(messages));
    }
  }, [chatStorageKey, messages]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isHidden || isOpen) {
      setShowSpeechBubble(false);
      return;
    }

    const showRandomSpeech = () => {
      const message = SPEECH_BUBBLES[Math.floor(Math.random() * SPEECH_BUBBLES.length)];
      setSpeechText(message);
      setShowSpeechBubble(true);
      setAttentionKey((value) => value + 1);

      if (hideSpeechTimerRef.current) {
        window.clearTimeout(hideSpeechTimerRef.current);
      }

      hideSpeechTimerRef.current = window.setTimeout(() => {
        setShowSpeechBubble(false);
      }, 6500);
    };

    const firstTimer = window.setTimeout(showRandomSpeech, 2500);
    const intervalTimer = window.setInterval(showRandomSpeech, 10000);

    return () => {
      window.clearTimeout(firstTimer);
      window.clearInterval(intervalTimer);
      if (hideSpeechTimerRef.current) {
        window.clearTimeout(hideSpeechTimerRef.current);
      }
    };
  }, [isHidden, isOpen]);

  if (isHidden) return null;

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    setErrorMsg("");
    const userMsg: Message = {
      id: Math.random().toString(36).substring(7),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await authFetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages
            .filter((message) => message.id !== "welcome")
            .map((message) => ({ role: message.role, content: message.content })),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Không thể kết nối với server");
      }

      if (data?.error && !data?.reply) {
        throw new Error(data.error);
      }

      const assistantMsg: Message = {
        id: Math.random().toString(36).substring(7),
        role: "assistant",
        content: data?.reply || "Dạ hiện tại em chưa có phản hồi phù hợp. Anh/chị vui lòng thử hỏi lại giúp em ạ.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Có lỗi kết nối xảy ra. Vui lòng thử lại!";
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const handleQuickPromptClick = (promptText: string) => {
    handleSendMessage(promptText);
  };

  const handleClearHistory = () => {
    sessionStorage.removeItem(chatStorageKey);
    setMessages([getWelcomeMessage()]);
  };

  return (
    <>
      <style jsx global>{`
        @keyframes dalat-cat-breathe {
          0%,
          100% {
            transform: scaleY(0.985) translateY(0);
          }
          50% {
            transform: scaleY(1.02) translateY(-1px);
          }
        }

        @keyframes dalat-cat-tail {
          0%,
          100% {
            transform: rotate(-8deg);
          }
          50% {
            transform: rotate(12deg);
          }
        }

        @keyframes dalat-cat-blink {
          0%,
          88%,
          100% {
            transform: scaleY(1);
          }
          92%,
          96% {
            transform: scaleY(0.12);
          }
        }

        @keyframes dalat-cat-paw {
          0%,
          100% {
            transform: rotate(0deg) translateY(0);
          }
          50% {
            transform: rotate(-18deg) translateY(-4px);
          }
        }

        .dalat-cat-body {
          animation: dalat-cat-breathe 3.4s ease-in-out infinite;
          transform-origin: 64px 92px;
        }

        .dalat-cat-tail {
          animation: dalat-cat-tail 2.8s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: 10% 90%;
        }

        .dalat-cat-eye {
          animation: dalat-cat-blink 5.5s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }

        .dalat-cat-paw {
          transition: transform 180ms ease;
          transform-box: fill-box;
          transform-origin: 70% 70%;
        }

        .dalat-cat-button:hover .dalat-cat-paw {
          animation: dalat-cat-paw 0.8s ease-in-out infinite;
        }

        .dalat-cat-ear {
          transition: transform 180ms ease;
          transform-box: fill-box;
          transform-origin: bottom center;
        }

        .dalat-cat-button:hover .dalat-cat-ear-left {
          transform: rotate(-8deg) translateY(-2px);
        }

        .dalat-cat-button:hover .dalat-cat-ear-right {
          transform: rotate(8deg) translateY(-2px);
        }
      `}</style>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mb-4 flex h-[min(520px,calc(100vh-7rem))] w-[calc(100vw-2rem)] max-w-[400px] flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
          >
            {/* Header */}
            <div className="relative flex items-center justify-between bg-gradient-to-r from-sky-600 via-sky-500 to-sky-400 p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="relative flex size-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                  <Sparkles className="size-5 text-yellow-200" />
                  <span className="absolute bottom-0 right-0 size-2.5 rounded-full border border-white bg-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Trợ lý Đà Lạt Souvenir</h3>
                  <p className="text-[10px] text-sky-100 flex items-center gap-1">
                    <span>Đang trực tuyến 24/7</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleClearHistory}
                  title="Xóa cuộc hội thoại"
                  className="rounded-lg p-1.5 text-sky-100 hover:bg-white/10 hover:text-white transition-colors text-xs"
                >
                  Xóa lịch sử
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1.5 text-sky-100 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="custom-scrollbar flex-1 overflow-y-auto bg-[var(--color-bg)] p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm leading-relaxed whitespace-pre-line ${
                      msg.role === "user"
                        ? "bg-sky-500 text-white rounded-tr-none"
                        : "bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-tl-none"
                    }`}
                  >
                    {renderMessageContent(msg.content)}
                  </div>
                </div>
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
                    <span className="size-2 animate-bounce rounded-full bg-sky-400" style={{ animationDelay: "0ms" }} />
                    <span className="size-2 animate-bounce rounded-full bg-sky-400" style={{ animationDelay: "150ms" }} />
                    <span className="size-2 animate-bounce rounded-full bg-sky-400" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMsg && (
                <div className="flex justify-center">
                  <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-100">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            {messages.length <= 1 && !isLoading && (
              <div className="bg-[var(--color-bg)] px-4 pb-2 pt-1 flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleQuickPromptClick(prompt)}
                    className="rounded-full border border-sky-200 bg-white px-2.5 py-1 text-xs text-sky-700 hover:bg-sky-50 transition duration-150 ease-in-out font-medium"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={handleFormSubmit}
              className="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-3 flex gap-2 items-center"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Nhập câu hỏi của bạn..."
                disabled={isLoading}
                className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-sm focus:border-sky-400 focus:outline-none disabled:opacity-50 text-[var(--color-text-primary)]"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="flex size-10 items-center justify-center rounded-xl bg-sky-500 text-white shadow-md hover:bg-sky-600 active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:active:scale-100 transition-all"
              >
                <Send className="size-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* Draggable Mascot Toggle */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.2}
        onDragStart={() => {
          suppressNextClickRef.current = true;
          setShowSpeechBubble(false);
        }}
        onDragEnd={() => {
          window.setTimeout(() => {
            suppressNextClickRef.current = false;
          }, 180);
        }}
        initial={{ opacity: 0, y: 18, scale: 0.88 }}
        animate={{
          opacity: isOpen ? 0 : 1,
          y: isOpen ? 18 : 0,
          scale: isOpen ? 0.65 : 1,
        }}
        style={{ pointerEvents: isOpen ? "none" : "auto" }}
        transition={{ type: "spring", stiffness: 420, damping: 26 }}
        whileDrag={{ scale: 1.06, rotate: 2 }}
        className="fixed bottom-5 right-5 z-50 flex cursor-grab flex-col items-center active:cursor-grabbing"
      >
        <AnimatePresence>
          {showSpeechBubble && !isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="absolute bottom-[88px] right-0 w-64 rounded-2xl border border-sky-100 bg-white/90 p-3 pr-9 text-sm font-semibold leading-relaxed text-slate-700 shadow-lg backdrop-blur-md"
              onClick={() => {
                if (suppressNextClickRef.current) return;
                setIsOpen(true);
              }}
            >
              <button
                type="button"
                aria-label="Tắt lời chào"
                onClick={(event) => {
                  event.stopPropagation();
                  setShowSpeechBubble(false);
                }}
                className="absolute right-2 top-2 rounded-full p-1 text-slate-400 transition hover:bg-sky-50 hover:text-sky-600"
              >
                <X className="size-3.5" />
              </button>
              {speechText}
              <span className="absolute -bottom-2 right-8 size-4 rotate-45 border-b border-r border-sky-100 bg-white/90" />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          key={attentionKey}
          type="button"
          aria-label="Mở trợ lý Đà Lạt Souvenir"
          onClick={() => {
            if (suppressNextClickRef.current) return;
            setShowSpeechBubble(false);
            setIsOpen(true);
          }}
          initial={{ y: 0, rotate: 0 }}
          animate={{ y: [0, -10, 0], rotate: [0, -5, 4, 0] }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          whileHover={{ scale: 1.08, y: -4 }}
          whileTap={{ scale: 0.96 }}
          className="dalat-cat-button relative flex size-24 items-center justify-center border-0 bg-transparent p-0 outline-none drop-shadow-[0_18px_24px_rgba(14,116,144,0.28)]"
        >
          <CatMascot />
          <span className="absolute right-3 top-5 flex size-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-3.5 rounded-full border-2 border-white bg-emerald-500" />
          </span>
        </motion.button>
      </motion.div>
    </>
  );
}

function CatMascot() {
  return (
    <svg
      width="104"
      height="104"
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="overflow-visible"
    >
      <motion.g
        initial={false}
        whileHover={{ rotate: [-2, 2, -1, 0] }}
        transition={{ duration: 0.5 }}
      >
        <ellipse cx="65" cy="111" rx="37" ry="9" fill="#075985" opacity="0.18" />
        <path
          className="dalat-cat-tail"
          d="M91 82C111 77 115 58 105 50C98 44 89 50 92 58C95 65 105 62 105 55"
          stroke="#F59E0B"
          strokeWidth="11"
          strokeLinecap="round"
        />
        <path
          className="dalat-cat-tail"
          d="M91 82C111 77 115 58 105 50C98 44 89 50 92 58C95 65 105 62 105 55"
          stroke="#FDE68A"
          strokeWidth="5"
          strokeLinecap="round"
        />

        <g className="dalat-cat-body">
          <path
            d="M32 54C29 36 35 24 45 18L57 34C62 33 67 33 72 34L84 18C95 24 100 37 96 55C105 64 109 78 105 92C100 112 81 119 64 119C47 119 28 112 23 92C19 78 23 64 32 54Z"
            fill="#FFF7ED"
            stroke="#0EA5E9"
            strokeWidth="3"
          />
          <path
            className="dalat-cat-ear dalat-cat-ear-left"
            d="M43 22L35 48L58 36L43 22Z"
            fill="#FDE68A"
            stroke="#0EA5E9"
            strokeWidth="3"
          />
          <path
            className="dalat-cat-ear dalat-cat-ear-right"
            d="M85 22L70 36L93 48L85 22Z"
            fill="#FDE68A"
            stroke="#0EA5E9"
            strokeWidth="3"
          />
          <path d="M48 84C52 96 75 96 80 84C82 101 75 111 64 111C53 111 46 101 48 84Z" fill="#FED7AA" />
          <path d="M54 69C57 73 61 73 64 69C67 73 71 73 74 69" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
          <path d="M64 62L59 67H69L64 62Z" fill="#F97316" />
          <g className="dalat-cat-eye">
            <ellipse cx="49" cy="57" rx="5" ry="6" fill="#0F172A" />
            <ellipse cx="79" cy="57" rx="5" ry="6" fill="#0F172A" />
            <circle cx="51" cy="54" r="1.6" fill="white" />
            <circle cx="81" cy="54" r="1.6" fill="white" />
          </g>
          <path d="M37 66C26 62 18 62 10 66" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
          <path d="M37 74C26 74 18 78 11 84" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
          <path d="M91 66C102 62 110 62 118 66" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
          <path d="M91 74C102 74 110 78 117 84" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
          <path className="dalat-cat-paw" d="M38 91C31 91 27 96 28 102C29 108 38 108 43 102" fill="#FDBA74" stroke="#0EA5E9" strokeWidth="3" strokeLinecap="round" />
          <path d="M90 91C97 91 101 96 100 102C99 108 90 108 85 102" fill="#FDBA74" stroke="#0EA5E9" strokeWidth="3" strokeLinecap="round" />
          <path d="M57 45C62 40 68 40 73 45" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
          <circle cx="35" cy="76" r="4" fill="#FBCFE8" opacity="0.9" />
          <circle cx="93" cy="76" r="4" fill="#FBCFE8" opacity="0.9" />
        </g>
        <motion.g
          animate={{ y: [0, -5, 0], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M24 20L27 27L34 30L27 33L24 40L21 33L14 30L21 27L24 20Z" fill="#FACC15" />
          <path d="M103 20L105 25L110 27L105 29L103 34L101 29L96 27L101 25L103 20Z" fill="#38BDF8" />
        </motion.g>
      </motion.g>
    </svg>
  );
}
