"use client";

import { useEffect, useRef, useState } from "react";

import { DocumentFormData } from "@/types/document";
import { DocumentTypeDef } from "@/lib/document-registry";
import { ChatMessage, mergeFields, sendMessage } from "@/lib/chat";

interface ChatPanelProps {
  data: DocumentFormData;
  docDef: DocumentTypeDef;
  onChange: (data: DocumentFormData) => void;
}

function buildGreeting(docDef: DocumentTypeDef): string {
  return `Hi! I'll help you draft your ${docDef.displayName}. Tell me about the agreement you need — who are the parties involved${docDef.extraFields.length > 0 ? ", what are the key terms" : ""}, and any other details you'd like to include.`;
}

export function ChatPanel({ data, docDef, onChange }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Always holds the latest data so the merge after an async response is never stale
  const latestDataRef = useRef<DocumentFormData>(data);
  useEffect(() => { latestDataRef.current = data; }, [data]);

  // Re-initialize chat when document type changes
  useEffect(() => {
    setMessages([]);
    setInput("");
    setError(null);
  }, [docDef.slug]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Return focus to input after AI responds
  useEffect(() => {
    if (!loading) {
      inputRef.current?.focus();
    }
  }, [loading]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await sendMessage(docDef.slug, nextMessages, latestDataRef.current);
      const aiMessage: ChatMessage = { role: "assistant", content: response.reply };
      setMessages([...nextMessages, aiMessage]);
      onChange(mergeFields(latestDataRef.current, response.fields));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-2 min-h-0">
        {/* Greeting — not sent to the API */}
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-lg px-4 py-2 text-sm bg-gray-100 text-gray-800">
            {buildGreeting(docDef)}
          </div>
        </div>

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2 text-sm ${
                msg.role === "user" ? "bg-[#209dd7] text-white" : "bg-gray-100 text-gray-800"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm text-gray-400 italic">
              Thinking…
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-500 text-center">{error}</p>}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 pt-3 shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Describe your ${docDef.displayName}… (Enter to send, Shift+Enter for new line)`}
            disabled={loading}
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#209dd7] placeholder:text-gray-500 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-[#753991] text-white rounded text-sm font-medium hover:bg-[#5f2d75] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
