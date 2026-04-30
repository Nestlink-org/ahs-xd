"use client";

import { useState } from "react";
import {
  FileText,
  Image as ImageIcon,
  File,
  MoreVertical,
  Eye,
  Trash2,
  Download,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteDocument } from "@/actions/drive";
import { toast } from "sonner";

interface DocumentGridProps {
  documents: any[];
  onRefresh: () => void;
}

export function DocumentGrid({ documents, onRefresh }: DocumentGridProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);

  const handleDelete = async () => {
    if (!selectedDocument) return;

    const result = await deleteDocument(selectedDocument._id);
    if (result.success) {
      toast.success(result.message);
      onRefresh();
    } else {
      toast.error(result.message);
    }
    setDeleteDialogOpen(false);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    } else if (fileType === "application/pdf") {
      return <FileText className="h-8 w-8 text-red-500" />;
    }
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      receipt: "bg-green-500/10 text-green-500",
      invoice: "bg-blue-500/10 text-blue-500",
      statement: "bg-purple-500/10 text-purple-500",
      contract: "bg-orange-500/10 text-orange-500",
      report: "bg-pink-500/10 text-pink-500",
      other: "bg-gray-500/10 text-gray-500",
    };
    return colors[type] || colors.other;
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {documents.map((doc) => (
          <div
            key={doc._id}
            className="group relative border border-border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
            onClick={() => {
              setSelectedDocument(doc);
              setPreviewDialogOpen(true);
            }}
          >
            {/* File Icon/Preview */}
            <div className="flex items-center justify-center h-24 mb-3 bg-muted rounded-md">
              {doc.fileType.startsWith("image/") ? (
                <img
                  src={doc.fileUrl}
                  alt={doc.name}
                  className="h-full w-full object-cover rounded-md"
                />
              ) : (
                getFileIcon(doc.fileType)
              )}
            </div>

            {/* Document Info */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium line-clamp-2">{doc.name}</h3>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className={getTypeColor(doc.type)}>
                  {doc.type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(doc.fileSize)}
                </span>
              </div>
            </div>

            {/* Actions Menu */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDocument(doc);
                      setPreviewDialogOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(doc.fileUrl, "_blank");
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDocument(doc);
                      setDeleteDialogOpen(true);
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedDocument?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Document Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Type:</span>
                <Badge
                  variant="secondary"
                  className={`ml-2 ${getTypeColor(selectedDocument?.type)}`}
                >
                  {selectedDocument?.type}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Size:</span>
                <span className="ml-2">
                  {formatFileSize(selectedDocument?.fileSize || 0)}
                </span>
              </div>
              {selectedDocument?.description && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Description:</span>
                  <p className="mt-1">{selectedDocument.description}</p>
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="border border-border rounded-lg overflow-hidden bg-muted">
              {selectedDocument?.fileType.startsWith("image/") ? (
                <img
                  src={selectedDocument.fileUrl}
                  alt={selectedDocument.name}
                  className="w-full h-auto max-h-[60vh] object-contain"
                />
              ) : selectedDocument?.fileType === "application/pdf" ? (
                <iframe
                  src={selectedDocument.fileUrl}
                  className="w-full h-[60vh]"
                  title={selectedDocument.name}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-64">
                  <File className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Preview not available
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() =>
                      window.open(selectedDocument?.fileUrl, "_blank")
                    }
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
