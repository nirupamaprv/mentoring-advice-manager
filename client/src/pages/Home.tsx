import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { BookMarked, Folder, Tag, Search } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookMarked className="w-6 h-6 text-primary" />
            <span className="text-xl font-semibold text-foreground">Advice Manager</span>
          </div>
          <Button asChild>
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Organize Your Mentoring Resources
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
                Save, organize, and search through links and text snippets. Build collections, add tags, and find exactly what you need when you need it.
              </p>
            </div>

            <Button size="lg" asChild className="w-full sm:w-auto">
              <a href={getLoginUrl()}>Get Started</a>
            </Button>
          </div>

          {/* Right Column - Features Grid */}
          <div className="grid grid-cols-2 gap-4">
            <FeatureCard
              icon={BookMarked}
              title="Save Resources"
              description="Store links and text snippets with titles and descriptions"
            />
            <FeatureCard
              icon={Folder}
              title="Collections"
              description="Organize resources into named collections"
            />
            <FeatureCard
              icon={Tag}
              title="Smart Tags"
              description="Tag resources for easy filtering and discovery"
            />
            <FeatureCard
              icon={Search}
              title="Quick Search"
              description="Find resources by keyword or tag instantly"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-muted-foreground">
          <p>© 2026 Mentoring Advice Manager. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
      <Icon className="w-6 h-6 text-primary mb-3" />
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
