import type { Message } from "@shared/schema";

interface SystemMessageProps {
  message: Message;
}

export function SystemMessage({ message }: SystemMessageProps) {
  const timestamp = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className="flex items-center justify-center px-4 py-2"
      data-testid={`system-message-${message._id}`}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span data-testid={`text-system-content-${message._id}`}>
          {message.content}
        </span>
        <span className="text-[10px]">•</span>
        <span data-testid={`text-system-time-${message._id}`}>{timestamp}</span>
      </div>
    </div>
  );
}
