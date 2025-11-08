"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { IconDotsVertical } from "@tabler/icons-react";
import { defaultToastStyle } from "@/lib/toast-config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";

type PromptTemplatesProps = {
  activeTab?: "builder" | "custom";
  setActiveTab?: (tab: "builder" | "custom") => void;
};

export function PromptTemplates({ activeTab, setActiveTab }: PromptTemplatesProps) {
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

    // Save template to localStorage
    localStorage.setItem("RenderAI_activeTemplate", JSON.stringify(template));

    // Trigger storage event so Builder can detect it
    window.dispatchEvent(new Event("storage"));

    // Show success message
    toast.success("Template loaded into Builder", {
      duration: 1500,
      style: defaultToastStyle,
    });

    // Close modal
    setPreviewTemplate(null);

    // Visually switch tab to Builder
    setTimeout(() => {
      if (setActiveTab) setActiveTab("builder");
    }, 400);
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
    <div className="p-4 h-full overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">My Templates</h2>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/30"
        >
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
              className="cursor-move rounded-xl border border-gray-200 dark:border-neutral-700 p-4 transition-all hover:shadow-md hover:border-gray-400 dark:hover:border-neutral-500 hover:-translate-y-0.5 active:cursor-grabbing"
              title="Drag to add to collection"
            >
              <div className="flex items-start justify-between gap-3">
                <div 
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => setPreviewTemplate(t)}
                >
                  <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {t.name || t.title || "Untitled Template"}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {t.style || t.scenario || t.details || "No details yet."}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Template options"
                      className="inline-flex items-center justify-center rounded-full p-1.5 text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-300 focus-visible:outline-none"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <IconDotsVertical size={16} stroke={1.5} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
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
        <DialogContent className="max-w-lg backdrop-blur-sm bg-white/90 dark:bg-neutral-900/90 border border-gray-300 dark:border-neutral-700 shadow-2xl rounded-2xl">
          {previewTemplate && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {previewTemplate.name || previewTemplate.title || "Template"}
                </DialogTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {previewTemplate.description ||
                    previewTemplate.style ||
                    previewTemplate.scenario ||
                    "No description provided."}
                </p>
              </DialogHeader>

              <div className="mt-5 bg-neutral-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl p-5">
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-gray-500 dark:text-gray-400">AI Model:</div>
                  <div className="text-gray-900 dark:text-gray-100">
                    {previewTemplate.formData?.aiModel ||
                      previewTemplate.aiModel ||
                      "—"}
                  </div>

                  <div className="text-gray-500 dark:text-gray-400">Style:</div>
                  <div className="text-gray-900 dark:text-gray-100">
                    {previewTemplate.formData?.style ||
                      previewTemplate.style ||
                      "—"}
                  </div>

                  <div className="text-gray-500 dark:text-gray-400">Scenario:</div>
                  <div className="text-gray-900 dark:text-gray-100">
                    {previewTemplate.scenario || "—"}
                  </div>
                </div>

                <div className="mt-4 border-t border-gray-200 dark:border-neutral-700 pt-3">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Final Prompt:
                  </div>
                  <p className="text-gray-800 dark:text-gray-200 leading-relaxed italic whitespace-pre-line">
                    {previewTemplate.finalPrompt ||
                      previewTemplate.details ||
                      "No final prompt generated yet."}
                  </p>
                </div>
              </div>

              <DialogFooter className="mt-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  className="border-red-500 text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-500/10"
                  onClick={() => {
                    setPreviewTemplate(null); // закрываем preview modal
                    openDeleteDialog(previewTemplate); // открываем delete dialog
                  }}
                >
                  Delete
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={() => handleLoadTemplate(previewTemplate)}>
                  Load Template
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Rename Template Dialog */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent className="max-w-md backdrop-blur-sm bg-white/90 dark:bg-neutral-900/90 border border-gray-300 dark:border-neutral-700 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Rename Template
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            <Input
              value={renameDraft}
              onChange={(e) => setRenameDraft(e.target.value)}
              placeholder="Enter new name..."
              className="w-full px-4 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-neutral-800 border-2 border-purple-300 dark:border-purple-600 rounded-lg focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 placeholder:text-gray-400 dark:placeholder:text-gray-500"
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
            <Button
              variant="outline"
              onClick={() => {
                setIsRenameOpen(false);
                setRenameDraft("");
              }}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 transition rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameSubmit}
              disabled={!renameDraft.trim()}
              className="px-6 py-2 text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-purple-500/30"
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Template Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md backdrop-blur-sm bg-white/90 dark:bg-neutral-900/90 border border-gray-300 dark:border-neutral-700 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Delete Template?
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to delete "<strong>{deleteTarget?.name || deleteTarget?.title || 'this template'}</strong>"? This action cannot be undone.
            </p>
          </div>

          <DialogFooter className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 transition rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              className="px-6 py-2 text-sm font-medium bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition shadow-lg shadow-red-500/30"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create New Template Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md backdrop-blur-sm bg-white/90 dark:bg-neutral-900/90 border border-gray-300 dark:border-neutral-700 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Create New Template
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            <Input
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="Enter template name..."
              className="w-full px-4 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-neutral-800 border-2 border-purple-300 dark:border-purple-600 rounded-lg focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 placeholder:text-gray-400 dark:placeholder:text-gray-500"
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
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setNewTemplateName("");
              }}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 transition rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTemplate}
              disabled={!newTemplateName.trim()}
              className="px-6 py-2 text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-purple-500/30"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
