import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./chat-message";
import { SystemMessage } from "./system-message";
import { ChatInput } from "./chat-input";
import type { Message } from "@/lib/schema";

interface ChatPanelProps {
  messages: Message[];
  onSendMessage?: (content: string) => void;
}

export function ChatPanel({ messages, onSendMessage }: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full border-l" data-testid="chat-panel">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Chat</h3>
        <p className="text-sm text-muted-foreground">
          {messages.filter((m) => m.type !== "system").length} messages
        </p>
      </div>
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="py-2 space-y-1">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              No messages yet
            </div>
          ) : (
            messages.map((message) =>
              message.type === "system" ? (
                <SystemMessage key={message._id} message={message} />
              ) : (
                <ChatMessage key={message._id} message={message} />
              )
            )
          )}
        </div>
      </ScrollArea>
      <ChatInput onSendMessage={onSendMessage} />
    </div>
  );
}
