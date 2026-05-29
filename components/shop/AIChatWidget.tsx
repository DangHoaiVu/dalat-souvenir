"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, X, Send, Sparkles, AlertCircle } from "lucide-react";
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

function getWelcomeMessage(): Message {
  return {
    id: "welcome",
    role: "assistant",
    content: "Dạ em chào anh/chị! Em là trợ lý ảo 24/7 của Đà Lạt Souvenir. Em có thể giúp anh/chị tìm hiểu về đặc sản, quà lưu niệm, khuyến mãi, phương thức thanh toán, thông tin liên hệ của shop hoặc tư vấn các sản phẩm tốt cho sức khỏe ạ. Anh/chị cần em hỗ trợ gì ạ?",
    timestamp: new Date(),
  };
}

export default function AIChatWidget() {
  const pathname = usePathname();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mb-4 flex h-[520px] w-[360px] flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl sm:w-[400px]"
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

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex size-14 items-center justify-center rounded-full bg-gradient-to-r from-sky-600 via-sky-500 to-sky-400 text-white shadow-xl hover:shadow-sky-500/20 transition-all border border-sky-400/20 relative"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="size-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative"
            >
              <MessageSquare className="size-6" />
              <span className="absolute -top-1.5 -right-1.5 flex size-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75" />
                <span className="relative inline-flex size-3 rounded-full bg-yellow-500" />
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
