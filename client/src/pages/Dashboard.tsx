import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardNav from "@/components/DashboardNav";
import ResourceForm from "@/components/ResourceForm";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { getLoginUrl } from "@/const";
import ResourcesPage from "./dashboard/ResourcesPage";
import CollectionsPage from "./dashboard/CollectionsPage";
import TagsPage from "./dashboard/TagsPage";
import SearchPage from "./dashboard/SearchPage";

export default function Dashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState("resources");
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation(getLoginUrl());
    }
  }, [authLoading, isAuthenticated, setLocation]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "resources":
        return <ResourcesPage onCreateNew={() => setShowForm(true)} />;
      case "collections":
        return <CollectionsPage />;
      case "tags":
        return <TagsPage />;
      case "search":
        return <SearchPage />;
      default:
        return <ResourcesPage onCreateNew={() => setShowForm(true)} />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-background">
      {/* Sidebar Navigation */}
      <DashboardNav currentPage={currentPage} onNavigate={setCurrentPage} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        {/* Top Bar */}
        <div className="border-b border-border bg-card px-4 sm:px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
              {currentPage === "resources" && "All Resources"}
              {currentPage === "collections" && "Collections"}
              {currentPage === "tags" && "Tags"}
              {currentPage === "search" && "Search"}
            </h2>
          </div>
          {currentPage === "resources" && (
            <Button onClick={() => setShowForm(true)} className="gap-2 hidden sm:flex">
              <Plus className="w-4 h-4" />
              New Resource
            </Button>
          )}
          {currentPage === "resources" && (
            <Button onClick={() => setShowForm(true)} size="sm" className="gap-2 sm:hidden">
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {renderPage()}
        </div>
      </main>

      {/* Resource Form Modal */}
      {showForm && (
        <ResourceForm
          resource={editingResource}
          onClose={() => {
            setShowForm(false);
            setEditingResource(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingResource(null);
          }}
        />
      )}
    </div>
  );
}
