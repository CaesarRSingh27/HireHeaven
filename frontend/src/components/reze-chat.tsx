"use client";

import axios from "axios";
import Image from "next/image";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { Bot, LoaderCircle, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { utils_service } from "@/context/AppContext";

type ChatMessage = { role: "user" | "assistant"; content: string };

const starterMessage: ChatMessage = {
  role: "assistant",
  content: "Hi, I’m Reze! I can help you find your way around HireHeaven, explore jobs, understand recruiter tools, or get started with your profile. What would you like to know?",
};

const suggestions = ["How do I find a job?", "I’m a recruiter", "What can I do on HireHeaven?"];

export default function RezeChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([starterMessage]);
  const [isSending, setIsSending] = useState(false);
  const scrollArea = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      scrollArea.current?.scrollTo({ top: scrollArea.current.scrollHeight, behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [open, messages, isSending]);

  const sendMessage = async (rawMessage: string) => {
    const content = rawMessage.trim();
    if (!content || isSending) return;

    const conversation = [...messages, { role: "user" as const, content }];
    setMessages(conversation);
    setInput("");
    setIsSending(true);

    try {
      const { data } = await axios.post(`${utils_service}/api/utils/chat`, {
        messages: conversation.slice(-12).map(({ role, content: message }) => ({ role, content: message })),
      });
      setMessages((current) => [...current, { role: "assistant", content: data.reply }]);
    } catch (error: any) {
      const message = error.response?.data?.message || "I couldn’t reach my help service just now. Please try again in a moment.";
      setMessages((current) => [...current, { role: "assistant", content: message }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  };

  return (
    <div className="reze-assistant">
      {open && (
        <section className="reze-chat-panel" aria-label="Chat with Reze" aria-live="polite">
          <header className="reze-chat-header">
            <div className="reze-chat-identity">
              <span className="reze-avatar"><Image src="/reze-assistant.webp" alt="Reze" fill sizes="48px" /></span>
              <span><strong>Reze</strong><small><i /> HireHeaven AI Assistant</small></span>
            </div>
            <button type="button" className="reze-close" onClick={() => setOpen(false)} aria-label="Close Reze chat"><X size={19} /></button>
          </header>

          <div className="reze-chat-intro"><Sparkles size={14} /> Here to help with your next step</div>

          <div className="reze-chat-messages" ref={scrollArea} role="log" aria-label="Conversation">
            {messages.map((message, index) => (
              <div className={`reze-message-row ${message.role === "user" ? "is-user" : "is-assistant"}`} key={`${index}-${message.role}`}>
                {message.role === "assistant" && <span className="reze-message-avatar"><Image src="/reze-assistant.webp" alt="" fill sizes="30px" /></span>}
                <p className="reze-message">{message.content}</p>
              </div>
            ))}
            {isSending && <div className="reze-typing"><LoaderCircle size={15} className="reze-spin" /> Reze is thinking…</div>}
            {messages.length === 1 && (
              <div className="reze-suggestions" aria-label="Suggested questions">
                {suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => void sendMessage(suggestion)}>{suggestion}</button>)}
              </div>
            )}
          </div>

          <form className="reze-chat-composer" onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Reze anything…"
              aria-label="Message Reze"
              maxLength={1200}
              disabled={isSending}
            />
            <button type="submit" disabled={isSending || !input.trim()} aria-label="Send message"><Send size={17} /></button>
          </form>
          <div className="reze-chat-disclaimer"><Bot size={12} /> Reze can make mistakes. Don’t share passwords or private account details.</div>
        </section>
      )}

      <button
        type="button"
        className={`reze-launcher${open ? " is-open" : ""}`}
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close Reze assistant" : "Chat with Reze, your AI assistant"}
        aria-expanded={open}
      >
        {open ? <X size={23} /> : <><span className="reze-launcher-avatar"><Image src="/reze-assistant.webp" alt="" fill sizes="58px" /></span><span className="reze-launcher-spark"><MessageCircle size={15} /></span></>}
      </button>
    </div>
  );
}
