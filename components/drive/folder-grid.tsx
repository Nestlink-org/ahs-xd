"use client";

import { useState } from "react";
import { Folder, MoreVertical, Pencil, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { deleteFolder, renameFolder } from "@/actions/drive";
import { toast } from "sonner";

interface FolderGridProps {
  folders: any[];
  onFolderClick: (id: string, name: string) => void;
  onRefresh: () => void;
}

export function FolderGrid({
  folders,
  onFolderClick,
  onRefresh,
}: FolderGridProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<any>(null);
  const [newName, setNewName] = useState("");

  const handleDelete = async () => {
    if (!selectedFolder) return;

    const result = await deleteFolder(selectedFolder._id);
    if (result.success) {
      toast.success(result.message);
      onRefresh();
    } else {
      toast.error(result.message);
    }
    setDeleteDialogOpen(false);
  };

  const handleRename = async () => {
    if (!selectedFolder || !newName.trim()) return;

    const result = await renameFolder(selectedFolder._id, newName.trim());
    if (result.success) {
      toast.success(result.message);
      onRefresh();
    } else {
      toast.error(result.message);
    }
    setRenameDialogOpen(false);
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {folders.map((folder) => (
          <div key={folder._id} className="group relative">
            <div
              onClick={() => onFolderClick(folder._id, folder.name)}
              className="flex flex-col items-center p-4 rounded-lg hover:bg-accent cursor-pointer transition-colors"
            >
              {/* Realistic Folder Icon */}
              <div className="relative mb-2">
                <svg
                  width="80"
                  height="64"
                  viewBox="0 0 80 64"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="drop-shadow-md"
                >
                  {/* Folder back */}
                  <path
                    d="M4 12C4 8.68629 6.68629 6 10 6H30L38 14H70C73.3137 14 76 16.6863 76 20V54C76 57.3137 73.3137 60 70 60H10C6.68629 60 4 57.3137 4 54V12Z"
                    fill={folder.color || "#3b82f6"}
                    opacity="0.9"
                  />
                  {/* Folder front */}
                  <path
                    d="M4 20C4 16.6863 6.68629 14 10 14H30L38 22H70C73.3137 22 76 24.6863 76 28V54C76 57.3137 73.3137 60 70 60H10C6.68629 60 4 57.3137 4 54V20Z"
                    fill={folder.color || "#3b82f6"}
                  />
                  {/* Highlight */}
                  <path
                    d="M4 20C4 16.6863 6.68629 14 10 14H30L38 22H70C73.3137 22 76 24.6863 76 28V32H4V20Z"
                    fill="white"
                    opacity="0.2"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-center line-clamp-2 w-full">
                {folder.name}
              </span>
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
                      setSelectedFolder(folder);
                      setNewName(folder.name);
                      setRenameDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFolder(folder);
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
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedFolder?.name}"? This
              will also delete all documents and subfolders inside it. This
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

      {/* Rename Dialog */}
      <AlertDialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename Folder</AlertDialogTitle>
            <AlertDialogDescription>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Folder name"
                className="mt-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                }}
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRename}>Rename</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
