import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function TagsPage() {
  const { data: tags, isLoading } = trpc.tags.list.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">All Tags</h3>
        {!tags || tags.length === 0 ? (
          <p className="text-muted-foreground">No tags yet. Create resources with tags to see them here.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag: any) => (
              <Badge key={tag.id} variant="secondary" className="text-sm px-3 py-1">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
