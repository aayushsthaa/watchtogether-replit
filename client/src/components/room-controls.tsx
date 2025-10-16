import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import {
  MonitorPlay,
  Video,
  Link as LinkIcon,
  Copy,
  LogOut,
  Settings,
} from "lucide-react";
import type { RoomMode } from "@shared/schema";

interface RoomControlsProps {
  roomId: string;
  roomName: string;
  mode: RoomMode;
  isOwner: boolean;
  onModeChange?: (mode: RoomMode) => void;
  onLeave?: () => void;
}

export function RoomControls({
  roomId,
  roomName,
  mode,
  isOwner,
  onModeChange,
  onLeave,
}: RoomControlsProps) {
  const { toast } = useToast();
  const [selectedMode, setSelectedMode] = useState<RoomMode>(mode);

  const inviteLink = `${window.location.origin}/room/${roomId}`;

  const copyInviteLink = async () => {
    await navigator.clipboard.writeText(inviteLink);
    toast({
      title: "Link copied!",
      description: "Invite link copied to clipboard",
    });
  };

  const handleModeChange = (newMode: RoomMode) => {
    setSelectedMode(newMode);
    onModeChange?.(newMode);
    toast({
      title: "Mode changed",
      description: `Switched to ${newMode === "screenshare" ? "screen share" : "watch party"} mode`,
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 border-b">
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-semibold truncate" data-testid="text-room-name">
          {roomName}
        </h2>
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" data-testid="badge-current-mode">
          {mode === "screenshare" ? (
            <MonitorPlay className="mr-1 h-3 w-3" />
          ) : (
            <Video className="mr-1 h-3 w-3" />
          )}
          {mode === "screenshare" ? "Screen Share" : "Watch Party"}
        </Badge>

        {isOwner && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                data-testid="button-room-settings"
              >
                <Settings className="mr-1 h-4 w-4" />
                Settings
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" data-testid="popover-room-settings">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Room Mode</h4>
                  <RadioGroup
                    value={selectedMode}
                    onValueChange={(value) => handleModeChange(value as RoomMode)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="watchparty"
                        id="mode-watchparty"
                        data-testid="radio-mode-watchparty"
                      />
                      <Label htmlFor="mode-watchparty" className="flex items-center gap-2 cursor-pointer">
                        <Video className="h-4 w-4" />
                        Watch Party
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="screenshare"
                        id="mode-screenshare"
                        data-testid="radio-mode-screenshare"
                      />
                      <Label htmlFor="mode-screenshare" className="flex items-center gap-2 cursor-pointer">
                        <MonitorPlay className="h-4 w-4" />
                        Screen Share
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={copyInviteLink}
          data-testid="button-copy-invite"
        >
          <Copy className="mr-1 h-4 w-4" />
          Invite
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onLeave}
          data-testid="button-leave-room"
        >
          <LogOut className="mr-1 h-4 w-4" />
          Leave
        </Button>
      </div>
    </div>
  );
}
