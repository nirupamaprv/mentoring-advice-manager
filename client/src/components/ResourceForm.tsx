import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ResourceFormProps {
  resource?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ResourceForm({ resource, onClose, onSuccess }: ResourceFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contentType, setContentType] = useState<"link" | "text">("link");
  const [content, setContent] = useState("");
  const [collectionId, setCollectionId] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [tagQuery, setTagQuery] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const utils = trpc.useUtils();

  const { data: collections } = trpc.collections.list.useQuery();
  const { data: allTags } = trpc.tags.list.useQuery();
  const { data: suggestedTags } = trpc.tags.suggest.useQuery({
    query: tagQuery || undefined,
  });

  const createMutation = trpc.resources.create.useMutation({
    onSuccess: () => {
      toast.success("Resource created");
      utils.resources.list.invalidate();
      utils.search.query.invalidate();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create resource");
    },
  });

  const updateMutation = trpc.resources.update.useMutation({
    onSuccess: () => {
      toast.success("Resource updated");
      utils.resources.list.invalidate();
      utils.search.query.invalidate();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update resource");
    },
  });

  useEffect(() => {
    if (resource) {
      setTitle(resource.title);
      setDescription(resource.description || "");
      setContentType(resource.contentType);
      setContent(resource.content);
      setCollectionId(resource.collectionId);
      setSelectedTags(resource.tags?.map((t: any) => t.id) || []);
    }
  }, [resource]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!content.trim()) {
      toast.error("Content is required");
      return;
    }

    if (selectedTags.length === 0) {
      toast.error("Please add at least one tag");
      return;
    }

    if (contentType === "link") {
      try {
        new URL(content);
      } catch {
        toast.error("Please enter a valid URL");
        return;
      }
    }

    const payload = {
      title,
      description: description || null,
      contentType,
      content,
      collectionId: collectionId || null,
      tagIds: selectedTags,
    };

    if (resource) {
      updateMutation.mutate({ id: resource.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleAddTag = (tagId: number) => {
    if (!selectedTags.includes(tagId)) {
      setSelectedTags([...selectedTags, tagId]);
    }
    setTagQuery("");
    setShowTagSuggestions(false);
  };

  const handleRemoveTag = (tagId: number) => {
    setSelectedTags(selectedTags.filter((id) => id !== tagId));
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{resource ? "Edit Resource" : "New Resource"}</DialogTitle>
          <DialogDescription>
            {resource
              ? "Update your saved resource"
              : "Save a new link or text snippet with tags and description"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Resource title"
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* Content Type and Content */}
          <div>
            <label className="block text-sm font-medium mb-2">Content Type *</label>
            <Tabs value={contentType} onValueChange={(v) => setContentType(v as "link" | "text")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="link">Link</TabsTrigger>
                <TabsTrigger value="text">Text</TabsTrigger>
              </TabsList>
              <TabsContent value="link" className="mt-4">
                <Input
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="https://example.com"
                  disabled={isLoading}
                />
              </TabsContent>
              <TabsContent value="text" className="mt-4">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste your text here"
                  rows={5}
                  disabled={isLoading}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Collection */}
          <div>
            <label className="block text-sm font-medium mb-2">Collection</label>
            <Select
              value={collectionId?.toString() || "none"}
              onValueChange={(v) => setCollectionId(v === "none" ? null : parseInt(v))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a collection (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {collections?.map((c: any) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2">Tags * (at least one required)</label>
            <div className="space-y-2">
              {/* Selected Tags */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tagId) => {
                    const tag = allTags?.find((t: any) => t.id === tagId);
                    return (
                      <Badge key={tagId} variant="secondary" className="gap-1">
                        {tag?.name}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tagId)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}

              {/* Tag Input */}
              <div className="relative">
                <Input
                  value={tagQuery}
                  onChange={(e) => {
                    setTagQuery(e.target.value);
                    setShowTagSuggestions(true);
                  }}
                  onFocus={() => setShowTagSuggestions(true)}
                  placeholder="Type to search or create tags"
                  disabled={isLoading}
                />

                {/* Suggestions */}
                {showTagSuggestions && tagQuery && suggestedTags && suggestedTags.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md z-10">
                    {suggestedTags.map((tag: any) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleAddTag(tag.id)}
                        className="w-full text-left px-3 py-2 hover:bg-secondary text-sm disabled:opacity-50"
                        disabled={selectedTags.includes(tag.id)}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {resource ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
