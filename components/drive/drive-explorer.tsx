"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FolderPlus,
  Upload,
  Search,
  Home,
  ChevronRight,
  Grid3x3,
  List,
} from "lucide-react";
import { CreateFolderDialog } from "./create-folder-dialog";
import { UploadDocumentDialog } from "./upload-document-dialog";
import { FolderGrid } from "./folder-grid";
import { DocumentGrid } from "./document-grid";
import { DocumentList } from "./document-list";
import { getFolders, getDocuments } from "@/actions/drive";
import { toast } from "sonner";

export function DriveExplorer() {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<
    Array<{ id: string | null; name: string }>
  >([{ id: null, name: "Home" }]);
  const [folders, setFolders] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showUploadDocument, setShowUploadDocument] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [currentFolderId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [foldersData, documentsData] = await Promise.all([
        getFolders(currentFolderId),
        getDocuments(currentFolderId),
      ]);
      setFolders(foldersData);
      setDocuments(documentsData);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = (folderId: string, folderName: string) => {
    setCurrentFolderId(folderId);
    setBreadcrumbs([...breadcrumbs, { id: folderId, name: folderName }]);
  };

  const handleBreadcrumbClick = (index: number) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);
    setCurrentFolderId(newBreadcrumbs[newBreadcrumbs.length - 1].id);
  };

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">XDDrive</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            >
              {viewMode === "grid" ? (
                <List className="h-4 w-4" />
              ) : (
                <Grid3x3 className="h-4 w-4" />
              )}
            </Button>
            <Button onClick={() => setShowCreateFolder(true)}>
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
            <Button onClick={() => setShowUploadDocument(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>

        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm mb-4">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <button
                onClick={() => handleBreadcrumbClick(index)}
                className={`flex items-center gap-1 hover:text-primary ${
                  index === breadcrumbs.length - 1
                    ? "font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                {index === 0 && <Home className="h-4 w-4" />}
                {crumb.name}
              </button>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Folders */}
            {folders.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                  Folders
                </h2>
                <FolderGrid
                  folders={folders}
                  onFolderClick={handleFolderClick}
                  onRefresh={loadData}
                />
              </div>
            )}

            {/* Documents */}
            {filteredDocuments.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                  Documents ({filteredDocuments.length})
                </h2>
                {viewMode === "grid" ? (
                  <DocumentGrid
                    documents={filteredDocuments}
                    onRefresh={loadData}
                  />
                ) : (
                  <DocumentList
                    documents={filteredDocuments}
                    onRefresh={loadData}
                  />
                )}
              </div>
            )}

            {/* Empty State */}
            {folders.length === 0 && filteredDocuments.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  No files or folders
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get started by creating a folder or uploading a document
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateFolder(true)}
                  >
                    <FolderPlus className="h-4 w-4 mr-2" />
                    New Folder
                  </Button>
                  <Button onClick={() => setShowUploadDocument(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateFolderDialog
        open={showCreateFolder}
        onOpenChange={setShowCreateFolder}
        currentFolderId={currentFolderId}
        onSuccess={loadData}
      />
      <UploadDocumentDialog
        open={showUploadDocument}
        onOpenChange={setShowUploadDocument}
        currentFolderId={currentFolderId}
        onSuccess={loadData}
      />
    </div>
  );
}
