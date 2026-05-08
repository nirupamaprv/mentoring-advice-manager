import { Resource, Tag } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Edit2, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";

interface ResourceCardProps {
  resource: Resource & { tags: Tag[] };
  onEdit: (resource: Resource & { tags: Tag[] }) => void;
  onDelete: (id: number) => void;
}

export default function ResourceCard({ resource, onEdit, onDelete }: ResourceCardProps) {
  const isLink = resource.contentType === "link";

  const handleCopyLink = () => {
    if (isLink) {
      navigator.clipboard.writeText(resource.content);
      toast.success("Link copied to clipboard");
    }
  };

  const handleOpenLink = () => {
    if (isLink) {
      window.open(resource.content, "_blank");
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-2">{resource.title}</CardTitle>
            {resource.description && (
              <CardDescription className="mt-2 line-clamp-2">{resource.description}</CardDescription>
            )}
          </div>
          <Badge variant={isLink ? "default" : "secondary"} className="whitespace-nowrap">
            {isLink ? "Link" : "Text"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {resource.tags.map((tag: any) => (
              <Badge key={tag.id} variant="outline" className="text-xs">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Content Preview */}
        {isLink ? (
          <div className="flex-1 flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">URL:</p>
            <p className="text-sm font-mono text-primary truncate hover:underline cursor-pointer" onClick={handleOpenLink}>
              {resource.content}
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-2">
            <p className="text-sm text-foreground line-clamp-3 bg-secondary/50 p-2 rounded">
              {resource.content}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {isLink && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenLink}
                className="flex-1 gap-2"
              >
                <ExternalLink className="w-3 h-3" />
                Open
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyLink}
                className="flex-1 gap-2"
              >
                <Copy className="w-3 h-3" />
                Copy
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(resource)}
            className={isLink ? "flex-1" : "flex-1 gap-2"}
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(resource.id)}
            className="flex-1 gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
