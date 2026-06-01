"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/types";

export default function ChatWindow({
  threadId,
  myCompanyId,
  myUserId,
  initialMessages,
}: {
  threadId: string;
  myCompanyId: string;
  myUserId: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`thread:${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function send() {
    const body = input.trim();
    if (!body) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      thread_id: threadId,
      sender_company_id: myCompanyId,
      sender_user_id: myUserId,
      body,
    });
    setSending(false);
    if (error) {
      alert(error.message);
      return;
    }
    setInput("");
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-800 border border-slate-700 rounded-lg overflow-hidden min-h-0">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0"
      >
        {messages.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-8">
            メッセージはまだありません
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_company_id === myCompanyId;
          return (
            <div
              key={m.id}
              className={clsx("flex", mine ? "justify-end" : "justify-start")}
            >
              <div
                className={clsx(
                  "max-w-[75%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap break-words",
                  mine
                    ? "bg-brand-500 text-white"
                    : "bg-slate-700 text-white"
                )}
              >
                {m.body}
                <div
                  className={clsx(
                    "text-[10px] mt-1",
                    mine ? "text-brand-100" : "text-slate-400"
                  )}
                >
                  {formatTime(m.created_at)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-slate-700 p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="メッセージを入力..."
          className="flex-1 rounded-md border border-slate-600 bg-slate-800 text-white placeholder:text-slate-500 px-3 py-2"
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          送信
        </button>
      </div>
    </div>
  );
}

function formatTime(ts: string) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
