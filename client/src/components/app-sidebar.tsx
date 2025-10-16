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
import {
  Video,
  Users,
  Shield,
  Crown,
  Circle,
  LogOut,
} from "lucide-react";
import type { Room } from "@shared/schema";

// Mock current user
const CURRENT_USER = {
  _id: "1",
  username: "admin",
  isAdmin: true,
};

// Mock active rooms
const mockRooms: Room[] = [
  {
    _id: "1",
    name: "Movie Night",
    ownerId: "1",
    ownerUsername: "admin",
    mode: "watchparty",
    participants: [
      { userId: "1", username: "admin", joinedAt: new Date().toISOString() },
      { userId: "2", username: "john_doe", joinedAt: new Date().toISOString() },
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "2",
    name: "Code Review",
    ownerId: "2",
    ownerUsername: "john_doe",
    mode: "screenshare",
    participants: [
      { userId: "2", username: "john_doe", joinedAt: new Date().toISOString() },
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

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
              {CURRENT_USER.isAdmin && (
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
              {mockRooms.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No active rooms
                </div>
              ) : (
                mockRooms.map((room) => (
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
                            {room.ownerId === CURRENT_USER._id && (
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
                  {CURRENT_USER.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-medium truncate">
                  {CURRENT_USER.username}
                </div>
                {CURRENT_USER.isAdmin && (
                  <Badge variant="secondary" className="h-4 px-1 text-xs">
                    Admin
                  </Badge>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild data-testid="nav-logout">
              <Link href="/login">
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
