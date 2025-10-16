import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Smile, Send } from "lucide-react";

interface ChatInputProps {
  onSendMessage?: (content: string) => void;
  isMobile?: boolean;
}

export function ChatInput({ onSendMessage, isMobile = false }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage?.(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={isMobile ? "border-t p-2" : "border-t p-4"}>
      <div className="flex gap-2 items-end">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className={`resize-none ${isMobile ? "min-h-[36px] max-h-20 text-sm" : "min-h-[44px] max-h-32"}`}
          rows={1}
          data-testid="input-chat-message"
        />
        <div className={`flex ${isMobile ? "flex-row gap-1" : "flex-col gap-2"}`}>
          <Button
            type="button"
            variant="ghost"
            size={isMobile ? "sm" : "icon"}
            data-testid="button-emoji-picker"
          >
            <Smile className={isMobile ? "h-4 w-4" : "h-5 w-5"} />
          </Button>
          <Button
            type="submit"
            size={isMobile ? "sm" : "icon"}
            disabled={!message.trim()}
            data-testid="button-send-message"
          >
            <Send className={isMobile ? "h-4 w-4" : "h-5 w-5"} />
          </Button>
        </div>
      </div>
    </form>
  );
}
