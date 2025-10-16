import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Video,
  Users,
  Shield,
  Crown,
  Circle,
  LogOut,
} from "lucide-react";
import type { Room } from "@/lib/schema";
import { useAuth } from "@/contexts/AuthContext";
import { useRooms } from "@/hooks/useRooms";

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { data: rooms, isLoading: roomsLoading } = useRooms();

  const isActive = (path: string) => location === path;

  // Filter active rooms with participants
  const activeRooms = ((rooms || []) as Room[]).filter(
    (room) => room.isActive && room.participants.length > 0
  );

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  // Don't render sidebar if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Sidebar data-testid="app-sidebar">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Video className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">WatchTogether</h2>
            <p className="text-xs text-muted-foreground">Watch with friends</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/rooms")}
                  data-testid="nav-rooms"
                >
                  <Link href="/rooms">
                    <Users className="h-4 w-4" />
                    <span>All Rooms</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {user?.isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/admin")}
                    data-testid="nav-admin"
                  >
                    <Link href="/admin">
                      <Shield className="h-4 w-4" />
                      <span>Admin Panel</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-2" />

        <SidebarGroup>
          <SidebarGroupLabel>Active Rooms</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {roomsLoading ? (
                <div className="px-3 py-2 space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : activeRooms.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No active rooms
                </div>
              ) : (
                activeRooms.map((room: Room) => (
                  <SidebarMenuItem key={room._id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(`/room/${room._id}`)}
                      data-testid={`nav-room-${room._id}`}
                    >
                      <Link href={`/room/${room._id}`}>
                        <Circle
                          className={`h-2 w-2 ${
                            room.isActive
                              ? "fill-status-online text-status-online"
                              : "fill-muted text-muted"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-sm">{room.name}</div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {user && room.ownerId === user._id && (
                              <Crown className="h-3 w-3" />
                            )}
                            <span className="truncate">
                              {room.participants.length}{" "}
                              {room.participants.length === 1
                                ? "person"
                                : "people"}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="w-full" data-testid="nav-user-profile">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {user?.username.slice(0, 2).toUpperCase() || "??"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-medium truncate">
                  {user?.username || "Unknown"}
                </div>
                {user?.isAdmin && (
                  <Badge variant="secondary" className="h-4 px-1 text-xs">
                    Admin
                  </Badge>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} data-testid="nav-logout">
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
