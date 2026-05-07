import { useState } from "react";
import { trpc } from "@/lib/trpc";
import ResourceCard from "@/components/ResourceCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 12;

export default function SearchPage() {
  const [keyword, setKeyword] = useState("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const utils = trpc.useUtils();

  const { data: tags } = trpc.tags.list.useQuery();
  const { data: searchResults, isLoading } = trpc.search.query.useQuery({
    keyword: keyword || undefined,
    tagIds: selectedTags.length > 0 ? selectedTags : undefined,
    limit: ITEMS_PER_PAGE,
    offset: currentPage * ITEMS_PER_PAGE,
  });

  const deleteResourceMutation = trpc.resources.delete.useMutation({
    onSuccess: () => {
      toast.success("Resource deleted");
      utils.search.query.invalidate();
      utils.resources.list.invalidate();
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

  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
    setCurrentPage(0);
  };

  const resources = searchResults?.resources || [];
  const total = searchResults?.total || 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const hasNextPage = currentPage < totalPages - 1;
  const hasPrevPage = currentPage > 0;

  return (
    <div className="p-8 space-y-6">
      {/* Search Filters */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Search by keyword</label>
          <Input
            placeholder="Search title or description..."
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setCurrentPage(0);
            }}
          />
        </div>

        {tags && tags.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">Filter by tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag: any) => (
                <Badge
                  key={tag.id}
                  variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {keyword || selectedTags.length > 0
              ? "No resources found matching your search"
              : "Enter a search term or select tags to begin"}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">Found {total} resource(s)</p>
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
