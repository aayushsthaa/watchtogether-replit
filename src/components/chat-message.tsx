import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Message } from "@/lib/schema";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const timestamp = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className="group flex gap-3 px-4 py-2 hover-elevate"
      data-testid={`message-${message._id}`}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="text-xs">
          {message.username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-baseline gap-2">
          <span
            className="font-medium text-sm"
            data-testid={`text-message-username-${message._id}`}
          >
            {message.username}
          </span>
          <span
            className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            data-testid={`text-message-time-${message._id}`}
          >
            {timestamp}
          </span>
        </div>
        {message.type === "gif" && message.gifUrl ? (
          <img
            src={message.gifUrl}
            alt="GIF"
            className="max-w-xs rounded-md"
            data-testid={`img-message-gif-${message._id}`}
          />
        ) : (
          <p
            className="text-sm break-words"
            data-testid={`text-message-content-${message._id}`}
          >
            {message.content}
          </p>
        )}
      </div>
    </div>
  );
}
