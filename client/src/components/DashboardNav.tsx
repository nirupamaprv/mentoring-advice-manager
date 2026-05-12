import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { BookMarked, Folder, Tag, Search, LogOut, Menu, X } from "lucide-react";

interface DashboardNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function DashboardNav({ currentPage, onNavigate }: DashboardNavProps) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    // Use window.location.href for full-page redirect after logout
    window.location.href = "/";
  };

  const navItems = [
    { id: "resources", label: "All Resources", icon: BookMarked },
    { id: "collections", label: "Collections", icon: Folder },
    { id: "tags", label: "Tags", icon: Tag },
    { id: "search", label: "Search", icon: Search },
  ];

  const handleNavClick = (page: string) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Advice Manager</h1>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 hover:bg-secondary rounded-lg"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 top-14"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 bg-card border-r border-border h-screen flex-col fixed left-0 top-0">
        <NavContent
          navItems={navItems}
          currentPage={currentPage}
          onNavigate={handleNavClick}
          user={user}
          onLogout={handleLogout}
        />
      </aside>

      {/* Sidebar - Mobile */}
      <aside
        className={`lg:hidden fixed left-0 top-14 w-64 bg-card border-r border-border h-[calc(100vh-56px)] flex flex-col z-40 transform transition-transform ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <NavContent
          navItems={navItems}
          currentPage={currentPage}
          onNavigate={handleNavClick}
          user={user}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile Spacer */}
      <div className="lg:hidden h-14" />
    </>
  );
}

function NavContent({
  navItems,
  currentPage,
  onNavigate,
  user,
  onLogout,
}: {
  navItems: Array<{ id: string; label: string; icon: any }>;
  currentPage: string;
  onNavigate: (page: string) => void;
  user: any;
  onLogout: () => void;
}) {
  return (
    <>
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-border space-y-3">
        <div className="px-4 py-3 bg-secondary rounded-lg">
          <p className="text-xs text-muted-foreground">Logged in as</p>
          <p className="text-sm font-medium text-foreground truncate">{user?.name || user?.email}</p>
        </div>
        <Button
          onClick={onLogout}
          variant="outline"
          size="sm"
          className="w-full justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </>
  );
}
