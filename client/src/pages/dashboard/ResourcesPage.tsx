import { useState } from "react";
import { trpc } from "@/lib/trpc";
import ResourceCard from "@/components/ResourceCard";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface ResourcesPageProps {
  onCreateNew: () => void;
}

const ITEMS_PER_PAGE = 12;

export default function ResourcesPage({ onCreateNew }: ResourcesPageProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const offset = currentPage * ITEMS_PER_PAGE;
  const utils = trpc.useUtils();

  const { data, isLoading, error } = trpc.resources.list.useQuery({
    limit: ITEMS_PER_PAGE,
    offset,
  });

  const deleteResourceMutation = trpc.resources.delete.useMutation({
    onSuccess: () => {
      toast.success("Resource deleted");
      utils.resources.list.invalidate();
      utils.search.query.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete resource");
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this resource?")) {
      deleteResourceMutation.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-destructive">Error loading resources: {error.message}</p>
      </div>
    );
  }

  const resources = data?.resources || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const hasNextPage = currentPage < totalPages - 1;
  const hasPrevPage = currentPage > 0;

  return (
    <div className="p-8 space-y-6">
      {resources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground text-lg mb-4">No resources yet</p>
          <Button onClick={onCreateNew} size="lg">
            Create Your First Resource
          </Button>
        </div>
      ) : (
        <>
          {/* Resources Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource: any) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onEdit={() => {
                  // TODO: Implement edit functionality
                }}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-8">
              <Button
                variant="outline"
                disabled={!hasPrevPage}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={!hasNextPage}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
