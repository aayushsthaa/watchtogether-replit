import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Users, MonitorPlay, MessageSquare, Shield, Zap } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/rooms");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="h-full overflow-auto">
      <div className="container max-w-6xl mx-auto px-4 py-12 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Video className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              WatchTogether
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Watch videos and share screens with friends in real-time. Connect, collaborate, and enjoy content together.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              onClick={() => setLocation("/login")}
              data-testid="button-login"
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setLocation("/login")}
              data-testid="button-signup"
            >
              Sign Up
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight">
              Everything you need to watch together
            </h2>
            <p className="text-muted-foreground">
              Powerful features to enhance your shared viewing experience
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card data-testid="feature-watchparty">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                    <Video className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Watch Party</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Watch YouTube videos together in perfect sync. Everyone sees the same thing at the same time.
                </CardDescription>
              </CardContent>
            </Card>

            <Card data-testid="feature-screenshare">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                    <MonitorPlay className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Screen Share</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Share your screen with others for presentations, gaming, or collaborative work.
                </CardDescription>
              </CardContent>
            </Card>

            <Card data-testid="feature-chat">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Real-Time Chat</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Chat with participants in real-time. Share reactions and thoughts as you watch.
                </CardDescription>
              </CardContent>
            </Card>

            <Card data-testid="feature-rooms">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Private Rooms</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Create private rooms for your friends. Control who joins and manage permissions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card data-testid="feature-secure">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Secure & Private</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Your sessions are secure and private. We respect your privacy and don't track your activity.
                </CardDescription>
              </CardContent>
            </Card>

            <Card data-testid="feature-instant">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Instant Setup</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  No downloads or installations. Start watching together in seconds with just a link.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center space-y-4 py-12">
          <h2 className="text-3xl font-semibold tracking-tight">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Join WatchTogether today and start enjoying content with friends in real-time.
          </p>
          <div className="pt-4">
            <Button
              size="lg"
              onClick={() => setLocation("/login")}
              data-testid="button-cta-login"
            >
              Get Started Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
