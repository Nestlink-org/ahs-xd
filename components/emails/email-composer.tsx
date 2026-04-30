"use client";

import { useActionState, useEffect, useState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Upload,
  Mail,
  FileText,
  X,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Strikethrough,
} from "lucide-react";
import { saveDraftCampaign } from "@/actions/emails";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { toast } from "sonner";
import { MediaLibrary } from "./media-library";

function SubmitBtn({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      className="cursor-pointer"
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
          Saving...
        </span>
      ) : (
        <>
          <Mail className="h-4 w-4 mr-2" />
          Save & Queue
        </>
      )}
    </Button>
  );
}

export function EmailComposer() {
  const [subject, setSubject] = useState("");
  const [recipients, setRecipients] = useState("");
  const [manualEmails, setManualEmails] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [state, action] = useActionState(saveDraftCampaign, undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image,
      TextStyle,
      Color,
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4",
      },
    },
  });

  const recipientCount = recipients
    .split(/[,;\n]/)
    .filter(
      (e) => e.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()),
    ).length;

  useEffect(() => {
    if (state?.success) {
      toast.success("Campaign Saved", {
        description: state.message,
      });
      setSubject("");
      editor?.commands.setContent("");
      setRecipients("");
      setManualEmails("");
      setUploadedFile(null);
    } else if (state?.message && !state.success) {
      toast.error("Save Failed", {
        description: state.message,
      });
    }
  }, [state, editor]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      let emails: string[] = [];

      if (file.name.endsWith(".csv") || file.name.endsWith(".txt")) {
        // Parse CSV/TXT
        const Papa = (await import("papaparse")).default;
        const result = Papa.parse(text, { header: true });
        const data = result.data as any[];

        // Try to find email column
        const emailCol = Object.keys(data[0] || {}).find(
          (k) =>
            k.toLowerCase().includes("email") ||
            k.toLowerCase().includes("mail"),
        );

        if (emailCol) {
          emails = data.map((row) => row[emailCol]).filter(Boolean);
        } else {
          // Fallback: extract all emails from text
          emails = text.match(/[^\s@]+@[^\s@]+\.[^\s@]+/g) || [];
        }
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        // Parse Excel
        const XLSX = (await import("xlsx")).default;
        const workbook = XLSX.read(text, { type: "binary" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(firstSheet);

        const emailCol = Object.keys(data[0] || {}).find(
          (k) =>
            k.toLowerCase().includes("email") ||
            k.toLowerCase().includes("mail"),
        );

        if (emailCol) {
          emails = data.map((row: any) => row[emailCol]).filter(Boolean);
        }
      }

      const validEmails = emails.filter((e) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e),
      );
      setRecipients((prev) =>
        prev ? `${prev}\n${validEmails.join("\n")}` : validEmails.join("\n"),
      );
    };

    if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file);
    }
  };

  const addManualEmails = () => {
    if (!manualEmails.trim()) return;
    setRecipients((prev) => (prev ? `${prev}\n${manualEmails}` : manualEmails));
    setManualEmails("");
  };

  const addLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  };

  const handleMediaSelect = (url: string, type: "image" | "video") => {
    if (type === "image") {
      // Insert image with email-friendly max width (600px standard for emails)
      editor
        ?.chain()
        .focus()
        .setImage({
          src: url,
          alt: "Email image",
        })
        .run();
    } else {
      // Insert video as properly formatted HTML for emails
      const videoHtml = `
        <div style="max-width: 600px; margin: 20px 0;">
          <video controls style="width: 100%; max-width: 600px; height: auto; display: block; border-radius: 8px;">
            <source src="${url}" type="video/mp4">
            <source src="${url}" type="video/webm">
            Your email client doesn't support videos. <a href="${url}" style="color: #a3e635;">Click here to watch</a>
          </video>
        </div>
      `;
      editor?.commands.insertContent(videoHtml);
    }
  };

  const handleSubmit = (formData: FormData) => {
    const htmlContent = editor?.getHTML() || "";
    formData.set("htmlContent", htmlContent);
    action(formData);
  };

  if (!editor) {
    return (
      <div className="flex items-center justify-center p-8">
        <span className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <form
      action={handleSubmit}
      className="flex flex-col gap-6 max-w-5xl mx-auto"
    >
      <input type="hidden" name="recipients" value={recipients} />

      <Card className="p-6 rounded-none">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="subject">Subject Line</Label>
            <Input
              id="subject"
              name="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
              required
              className="text-base"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Email Content</Label>
            <div className="border border-border rounded-sm overflow-hidden bg-background">
              {/* Toolbar */}
              <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-muted/30">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 1 }).run()
                  }
                  className={
                    editor.isActive("heading", { level: 1 }) ? "bg-accent" : ""
                  }
                >
                  <Heading1 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 2 }).run()
                  }
                  className={
                    editor.isActive("heading", { level: 2 }) ? "bg-accent" : ""
                  }
                >
                  <Heading2 className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-1" />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={editor.isActive("bold") ? "bg-accent" : ""}
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={editor.isActive("italic") ? "bg-accent" : ""}
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  className={editor.isActive("strike") ? "bg-accent" : ""}
                >
                  <Strikethrough className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-1" />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    editor.chain().focus().toggleBulletList().run()
                  }
                  className={editor.isActive("bulletList") ? "bg-accent" : ""}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    editor.chain().focus().toggleOrderedList().run()
                  }
                  className={editor.isActive("orderedList") ? "bg-accent" : ""}
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-1" />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    editor.chain().focus().setTextAlign("left").run()
                  }
                  className={
                    editor.isActive({ textAlign: "left" }) ? "bg-accent" : ""
                  }
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    editor.chain().focus().setTextAlign("center").run()
                  }
                  className={
                    editor.isActive({ textAlign: "center" }) ? "bg-accent" : ""
                  }
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    editor.chain().focus().setTextAlign("right").run()
                  }
                  className={
                    editor.isActive({ textAlign: "right" }) ? "bg-accent" : ""
                  }
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-1" />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={addLink}
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>
                <MediaLibrary onSelect={handleMediaSelect} />
              </div>
              {/* Editor */}
              <EditorContent editor={editor} className="bg-background" />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 rounded-none">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Label>Recipients</Label>
            <span className="text-sm text-muted-foreground">
              {recipientCount} valid email{recipientCount !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">
                Upload File (CSV, TXT, XLS, XLSX)
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.xls,.xlsx"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadedFile ? uploadedFile.name : "Choose File"}
              </Button>
              {uploadedFile && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  <span>{uploadedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="ml-auto text-destructive hover:text-destructive/80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">
                Add Manually (comma or line separated)
              </Label>
              <div className="flex gap-2 w-full">
                <Textarea
                  value={manualEmails}
                  onChange={(e) => setManualEmails(e.target.value)}
                  placeholder="email1@example.com, email2@example.com"
                  className="min-h-[80px] resize-none flex-1 overflow-auto"
                  style={{ fieldSizing: "fixed" } as any}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addManualEmails}
                  className="cursor-pointer"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">
              All Recipients (one per line)
            </Label>
            <Textarea
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder="Recipients will appear here..."
              className="min-h-[120px] font-mono text-xs resize-none w-full overflow-auto"
              style={{ fieldSizing: "fixed" } as any}
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <SubmitBtn
          disabled={!subject || !editor?.getText() || recipientCount === 0}
        />
      </div>
    </form>
  );
}
