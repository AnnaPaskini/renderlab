"use client";

import { useWorkspace } from "@/lib/context/WorkspaceContext";
import { defaultToastStyle } from "@/lib/toast-config";
import { IconDotsVertical } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";

type PromptTemplatesProps = {
  activeTab?: "builder" | "custom";
  setActiveTab?: (tab: "builder" | "custom") => void;
};

export function PromptTemplates({ activeTab, setActiveTab }: PromptTemplatesProps) {
  const { loadTemplate } = useWorkspace();
  const router = useRouter();

  const [templates, setTemplates] = useState<any[]>([]);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);

  // Three-dot menu state
  const [renameTarget, setRenameTarget] = useState<any | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Create template state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");

  // === LOAD ALL ON MOUNT ===
  useEffect(() => {
    const savedTemplates =
      JSON.parse(localStorage.getItem("RenderAI_customTemplates") || "[]") || [];

    setTemplates(savedTemplates);
  }, []);

  // === RELOAD CUSTOM TEMPLATES ON TAB SWITCH ===
  useEffect(() => {
    if (activeTab === "custom") {
      const stored = JSON.parse(
        localStorage.getItem("RenderAI_customTemplates") || "[]"
      );
      setTemplates(stored);
    }
  }, [activeTab]);

  // === HANDLE LOAD TEMPLATE ===
  const handleLoadTemplate = (template: any) => {
    if (!template) return;

    // Load template into Workspace Context
    loadTemplate(template);

    // Show success message
    toast.success("Template loaded into Builder", {
      style: defaultToastStyle,
    });

    // Close modal
    setPreviewTemplate(null);

    // Navigate to workspace
    router.push('/workspace');
  };

  // === HANDLE CANCEL ===
  const handleCancel = () => {
    setPreviewTemplate(null);
    toast("Returned to Custom Templates", {
      duration: 1200,
      style: { fontSize: "13px" },
    });
    if (setActiveTab) setActiveTab("custom");
  };

  // === HELPER: CHECK FOR DUPLICATE NAMES ===
  const isTemplateNameExists = (name: string, excludeCreatedAt?: string): boolean => {
    const stored = JSON.parse(localStorage.getItem("RenderAI_customTemplates") || "[]");
    return stored.some((t: any) =>
      t.createdAt !== excludeCreatedAt &&
      (t.name || t.title || '').toLowerCase() === name.toLowerCase()
    );
  };

  // === THREE-DOT MENU HANDLERS ===
  const handleDuplicateTemplate = (template: any) => {
    const proposedName = `${template.name || template.title || 'Template'} - Copy`;

    // Check for duplicate names (case-insensitive)
    if (isTemplateNameExists(proposedName)) {
      toast.error(`A template named '${proposedName}' already exists. Please choose a different name.`, {
        duration: 2500,
        style: defaultToastStyle,
      });
      return;
    }

    const duplicated = {
      ...template,
      name: proposedName,
      createdAt: new Date().toISOString(),
    };

    const stored = JSON.parse(localStorage.getItem("RenderAI_customTemplates") || "[]");
    const updated = [...stored, duplicated];
    localStorage.setItem("RenderAI_customTemplates", JSON.stringify(updated));
    setTemplates(updated);

    toast.success(`Template duplicated: ${duplicated.name}`, {
      duration: 1500,
      style: defaultToastStyle,
    });
  };

  const openRenameDialog = (template: any) => {
    setRenameTarget(template);
    setRenameDraft(template.name || template.title || '');
    setIsRenameOpen(true);
  };

  const handleRenameSubmit = () => {
    if (!renameTarget || !renameDraft.trim()) return;

    const newName = renameDraft.trim();

    // Check for duplicate names (excluding current template)
    if (isTemplateNameExists(newName, renameTarget.createdAt)) {
      toast.error(`A template named '${newName}' already exists. Please choose a different name.`, {
        duration: 2500,
        style: defaultToastStyle,
      });
      return;
    }

    const stored = JSON.parse(localStorage.getItem("RenderAI_customTemplates") || "[]");
    const updated = stored.map((t: any) =>
      t.createdAt === renameTarget.createdAt
        ? { ...t, name: newName }
        : t
    );

    localStorage.setItem("RenderAI_customTemplates", JSON.stringify(updated));
    setTemplates(updated);

    toast.success(`Template renamed to: ${newName}`, {
      duration: 1500,
      style: defaultToastStyle,
    });

    setIsRenameOpen(false);
    setRenameTarget(null);
    setRenameDraft('');
  };

  const openDeleteDialog = (template: any) => {
    setDeleteTarget(template);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;

    const stored = JSON.parse(localStorage.getItem("RenderAI_customTemplates") || "[]");
    const updated = stored.filter((t: any) => t.createdAt !== deleteTarget.createdAt);

    localStorage.setItem("RenderAI_customTemplates", JSON.stringify(updated));
    setTemplates(updated);

    toast.success("Template deleted", {
      duration: 1200,
      style: defaultToastStyle,
    });

    setIsDeleteOpen(false);
    setDeleteTarget(null);
  };

  // === CREATE NEW TEMPLATE ===
  const handleCreateTemplate = () => {
    if (!newTemplateName.trim()) return;

    const templateName = newTemplateName.trim();

    // Check for duplicate names
    if (isTemplateNameExists(templateName)) {
      toast.error(`A template named '${templateName}' already exists. Please choose a different name.`, {
        duration: 2500,
        style: defaultToastStyle,
      });
      return;
    }

    const newTemplate = {
      name: templateName,
      aiModel: "",
      style: "",
      details: "",
      createdAt: new Date().toISOString(),
    };

    const stored = JSON.parse(localStorage.getItem("RenderAI_customTemplates") || "[]");
    const updated = [...stored, newTemplate];
    localStorage.setItem("RenderAI_customTemplates", JSON.stringify(updated));
    setTemplates(updated);

    toast.success(`Template created: ${templateName}`, {
      duration: 1500,
      style: defaultToastStyle,
    });

    setIsCreateOpen(false);
    setNewTemplateName('');
  };

  return (
    <div className="h-full overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold leading-none text-gray-900 dark:text-gray-100">My Templates</h2>
        <Button onClick={() => setIsCreateOpen(true)} size="lg">
          + New Template
        </Button>
      </div>

      {/* Templates */}
      {templates.length === 0 ? (
        <p className="text-sm text-gray-500">No templates saved yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {templates.map((t, index) => (
            <Card
              key={t.createdAt || index}
              draggable
              onDragStart={(e) => {
                const templateData = JSON.stringify(t);
                e.dataTransfer.setData("template", templateData);
                e.dataTransfer.effectAllowed = "copy";
              }}
              className="rl-card cursor-grab select-none transition-transform duration-200 hover:-translate-y-1"
              title="Drag to add to collection"
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => setPreviewTemplate(t)}
                >
                  <div className="font-semibold text-[var(--rl-text)] truncate">
                    {t.name || t.title || "Untitled Template"}
                  </div>
                  <div className="relative group mt-1">
                    <pre className="text-sm text-[var(--rl-text-secondary)] line-clamp-3 whitespace-pre-wrap font-sans">
                      {t.prompt || t.style || t.scenario || t.details || "No details yet."}
                    </pre>

                    {/* Tooltip on hover */}
                    <div className="invisible group-hover:visible absolute z-10 bottom-full left-0 mb-2 p-3 bg-black text-white text-xs rounded-lg max-w-md shadow-xl whitespace-pre-wrap">
                      {t.prompt || t.style || t.scenario || t.details || "No details yet."}
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Template options"
                      className="inline-flex items-center justify-center rounded-full p-1.5 text-[var(--rl-text-muted)] transition hover:text-[var(--rl-text)] focus-visible:outline-none"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <IconDotsVertical size={16} stroke={1.5} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        handleDuplicateTemplate(t);
                      }}
                    >
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        openRenameDialog(t);
                      }}
                    >
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                      onSelect={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        openDeleteDialog(t);
                      }}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="modal-content max-w-xl">
          {previewTemplate && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold text-[var(--rl-text)]">
                  {previewTemplate.name || previewTemplate.title || "Template"}
                </DialogTitle>
                <p className="text-sm text-[var(--rl-text-secondary)] mt-1">
                  {previewTemplate.description ||
                    previewTemplate.style ||
                    previewTemplate.scenario ||
                    "No description provided."}
                </p>
              </DialogHeader>

              <div className="mt-5 rounded-xl border border-[var(--rl-border)] bg-[var(--rl-surface)] p-5">
                <div className="grid grid-cols-2 gap-y-2 text-sm text-[var(--rl-text-secondary)]">
                  <div>AI Model:</div>
                  <div className="text-[var(--rl-text)]">
                    {previewTemplate.formData?.aiModel ||
                      previewTemplate.aiModel ||
                      "—"}
                  </div>

                  <div>Style:</div>
                  <div className="text-[var(--rl-text)]">
                    {previewTemplate.formData?.style ||
                      previewTemplate.style ||
                      "—"}
                  </div>

                  <div>Scenario:</div>
                  <div className="text-[var(--rl-text)]">
                    {previewTemplate.scenario || "—"}
                  </div>
                </div>

                <div className="mt-4 border-t border-[var(--rl-border)] pt-3">
                  <div className="mb-1 text-sm text-[var(--rl-text-secondary)]">
                    Final Prompt:
                  </div>
                  <p className="leading-relaxed whitespace-pre-line text-[var(--rl-text)]/90">
                    {previewTemplate.finalPrompt ||
                      previewTemplate.details ||
                      "No final prompt generated yet."}
                  </p>
                </div>
              </div>

              <DialogFooter className="mt-6 flex justify-end gap-3">
                <Button
                  variant="destructive"
                  onClick={() => {
                    setPreviewTemplate(null);
                    openDeleteDialog(previewTemplate);
                  }}
                >
                  Delete
                </Button>
                <button
                  type="button"
                  className="rl-btn-secondary text-sm"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rl-btn-primary text-sm"
                  onClick={() => handleLoadTemplate(previewTemplate)}
                >
                  Load Template
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Rename Template Dialog */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent className="modal-content">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[var(--rl-text)]">
              Rename Template
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            <Input
              value={renameDraft}
              onChange={(e) => setRenameDraft(e.target.value)}
              placeholder="Enter new name..."
              className="rl-input w-full"
              autoFocus
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleRenameSubmit();
                } else if (event.key === "Escape") {
                  event.preventDefault();
                  setIsRenameOpen(false);
                }
              }}
            />
          </div>

          <DialogFooter className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              className="rl-btn-secondary text-sm"
              onClick={() => {
                setIsRenameOpen(false);
                setRenameDraft("");
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rl-btn-primary text-sm"
              onClick={handleRenameSubmit}
              disabled={!renameDraft.trim()}
            >
              Rename
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Template Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="modal-content">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[var(--rl-text)]">
              Delete Template?
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            <p className="text-sm text-[var(--rl-text-secondary)]">
              Are you sure you want to delete "<strong>{deleteTarget?.name || deleteTarget?.title || 'this template'}</strong>"? This action cannot be undone.
            </p>
          </div>

          <DialogFooter className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              className="rl-btn-secondary text-sm"
              onClick={() => setIsDeleteOpen(false)}
            >
              Cancel
            </button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create New Template Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="modal-content">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[var(--rl-text)]">
              Create New Template
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            <Input
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="Enter template name..."
              className="rl-input w-full"
              autoFocus
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleCreateTemplate();
                } else if (event.key === "Escape") {
                  event.preventDefault();
                  setIsCreateOpen(false);
                }
              }}
            />
          </div>

          <DialogFooter className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              className="rl-btn-secondary text-sm"
              onClick={() => {
                setIsCreateOpen(false);
                setNewTemplateName("");
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rl-btn-primary text-sm"
              onClick={handleCreateTemplate}
              disabled={!newTemplateName.trim()}
            >
              Create
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
