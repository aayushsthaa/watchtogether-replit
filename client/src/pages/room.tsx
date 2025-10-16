import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { RoomVideo } from "@/components/room-video";
import { RoomControls } from "@/components/room-controls";
import { OwnershipTransfer } from "@/components/ownership-transfer";
import { ChatPanel } from "@/components/chat-panel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, Users } from "lucide-react";
import type { Room as RoomType, Message } from "@shared/schema";

// Mock current user
const CURRENT_USER_ID = "1";

// Mock data
const mockRoom: RoomType = {
  _id: "1",
  name: "Movie Night",
  ownerId: "1",
  ownerUsername: "admin",
  mode: "watchparty",
  videoUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
  participants: [
    { userId: "1", username: "admin", joinedAt: new Date().toISOString() },
    { userId: "2", username: "john_doe", joinedAt: new Date().toISOString() },
    {
      userId: "3",
      username: "jane_smith",
      joinedAt: new Date().toISOString(),
    },
  ],
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockMessages: Message[] = [
  {
    _id: "1",
    roomId: "1",
    userId: "1",
    username: "admin",
    content: "john_doe joined the room",
    type: "system",
    createdAt: new Date(Date.now() - 600000).toISOString(),
  },
  {
    _id: "2",
    roomId: "1",
    userId: "1",
    username: "admin",
    content: "Welcome everyone!",
    type: "text",
    createdAt: new Date(Date.now() - 300000).toISOString(),
  },
  {
    _id: "3",
    roomId: "1",
    userId: "2",
    username: "john_doe",
    content: "Thanks for the invite!",
    type: "text",
    createdAt: new Date(Date.now() - 120000).toISOString(),
  },
  {
    _id: "4",
    roomId: "1",
    userId: "1",
    username: "admin",
    content: "jane_smith joined the room",
    type: "system",
    createdAt: new Date(Date.now() - 60000).toISOString(),
  },
];

export default function Room() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [room, setRoom] = useState<RoomType>(mockRoom);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [isLoading] = useState(false);

  const isOwner = room.ownerId === CURRENT_USER_ID;

  const handleModeChange = (newMode: typeof room.mode) => {
    setRoom({ ...room, mode: newMode });
  };

  const handleLeaveRoom = () => {
    setLocation("/rooms");
  };

  const handleOwnershipTransfer = (newOwnerId: string) => {
    const newOwner = room.participants.find((p) => p.userId === newOwnerId);
    if (newOwner) {
      setRoom({
        ...room,
        ownerId: newOwnerId,
        ownerUsername: newOwner.username,
      });
    }
  };

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      _id: String(Date.now()),
      roomId: room._id,
      userId: CURRENT_USER_ID,
      username: "admin",
      content,
      type: "text",
      createdAt: new Date().toISOString(),
    };
    setMessages([...messages, newMessage]);
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex-1 flex">
          <div className="flex-1 p-6">
            <Skeleton className="w-full aspect-video" />
          </div>
          <div className="w-80 border-l">
            <Skeleton className="h-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" data-testid="room-page">
      <RoomControls
        roomId={room._id}
        roomName={room.name}
        mode={room.mode}
        isOwner={isOwner}
        onModeChange={handleModeChange}
        onLeave={handleLeaveRoom}
      />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Video/Screen */}
          <div className="flex-1 p-6 overflow-auto">
            <RoomVideo mode={room.mode} videoUrl={room.videoUrl} />
          </div>

          {/* Participants */}
          <div className="border-t p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Participants ({room.participants.length})
                </h3>
                {isOwner && (
                  <OwnershipTransfer
                    participants={room.participants}
                    currentOwnerId={room.ownerId}
                    onTransfer={handleOwnershipTransfer}
                  />
                )}
              </div>
              <ScrollArea className="max-h-24">
                <div className="flex flex-wrap gap-2">
                  {room.participants.map((participant) => (
                    <div
                      key={participant.userId}
                      className="flex items-center gap-2 rounded-md border px-3 py-2"
                      data-testid={`participant-${participant.userId}`}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {participant.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {participant.username}
                      </span>
                      {participant.userId === room.ownerId && (
                        <Badge
                          variant="secondary"
                          className="h-5 px-1"
                          data-testid={`owner-badge-${participant.userId}`}
                        >
                          <Crown className="h-3 w-3 text-primary" />
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="h-96 lg:h-full lg:w-80 xl:w-96">
          <ChatPanel messages={messages} onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
}
