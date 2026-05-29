"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { X, Send, Sparkles, AlertCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  "Sản phẩm quà tặng tiêu biểu?",
  "Liên hệ và địa chỉ shop ở đâu?",
  "Đặc sản nào tốt cho sức khỏe?",
  "Có khuyến mãi gì hôm nay không?",
];

export default function AIChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Mascot States
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [isWiggling, setIsWiggling] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hidden on checkout page and cart page
  const isHidden = pathname === "/checkout" || pathname === "/cart";

  // Load chat history from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("dalat_souvenir_chat_history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const restored = parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
        setMessages(restored);
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    } else {
      // Default welcome message
      const welcomeMessage: Message = {
        id: "welcome",
        role: "assistant",
        content: "Dạ em chào anh/chị! Em là trợ lý ảo 24/7 của Đà Lạt Souvenir. Em có thể giúp anh/chị tìm hiểu về đặc sản, quà lưu niệm, thông tin liên hệ của shop hoặc tư vấn các sản phẩm tốt cho sức khỏe ạ. Anh/chị cần em hỗ trợ gì ạ?",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  // Show speech bubble after 4 seconds and auto-hide after 6 seconds
  useEffect(() => {
    if (isOpen || isHidden) return;

    const showTimer = setTimeout(() => {
      setShowSpeechBubble(true);
    }, 4000);

    const hideTimer = setTimeout(() => {
      setShowSpeechBubble(false);
    }, 10000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [isOpen, isHidden]);

  // Periodic mascot wiggle animation to attract attention (every 14 seconds)
  useEffect(() => {
    if (isOpen || isHidden) return;

    const interval = setInterval(() => {
      setIsWiggling(true);
      setTimeout(() => setIsWiggling(false), 1200);
    }, 14000);

    return () => clearInterval(interval);
  }, [isOpen, isHidden]);

  // Save history to sessionStorage whenever it changes
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem("dalat_souvenir_chat_history", JSON.stringify(messages));
    }
  }, [messages]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

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
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error("Không thể kết nối với server");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMsg: Message = {
        id: Math.random().toString(36).substring(7),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error: any) {
      setErrorMsg(error?.message || "Có lỗi kết nối xảy ra. Vui lòng thử lại!");
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
    sessionStorage.removeItem("dalat_souvenir_chat_history");
    const welcomeMessage: Message = {
      id: "welcome",
      role: "assistant",
      content: "Dạ em chào anh/chị! Em là trợ lý ảo 24/7 của Đà Lạt Souvenir. Em có thể giúp anh/chị tìm hiểu về đặc sản, quà lưu niệm, thông tin liên hệ của shop hoặc tư vấn các sản phẩm tốt cho sức khỏe ạ. Anh/chị cần em hỗ trợ gì ạ?",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      {/* CSS Animations for the Mascot */}
      <style jsx global>{`
        @keyframes cat-breath {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.03, 0.97) translateY(1px); }
        }
        @keyframes tail-wag {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(15deg); }
        }
        .animate-cat-breath {
          animation: cat-breath 3s ease-in-out infinite;
        }
        .animate-tail-wag {
          transform-origin: 24px 35px;
          animation: tail-wag 2s ease-in-out infinite;
        }
      `}</style>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="pointer-events-auto mb-4 flex h-[520px] w-[360px] flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl sm:w-[400px]"
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
                  type="button"
                  onClick={handleClearHistory}
                  title="Xóa cuộc hội thoại"
                  className="rounded-lg p-1.5 text-sky-100 hover:bg-white/10 hover:text-white transition-colors text-xs min-h-0 h-auto"
                >
                  Xóa lịch sử
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1.5 text-sky-100 hover:bg-white/10 hover:text-white transition-colors min-h-0 h-auto"
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
                    {msg.content}
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
                    type="button"
                    onClick={() => handleQuickPromptClick(prompt)}
                    className="rounded-full border border-sky-200 bg-white px-2.5 py-1 text-xs text-sky-700 hover:bg-sky-50 transition duration-150 ease-in-out font-medium min-h-0 h-auto"
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
                className="flex size-10 items-center justify-center rounded-xl bg-sky-500 text-white shadow-md hover:bg-sky-600 active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:active:scale-100 transition-all min-h-0"
              >
                <Send className="size-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speech bubble popup */}
      <AnimatePresence>
        {showSpeechBubble && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.85 }}
            className="pointer-events-auto mb-3 flex max-w-[240px] items-start gap-2 rounded-2xl border border-sky-100 bg-white/95 p-3 shadow-lg backdrop-blur-md text-[var(--color-text-primary)]"
          >
            <div 
              onClick={() => {
                setIsOpen(true);
                setShowSpeechBubble(false);
              }}
              className="cursor-pointer text-xs font-medium leading-relaxed"
            >
              Chào bạn iu! Bé có thể giúp gì hông nè? 🐾
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowSpeechBubble(false);
              }}
              className="rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors min-h-0 h-auto"
            >
              <X className="size-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button - Cute SVG Cat Mascot */}
      <motion.div
        drag
        dragConstraints={{ left: -300, right: 0, top: -500, bottom: 0 }}
        dragMomentum={false}
        dragElastic={0.1}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(!isOpen);
          setShowSpeechBubble(false);
        }}
        className="pointer-events-auto flex size-16 cursor-grab active:cursor-grabbing items-center justify-center rounded-full drop-shadow-xl select-none"
        animate={isWiggling ? {
          y: [0, -12, 2, -6, 0],
          rotate: [0, -10, 8, -5, 0],
        } : {}}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      >
        {/* Animated Cute SVG Cat */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          className="size-16 animate-cat-breath"
        >
          {/* Shadow */}
          <ellipse cx="24" cy="44" rx="14" ry="3" fill="rgba(0, 0, 0, 0.15)" />

          {/* Ears */}
          <path d="M12 22 L6 10 L18 16 Z" fill="#F0F4F8" stroke="#CBD5E1" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M12 22 L8 12 L16 17 Z" fill="#FDA4AF" /> {/* Pink Inner Ear Left */}

          <path d="M36 22 L42 10 L30 16 Z" fill="#F0F4F8" stroke="#CBD5E1" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M36 22 L40 12 L32 17 Z" fill="#FDA4AF" /> {/* Pink Inner Ear Right */}

          {/* Tail */}
          <path
            d="M32 36 Q38 34 36 24 C35 18 39 16 41 18"
            fill="none"
            stroke="#CBD5E1"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="animate-tail-wag"
          />

          {/* Body */}
          <rect x="11" y="24" width="26" height="18" rx="9" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1.5" />

          {/* Head */}
          <circle cx="24" cy="24" r="13" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1.5" />

          {/* Cheeks */}
          <circle cx="16" cy="27" r="2.5" fill="#FECDD3" opacity="0.8" />
          <circle cx="32" cy="27" r="2.5" fill="#FECDD3" opacity="0.8" />

          {/* Eyes */}
          <circle cx="18" cy="23" r="2" fill="#1E293B" />
          <circle cx="30" cy="23" r="2" fill="#1E293B" />
          {/* Eye reflections */}
          <circle cx="17.2" cy="22.2" r="0.75" fill="#FFFFFF" />
          <circle cx="29.2" cy="22.2" r="0.75" fill="#FFFFFF" />

          {/* Nose */}
          <polygon points="24,25 22.5,23.5 25.5,23.5" fill="#FDA4AF" />

          {/* Mouth */}
          <path d="M22.5,26 Q24,27 24,26 Q24,27 25.5,26" fill="none" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />

          {/* Whiskers */}
          <line x1="8" y1="25" x2="3" y2="24" stroke="#94A3B8" strokeWidth="1" />
          <line x1="8" y1="27" x2="2" y2="28" stroke="#94A3B8" strokeWidth="1" />

          <line x1="40" y1="25" x2="45" y2="24" stroke="#94A3B8" strokeWidth="1" />
          <line x1="40" y1="27" x2="46" y2="28" stroke="#94A3B8" strokeWidth="1" />

          {/* Paws */}
          <circle cx="16" cy="41" r="3.5" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
          <circle cx="32" cy="41" r="3.5" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
        </svg>
      </motion.div>
    </div>
  );
}
