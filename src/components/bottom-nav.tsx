import { useState } from "react";
import { MessageCircle, Users, Settings, ListVideo } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLocation } from "wouter";
import type { RoomMode } from "@/lib/schema";
import { MonitorPlay, Video, LogOut } from "lucide-react";

export type BottomNavTab = "chat" | "participants" | "settings" | "playlist";

interface BottomNavProps {
  activeTab: BottomNavTab;
  onTabChange: (tab: BottomNavTab) => void;
  participantCount?: number;
  roomName?: string;
  roomMode?: RoomMode;
  isOwner?: boolean;
  onModeChange?: (mode: RoomMode) => void;
  onLeaveRoom?: () => void;
}

export function BottomNav({ 
  activeTab, 
  onTabChange, 
  participantCount = 0,
  roomName,
  roomMode,
  isOwner = false,
  onModeChange,
  onLeaveRoom,
}: BottomNavProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<RoomMode>(roomMode || "watchparty");
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleTabClick = (tab: BottomNavTab) => {
    if (tab === "settings") {
      setSettingsOpen(true);
    } else {
      onTabChange(tab);
    }
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const handleModeChange = (newMode: RoomMode) => {
    setSelectedMode(newMode);
    onModeChange?.(newMode);
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t" data-testid="bottom-nav">
        <div className="flex items-center justify-around h-16">
          {/* Chat Tab */}
          <button
            onClick={() => handleTabClick("chat")}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
              activeTab === "chat" 
                ? "text-primary" 
                : "text-muted-foreground hover-elevate"
            )}
            data-testid="tab-chat"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-xs font-medium">Chat</span>
          </button>

          {/* Playlist Tab - Only for Watch Party mode */}
          {roomMode === "watchparty" && (
            <button
              onClick={() => handleTabClick("playlist")}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                activeTab === "playlist" 
                  ? "text-primary" 
                  : "text-muted-foreground hover-elevate"
              )}
              data-testid="tab-playlist"
            >
              <ListVideo className="h-5 w-5" />
              <span className="text-xs font-medium">Playlist</span>
            </button>
          )}

          {/* Participants Tab */}
          <button
            onClick={() => handleTabClick("participants")}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
              activeTab === "participants" 
                ? "text-primary" 
                : "text-muted-foreground hover-elevate"
            )}
            data-testid="tab-participants"
          >
            <Users className="h-5 w-5" />
            <span className="text-xs font-medium">Participants</span>
          </button>

          {/* Settings Tab */}
          <button
            onClick={() => handleTabClick("settings")}
            className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-muted-foreground hover-elevate transition-colors"
            data-testid="tab-settings"
          >
            <Settings className="h-5 w-5" />
            <span className="text-xs font-medium">Settings</span>
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh]" data-testid="settings-modal">
          <SheetHeader>
            <SheetTitle>Settings</SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            {/* Room Info Section (only show if roomName is provided) */}
            {roomName && (
              <>
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground">Room Information</h3>
                  <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                    <div>
                      <p className="font-medium">{roomName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {roomMode === "screenshare" ? "Screen Share" : "Watch Party"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {participantCount} {participantCount === 1 ? 'participant' : 'participants'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Room Mode Settings (Owner Only) */}
                  {isOwner && onModeChange && (
                    <div className="space-y-3 p-3 rounded-md border">
                      <h4 className="font-medium text-sm">Room Mode</h4>
                      <RadioGroup
                        value={selectedMode}
                        onValueChange={(value) => handleModeChange(value as RoomMode)}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="watchparty"
                            id="mobile-mode-watchparty"
                          />
                          <Label htmlFor="mobile-mode-watchparty" className="flex items-center gap-2 cursor-pointer">
                            <Video className="h-4 w-4" />
                            Watch Party
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="screenshare"
                            id="mobile-mode-screenshare"
                          />
                          <Label htmlFor="mobile-mode-screenshare" className="flex items-center gap-2 cursor-pointer">
                            <MonitorPlay className="h-4 w-4" />
                            Screen Share
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {/* Leave Room Button */}
                  {onLeaveRoom && (
                    <Button
                      variant="destructive"
                      className="w-full gap-2"
                      onClick={() => {
                        setSettingsOpen(false);
                        onLeaveRoom();
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Leave Room
                    </Button>
                  )}
                </div>

                <Separator />
              </>
            )}

            {/* User Profile Section */}
            {user && (
              <div className="flex items-center gap-3 p-4 rounded-md bg-muted/50">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-lg">
                    {user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{user.username}</p>
                  <p className="text-sm text-muted-foreground">
                    {user.isAdmin ? "Administrator" : "Member"}
                  </p>
                </div>
              </div>
            )}

            <Separator />

            {/* Theme Toggle */}
            <div className="flex items-center justify-between p-4 rounded-md hover-elevate">
              <div className="flex-1">
                <p className="font-medium">Theme</p>
                <p className="text-sm text-muted-foreground">Toggle dark/light mode</p>
              </div>
              <ThemeToggle />
            </div>

            <Separator />

            {/* Logout Button */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation("/profile")}
                data-testid="button-profile"
              >
                View Profile
              </Button>
              
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                Logout
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
