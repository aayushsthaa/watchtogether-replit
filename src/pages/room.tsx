import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useRoom, useJoinRoom, useLeaveRoom, useUpdateRoom, useTransferOwnership } from "@/hooks/useRooms";
import { useMessages, useSendMessage } from "@/hooks/useMessages";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useIsMobile } from "@/hooks/use-mobile";
import { RoomVideo } from "@/components/room-video";
import { RoomControls } from "@/components/room-controls";
import { OwnershipTransfer } from "@/components/ownership-transfer";
import { ChatPanel } from "@/components/chat-panel";
import { PlaylistManager } from "@/components/playlist-manager";
import { BottomNav, type BottomNavTab } from "@/components/bottom-nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Crown, Users } from "lucide-react";
import type { Room as RoomType, Message, VideoSync } from "@/lib/schema";

export default function Room() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const { data: room, isLoading: roomLoading } = useRoom(params.id);
  const { data: messages = [], isLoading: messagesLoading } = useMessages(params.id);
  const roomData = room as RoomType | undefined;
  const messagesList = (messages || []) as Message[];
  const joinRoomMutation = useJoinRoom(params.id!);
  const leaveRoomMutation = useLeaveRoom(params.id!);
  const updateRoomMutation = useUpdateRoom(params.id!);
  const transferOwnershipMutation = useTransferOwnership(params.id!);
  const sendMessageMutation = useSendMessage(params.id!);
  
  const [videoSyncEvent, setVideoSyncEvent] = useState<VideoSync | null>(null);
  const [activeTab, setActiveTab] = useState<BottomNavTab>("chat");
  
  const { sendMessage } = useWebSocket(params.id, {
    onVideoSync: (data: VideoSync) => {
      setVideoSyncEvent(data);
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
      return;
    }

    if (roomData && user) {
      const isParticipant = roomData.participants.some((p: any) => p.userId === user._id);
      if (!isParticipant) {
        joinRoomMutation.mutate();
      }
    }
  }, [isAuthenticated, authLoading, roomData, user, setLocation]);

  if (authLoading || !isAuthenticated) {
    return null;
  }

  const isOwner = !!(roomData && user && roomData.ownerId.toString() === user._id);

  const handleModeChange = async (newMode: RoomType["mode"]) => {
    try {
      await updateRoomMutation.mutateAsync({ mode: newMode });
      toast({
        title: "Mode updated",
        description: `Room mode changed to ${newMode === "screenshare" ? "Screen Share" : "Watch Party"}`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to update mode",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await leaveRoomMutation.mutateAsync();
      setLocation("/rooms");
    } catch (error: any) {
      toast({
        title: "Failed to leave room",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const handleOwnershipTransfer = async (newOwnerId: string) => {
    try {
      await transferOwnershipMutation.mutateAsync(newOwnerId);
      toast({
        title: "Ownership transferred",
        description: "Room ownership has been transferred successfully",
      });
    } catch (error: any) {
      toast({
        title: "Failed to transfer ownership",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessageMutation.mutateAsync({ content, type: "text" });
    } catch (error: any) {
      toast({
        title: "Failed to send message",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const handleVideoSync = (syncData: VideoSync) => {
    sendMessage({
      type: 'video_sync',
      data: syncData,
    });
  };

  if (roomLoading || messagesLoading) {
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

  if (!roomData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Room not found</h2>
          <p className="text-muted-foreground mt-2">The room you're looking for doesn't exist</p>
        </div>
      </div>
    );
  }

  // Desktop Layout: Side-by-side (video left, chat right)
  if (!isMobile) {
    return (
      <div className="h-full flex flex-col" data-testid="room-page">
        {/* Header with room info and controls */}
        <div className="flex-shrink-0 border-b bg-background p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <h2 className="font-semibold truncate text-lg">{roomData.name}</h2>
              <Badge variant="secondary">
                {roomData.mode === "screenshare" ? "Screen Share" : "Watch Party"}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Participants Sheet */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Users className="h-4 w-4" />
                    Participants ({roomData.participants.length})
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-96">
                  <SheetHeader>
                    <SheetTitle className="flex items-center justify-between">
                      <span>Participants ({roomData.participants.length})</span>
                      {isOwner && (
                        <OwnershipTransfer
                          participants={roomData.participants}
                          currentOwnerId={roomData.ownerId.toString()}
                          onTransfer={handleOwnershipTransfer}
                        />
                      )}
                    </SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="h-full mt-4">
                    <div className="space-y-2">
                      {roomData.participants.map((participant: any) => (
                        <div
                          key={participant.userId}
                          className="flex items-center gap-3 rounded-md border p-3"
                          data-testid={`participant-${participant.userId}`}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {participant.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium flex-1">
                            {participant.username}
                          </span>
                          {participant.userId === roomData.ownerId.toString() && (
                            <Badge
                              variant="secondary"
                              className="h-6 px-2"
                              data-testid={`owner-badge-${participant.userId}`}
                            >
                              <Crown className="h-3 w-3 text-primary mr-1" />
                              Owner
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>

              {/* Room Controls - For Owner */}
              {isOwner && (
                <RoomControls
                  roomId={roomData._id}
                  roomName={roomData.name}
                  mode={roomData.mode}
                  isOwner={isOwner}
                  onModeChange={handleModeChange}
                  onLeave={handleLeaveRoom}
                />
              )}
              
              {/* Leave Button - For Non-Owners */}
              {!isOwner && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleLeaveRoom}
                >
                  Leave Room
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main content: Video (left) and Chat (right) */}
        <div className="flex-1 flex min-h-0">
          {/* Video Section */}
          <div className="flex-1 bg-black flex items-center justify-center">
            <div className="w-full h-full">
              <RoomVideo 
                mode={roomData.mode} 
                videoUrl={roomData.videoUrl}
                playlist={roomData.playlist}
                currentIndex={roomData.currentIndex}
                isOwner={isOwner}
                onVideoSync={handleVideoSync}
                videoSyncEvent={videoSyncEvent}
              />
            </div>
          </div>

          {/* Right Sidebar - Chat and Playlist */}
          <div className="w-96 flex-shrink-0 flex flex-col">
            {roomData.mode === "watchparty" ? (
              <>
                <div className="flex-1 min-h-0">
                  <PlaylistManager room={roomData} isOwner={isOwner} />
                </div>
                <div className="h-64 border-t">
                  <ChatPanel messages={messagesList} onSendMessage={handleSendMessage} />
                </div>
              </>
            ) : (
              <ChatPanel messages={messagesList} onSendMessage={handleSendMessage} />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Mobile Layout: Stacked (video top, content middle, bottom nav)
  return (
    <div className="h-full flex flex-col pb-16" data-testid="room-page">
      {/* Header with room info and controls */}
      <div className="flex-shrink-0 border-b bg-background p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <h2 className="font-semibold truncate text-sm">{roomData.name}</h2>
            <Badge variant="secondary" className="flex-shrink-0 text-xs">
              {roomData.mode === "screenshare" ? "Screen" : "Watch"}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Room Settings - For Owner */}
            {isOwner && (
              <RoomControls
                roomId={roomData._id}
                roomName={roomData.name}
                mode={roomData.mode}
                isOwner={isOwner}
                onModeChange={handleModeChange}
                onLeave={handleLeaveRoom}
              />
            )}
            
            {/* Leave Button - For Non-Owners */}
            {!isOwner && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleLeaveRoom}
                data-testid="button-leave-room"
              >
                Leave
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Video Section - Top */}
      <div className="flex-shrink-0 bg-black">
        <div className="aspect-video">
          <RoomVideo 
            mode={roomData.mode} 
            videoUrl={roomData.videoUrl}
            playlist={roomData.playlist}
            currentIndex={roomData.currentIndex}
            isOwner={isOwner}
            onVideoSync={handleVideoSync}
            videoSyncEvent={videoSyncEvent}
          />
        </div>
      </div>

      {/* Content Section - Middle (flexible height based on active tab) */}
      <div className="flex-1 min-h-0 border-t">
        {activeTab === "chat" && (
          <ChatPanel messages={messagesList} onSendMessage={handleSendMessage} />
        )}

        {activeTab === "playlist" && (
          <PlaylistManager room={roomData} isOwner={isOwner} />
        )}
        
        {activeTab === "participants" && (
          <div className="h-full flex flex-col">
            <div className="flex-shrink-0 p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Participants ({roomData.participants.length})</h3>
                {isOwner && (
                  <OwnershipTransfer
                    participants={roomData.participants}
                    currentOwnerId={roomData.ownerId.toString()}
                    onTransfer={handleOwnershipTransfer}
                  />
                )}
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {roomData.participants.map((participant: any) => (
                  <div
                    key={participant.userId}
                    className="flex items-center gap-3 rounded-md border p-3"
                    data-testid={`participant-${participant.userId}`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-sm">
                        {participant.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium flex-1">
                      {participant.username}
                    </span>
                    {participant.userId === roomData.ownerId.toString() && (
                      <Badge
                        variant="secondary"
                        className="h-6 px-2"
                        data-testid={`owner-badge-${participant.userId}`}
                      >
                        <Crown className="h-3 w-3 text-primary mr-1" />
                        Owner
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        participantCount={roomData.participants.length}
        roomName={roomData.name}
        roomMode={roomData.mode}
        isOwner={isOwner}
        onModeChange={handleModeChange}
        onLeaveRoom={handleLeaveRoom}
      />
    </div>
  );
}
