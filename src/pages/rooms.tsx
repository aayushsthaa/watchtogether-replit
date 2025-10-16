import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import {
  insertRoomSchema,
  type InsertRoom,
} from "@/lib/schema";
import { useAuth } from "@/contexts/AuthContext";
import { useRooms, useCreateRoom } from "@/hooks/useRooms";
import type { Room } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, Crown, MonitorPlay, Video } from "lucide-react";

export default function Rooms() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: rooms, isLoading } = useRooms();
  const roomsList = (rooms || []) as Room[];
  const createRoomMutation = useCreateRoom();

  const form = useForm<InsertRoom>({
    resolver: zodResolver(insertRoomSchema),
    defaultValues: {
      name: "",
      mode: "watchparty",
      videoUrl: "",
    },
  });

  const selectedMode = form.watch("mode");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, authLoading, setLocation]);

  if (authLoading || !isAuthenticated) {
    return null;
  }

  const onCreateRoom = async (data: InsertRoom) => {
    try {
      const newRoom = await createRoomMutation.mutateAsync(data) as Room;
      setCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Room created!",
        description: `"${data.name}" has been created successfully.`,
      });
      setLocation(`/room/${newRoom._id}`);
    } catch (error: any) {
      toast({
        title: "Failed to create room",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const joinRoom = (roomId: string) => {
    setLocation(`/room/${roomId}`);
  };

  if (isLoading) {
    return (
      <div className="h-full overflow-auto">
        <div className="container max-w-7xl mx-auto p-6 space-y-6">
          <div className="space-y-1">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-72" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="container max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">
              Watch Rooms
            </h1>
            <p className="text-muted-foreground">
              Join a room or create your own
            </p>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            data-testid="button-create-room"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Room
          </Button>
        </div>

        {roomsList.length === 0 ? (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <Video className="h-12 w-12 text-muted-foreground" />
              <div className="space-y-1">
                <h3 className="font-semibold">No active rooms</h3>
                <p className="text-sm text-muted-foreground">
                  Create a room to start watching together
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roomsList.map((room: Room) => (
              <Card
                key={room._id}
                className="overflow-hidden hover-elevate"
                data-testid={`card-room-${room._id}`}
              >
                <CardHeader className="gap-3 space-y-0">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle
                      className="text-lg truncate"
                      data-testid={`text-room-name-${room._id}`}
                    >
                      {room.name}
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className="shrink-0"
                      data-testid={`badge-mode-${room._id}`}
                    >
                      {room.mode === "screenshare" ? (
                        <MonitorPlay className="mr-1 h-3 w-3" />
                      ) : (
                        <Video className="mr-1 h-3 w-3" />
                      )}
                      {room.mode === "screenshare" ? "Screen" : "Watch"}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-xs">
                        {room.ownerUsername.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex items-center gap-1 text-sm">
                      <Crown className="h-3 w-3 text-primary" />
                      {room.ownerUsername}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span data-testid={`text-participants-${room._id}`}>
                      {room.participants.length}{" "}
                      {room.participants.length === 1
                        ? "participant"
                        : "participants"}
                    </span>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => joinRoom(room._id)}
                    data-testid={`button-join-${room._id}`}
                  >
                    Join Room
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent data-testid="dialog-create-room">
            <DialogHeader>
              <DialogTitle>Create Watch Room</DialogTitle>
              <DialogDescription>
                Set up a new room to watch together
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onCreateRoom)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter room name"
                          data-testid="input-room-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mode"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Room Mode</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="grid grid-cols-2 gap-3"
                        >
                          <div>
                            <RadioGroupItem
                              value="watchparty"
                              id="watchparty"
                              className="peer sr-only"
                              data-testid="radio-watchparty"
                            />
                            <Label
                              htmlFor="watchparty"
                              className="flex flex-col gap-2 rounded-md border p-4 cursor-pointer hover-elevate peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                            >
                              <Video className="h-5 w-5" />
                              <div className="space-y-1">
                                <div className="font-medium">Watch Party</div>
                                <div className="text-xs text-muted-foreground">
                                  YouTube videos
                                </div>
                              </div>
                            </Label>
                          </div>
                          <div>
                            <RadioGroupItem
                              value="screenshare"
                              id="screenshare"
                              className="peer sr-only"
                              data-testid="radio-screenshare"
                            />
                            <Label
                              htmlFor="screenshare"
                              className="flex flex-col gap-2 rounded-md border p-4 cursor-pointer hover-elevate peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                            >
                              <MonitorPlay className="h-5 w-5" />
                              <div className="space-y-1">
                                <div className="font-medium">Screen Share</div>
                                <div className="text-xs text-muted-foreground">
                                  Share your screen
                                </div>
                              </div>
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {selectedMode === "watchparty" && (
                  <FormField
                    control={form.control}
                    name="videoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Video URL (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://youtube.com/watch?v=..."
                            data-testid="input-video-url"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                    data-testid="button-cancel-create-room"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    data-testid="button-submit-create-room"
                    disabled={createRoomMutation.isPending}
                  >
                    {createRoomMutation.isPending ? "Creating..." : "Create Room"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
