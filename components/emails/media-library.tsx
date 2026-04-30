"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  Image as ImageIcon,
  Video,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import { uploadMedia, getMedia, deleteMedia } from "@/actions/media";
import { toast } from "sonner";

type Media = {
  _id: string;
  url: string;
  type: "image" | "video";
  filename: string;
  size: number;
  createdAt: string;
};

export function MediaLibrary({
  onSelect,
}: {
  onSelect: (url: string, type: "image" | "video") => void;
}) {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<Media[]>([]);
  const [videos, setVideos] = useState<Media[]>([]);
  const [uploading, setUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      loadMedia();
    }
  }, [open]);

  const loadMedia = async () => {
    try {
      const [imageData, videoData] = await Promise.all([
        getMedia("image"),
        getMedia("video"),
      ]);
      setImages(imageData);
      setVideos(videoData);
    } catch (error) {
      toast.error("Failed to load media");
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast.error("Please upload an image or video file");
      return;
    }

    // Validate file size (max 10MB for images, 500MB for videos)
    const maxSize = file.type.startsWith("video/")
      ? 500 * 1024 * 1024
      : 10 * 1024 * 1024;
    const sizeLabel = file.type.startsWith("video/") ? "500MB" : "10MB";

    if (file.size > maxSize) {
      toast.error(`File size must be less than ${sizeLabel}`);
      return;
    }

    setUploading(true);

    // Show different message for large videos
    const isLargeVideo =
      file.type.startsWith("video/") && file.size > 50 * 1024 * 1024;
    if (isLargeVideo) {
      toast.info("Uploading large video", {
        description: "This may take a few minutes. Please wait...",
        duration: 10000,
      });
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await uploadMedia(formData);
      if (result.success) {
        toast.success("Media uploaded successfully");
        loadMedia();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this media?")) return;

    const result = await deleteMedia(id);
    if (result.success) {
      toast.success("Media deleted");
      loadMedia();
    } else {
      toast.error(result.message);
    }
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success("URL copied to clipboard");
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleInsert = (url: string, type: "image" | "video") => {
    onSelect(url, type);
    setOpen(false);
    toast.success(`${type === "image" ? "Image" : "Video"} inserted`);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="cursor-pointer">
          <ImageIcon className="h-4 w-4 mr-2" />
          Media Library
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Media Library</DialogTitle>
          <DialogDescription>
            Upload and manage images and videos for your campaigns
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-y-auto flex-1">
          {/* Upload Section */}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleUpload}
              className="hidden"
            />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="cursor-pointer"
            >
              {uploading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Media
                </>
              )}
            </Button>
            <span className="text-sm text-muted-foreground self-center">
              Images: Max 10MB • Videos: Max 500MB
            </span>
          </div>

          {/* Media Tabs */}
          <Tabs defaultValue="images" className="flex-1">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="images">
                <ImageIcon className="h-4 w-4 mr-2" />
                Images ({images.length})
              </TabsTrigger>
              <TabsTrigger value="videos">
                <Video className="h-4 w-4 mr-2" />
                Videos ({videos.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="images" className="mt-4">
              {images.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No images uploaded yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((media) => (
                    <Card key={media._id} className="p-3 group relative">
                      <div className="aspect-video relative rounded-lg overflow-hidden bg-muted mb-2">
                        <img
                          src={media.url}
                          alt={media.filename}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs font-medium truncate mb-1">
                        {media.filename}
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {formatFileSize(media.size)}
                      </p>
                      <div className="flex gap-1 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleInsert(media.url, "image")}
                          className="flex-1 min-w-[60px] cursor-pointer text-xs h-7"
                        >
                          Insert
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopy(media.url)}
                          className="cursor-pointer h-7 w-7 p-0 shrink-0"
                          title="Copy URL"
                        >
                          {copiedUrl === media.url ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(media._id)}
                          className="cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7 p-0 shrink-0"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="videos" className="mt-4">
              {videos.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No videos uploaded yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {videos.map((media) => (
                    <Card key={media._id} className="p-3 group relative">
                      <div className="aspect-video relative rounded-lg overflow-hidden bg-muted mb-2">
                        <video
                          src={media.url}
                          controls
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs font-medium truncate mb-1">
                        {media.filename}
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {formatFileSize(media.size)}
                      </p>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleInsert(media.url, "video")}
                          className="flex-1 cursor-pointer text-xs h-7"
                        >
                          Insert
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopy(media.url)}
                          className="cursor-pointer h-7 w-7 p-0"
                        >
                          {copiedUrl === media.url ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(media._id)}
                          className="cursor-pointer text-destructive hover:text-destructive h-7 w-7 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
