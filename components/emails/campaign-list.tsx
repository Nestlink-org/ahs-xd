"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Send, Trash2, Eye, Mail, Calendar, Users } from "lucide-react";
import { sendCampaign, deleteCampaign } from "@/actions/emails";
import { toast } from "sonner";
import { CampaignStats } from "./campaign-stats";

type Campaign = {
  _id: string;
  subject: string;
  htmlContent: string;
  recipients: string[];
  status: "draft" | "queued" | "sending" | "sent" | "failed";
  sentCount: number;
  failedCount: number;
  createdAt: string;
  sentAt?: string;
};

export function CampaignList({ campaigns }: { campaigns: Campaign[] }) {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null,
  );
  const [sending, setSending] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [campaignToSend, setCampaignToSend] = useState<string | null>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);

  const handleSend = async (id: string) => {
    setSending(id);
    setCampaignToSend(null);
    const result = await sendCampaign(id);
    setSending(null);
    if (result.success) {
      toast.success("Campaign Sent", {
        description: result.message,
      });
      setTimeout(() => window.location.reload(), 1500);
    } else {
      toast.error("Send Failed", {
        description: result.message,
      });
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    setCampaignToDelete(null);
    const result = await deleteCampaign(id);
    setDeleting(null);
    if (result.success) {
      toast.success("Campaign Deleted", {
        description: "The campaign has been removed.",
      });
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast.error("Delete Failed", {
        description: result.message,
      });
    }
  };

  const getStatusBadge = (status: Campaign["status"]) => {
    const variants: Record<
      Campaign["status"],
      { label: string; className: string }
    > = {
      draft: {
        label: "Draft",
        className: "bg-muted text-muted-foreground border-border",
      },
      queued: {
        label: "Queued",
        className: "bg-blue-500/15 text-blue-400 border-blue-400/30",
      },
      sending: {
        label: "Sending",
        className: "bg-yellow-500/15 text-yellow-400 border-yellow-400/30",
      },
      sent: {
        label: "Sent",
        className: "bg-primary/15 text-primary border-primary/30",
      },
      failed: {
        label: "Failed",
        className: "bg-destructive/15 text-destructive border-destructive/30",
      },
    };

    return (
      <Badge variant="outline" className={variants[status].className}>
        {variants[status].label}
      </Badge>
    );
  };

  return (
    <>
      <div className="flex flex-col gap-6 w-7xl mx-auto">
        <CampaignStats campaigns={campaigns} />

        <div className=" mx-auto w-full">
          <Card className="rounded-none">
            <Table>
              <TableHeader className="bg-blue-950">
                <TableRow>
                  <TableHead className="w-[40%]">Subject</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-12"
                    >
                      <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-base font-medium">No campaigns yet</p>
                      <p className="text-sm mt-1">
                        Create your first campaign in the XDComposer tab
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  campaigns.map((campaign) => (
                    <TableRow key={campaign._id} className="group">
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                          <span className="truncate max-w-md">
                            {campaign.subject}
                          </span>
                          {campaign.sentAt && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Sent{" "}
                              {new Date(campaign.sentAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {campaign.recipients.length}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                      <TableCell>
                        {campaign.status === "sent" ||
                        campaign.status === "failed" ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium text-green-500">
                              {campaign.sentCount} sent
                            </span>
                            {campaign.failedCount > 0 && (
                              <span className="text-xs text-destructive">
                                {campaign.failedCount} failed
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(campaign.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedCampaign(campaign)}
                            className="cursor-pointer h-8 w-8 p-0"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {campaign.status === "draft" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setCampaignToSend(campaign._id)}
                              disabled={sending === campaign._id}
                              className="cursor-pointer text-primary hover:text-primary hover:bg-primary/10 h-8 w-8 p-0"
                              title="Send campaign"
                            >
                              {sending === campaign._id ? (
                                <span className="h-4 w-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setCampaignToDelete(campaign._id)}
                            disabled={deleting === campaign._id}
                            className="cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                            title="Delete campaign"
                          >
                            {deleting === campaign._id ? (
                              <span className="h-4 w-4 rounded-full border-2 border-destructive/30 border-t-destructive animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>

      {/* Campaign Preview Dialog */}
      <Dialog
        open={!!selectedCampaign}
        onOpenChange={() => setSelectedCampaign(null)}
      >
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg pr-8">
              {selectedCampaign?.subject}
            </DialogTitle>
            <DialogDescription>Campaign overview and preview</DialogDescription>
          </DialogHeader>
          {selectedCampaign && (
            <div className="flex flex-col gap-4 overflow-y-auto flex-1 pr-2">
              {/* Key Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50 border border-border">
                  <span className="text-xs text-muted-foreground font-medium">
                    Status
                  </span>
                  {getStatusBadge(selectedCampaign.status)}
                </div>
                <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50 border border-border">
                  <span className="text-xs text-muted-foreground font-medium">
                    Recipients
                  </span>
                  <span className="text-xl font-bold">
                    {selectedCampaign.recipients.length}
                  </span>
                </div>
                <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50 border border-border">
                  <span className="text-xs text-muted-foreground font-medium">
                    Created
                  </span>
                  <span className="text-sm font-medium">
                    {new Date(selectedCampaign.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Delivery Stats (if sent) */}
              {(selectedCampaign.status === "sent" ||
                selectedCampaign.status === "failed") && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <span className="text-xs text-muted-foreground font-medium">
                      Successfully Sent
                    </span>
                    <span className="text-2xl font-bold text-green-500">
                      {selectedCampaign.sentCount}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <span className="text-xs text-muted-foreground font-medium">
                      Failed
                    </span>
                    <span className="text-2xl font-bold text-destructive">
                      {selectedCampaign.failedCount}
                    </span>
                  </div>
                </div>
              )}

              {/* Content Preview */}
              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Content Preview
                </h3>
                <div className="border border-border rounded-lg p-6 bg-background max-h-[250px] overflow-y-auto">
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert *:mb-3 *:last:mb-0"
                    dangerouslySetInnerHTML={{
                      __html: selectedCampaign.htmlContent,
                    }}
                  />
                </div>
              </div>

              {/* Recipients List */}
              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Recipients ({selectedCampaign.recipients.length})
                </h3>
                <div className="max-h-[150px] overflow-y-auto border border-border rounded-lg p-4 bg-muted/30">
                  <div className="flex flex-wrap gap-2">
                    {selectedCampaign.recipients.map((email, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="text-xs font-mono"
                      >
                        {email}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedCampaign(null)}
              className="cursor-pointer"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Confirmation Dialog */}
      <AlertDialog
        open={!!campaignToSend}
        onOpenChange={() => setCampaignToSend(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send the email to all{" "}
              {
                campaigns.find((c) => c._id === campaignToSend)?.recipients
                  .length
              }{" "}
              recipients. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => campaignToSend && handleSend(campaignToSend)}
              className="cursor-pointer"
            >
              Send Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!campaignToDelete}
        onOpenChange={() => setCampaignToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this campaign. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => campaignToDelete && handleDelete(campaignToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
