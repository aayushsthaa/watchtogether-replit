import { useState } from "react";
import { MessageCircle, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";

export type BottomNavTab = "chat" | "user" | "settings";

interface BottomNavProps {
  activeTab: BottomNavTab;
  onTabChange: (tab: BottomNavTab) => void;
  participantCount?: number;
}

export function BottomNav({ activeTab, onTabChange, participantCount = 0 }: BottomNavProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
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

          {/* User/Profile Tab */}
          <button
            onClick={() => handleTabClick("user")}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
              activeTab === "user" 
                ? "text-primary" 
                : "text-muted-foreground hover-elevate"
            )}
            data-testid="tab-user"
          >
            <User className="h-5 w-5" />
            <span className="text-xs font-medium">Users</span>
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
