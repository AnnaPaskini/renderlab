"use client";

import { useWorkspace } from "@/lib/context/WorkspaceContext";
import { createClient } from "@/lib/supabaseBrowser";
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
  const [newTemplatePrompt, setNewTemplatePrompt] = useState("");

  // === LOAD TEMPLATES FROM SUPABASE ===
  const loadTemplatesFromSupabase = async () => {
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.log('⚠️ No user logged in, skipping template load');
        setTemplates([]);
        return;
      }

      console.log('📥 Loading templates from Supabase for user:', user.id);

      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to load templates:', error);
        throw error;
      }

      console.log('✅ Loaded templates from Supabase:', data?.length || 0);
      setTemplates(data || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates. Please try again.', {
        duration: 2500,
        style: defaultToastStyle,
      });
      setTemplates([]);
    }
  };

  // === LOAD ALL ON MOUNT ===
  useEffect(() => {
    loadTemplatesFromSupabase();
  }, []);

  // === RELOAD CUSTOM TEMPLATES ON TAB SWITCH ===
  useEffect(() => {
    if (activeTab === "custom") {
      loadTemplatesFromSupabase();
    }
  }, [activeTab]);

  // === HANDLE LOAD TEMPLATE ===
  const handleLoadTemplate = (template: any) => {
    if (!template) return;

    // Load template into Workspace Context
    loadTemplate(template);

    // Also store in localStorage for immediate pickup by PromptBuilder
    localStorage.setItem("RenderAI_activeTemplate", JSON.stringify(template));

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

  // === THREE-DOT MENU HANDLERS ===
  const handleDuplicateTemplate = async (template: any) => {
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        toast.error('Please sign in to duplicate templates', {
          duration: 2500,
          style: defaultToastStyle,
        });
        return;
      }

      const proposedName = `${template.name || template.title || 'Template'} - Copy`;

      // Check for duplicate names (case-insensitive)
      const { data: existingTemplates, error: checkError } = await supabase
        .from('templates')
        .select('id, name')
        .eq('user_id', user.id)
        .ilike('name', proposedName);

      if (checkError) {
        console.error('Error checking existing templates:', checkError);
        throw checkError;
      }

      if (existingTemplates && existingTemplates.length > 0) {
        toast.error(`A template named '${proposedName}' already exists. Please choose a different name.`, {
          duration: 2500,
          style: defaultToastStyle,
        });
        return;
      }

      // Create duplicate
      const { data, error } = await supabase
        .from('templates')
        .insert({
          user_id: user.id,
          name: proposedName,
          prompt: template.prompt || '',
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      console.log('Template duplicated in Supabase:', data);

      // Reload templates
      await loadTemplatesFromSupabase();

      toast.success(`Template duplicated: ${proposedName}`, {
        duration: 1500,
        style: defaultToastStyle,
      });
    } catch (error) {
      console.error('Failed to duplicate template:', error);
      toast.error('Failed to duplicate template. Please try again.', {
        duration: 2500,
        style: defaultToastStyle,
      });
    }
  };

  const openRenameDialog = (template: any) => {
    setRenameTarget(template);
    setRenameDraft(template.name || template.title || '');
    setIsRenameOpen(true);
  };

  const handleRenameSubmit = async () => {
    if (!renameTarget || !renameDraft.trim()) return;

    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        toast.error('Please sign in to rename templates', {
          duration: 2500,
          style: defaultToastStyle,
        });
        return;
      }

      const newName = renameDraft.trim();

      // Check for duplicate names (excluding current template)
      const { data: existingTemplates, error: checkError } = await supabase
        .from('templates')
        .select('id, name')
        .eq('user_id', user.id)
        .ilike('name', newName)
        .neq('id', renameTarget.id);

      if (checkError) {
        console.error('Error checking existing templates:', checkError);
        throw checkError;
      }

      if (existingTemplates && existingTemplates.length > 0) {
        toast.error(`A template named '${newName}' already exists. Please choose a different name.`, {
          duration: 2500,
          style: defaultToastStyle,
        });
        return;
      }

      // Update template name
      const { error } = await supabase
        .from('templates')
        .update({ name: newName })
        .eq('id', renameTarget.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('Template renamed in Supabase');

      // Reload templates
      await loadTemplatesFromSupabase();

      toast.success(`Template renamed to: ${newName}`, {
        duration: 1500,
        style: defaultToastStyle,
      });

      setIsRenameOpen(false);
      setRenameTarget(null);
      setRenameDraft('');
    } catch (error) {
      console.error('Failed to rename template:', error);
      toast.error('Failed to rename template. Please try again.', {
        duration: 2500,
        style: defaultToastStyle,
      });
    }
  };

  const openDeleteDialog = (template: any) => {
    setDeleteTarget(template);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        toast.error('Please sign in to delete templates', {
          duration: 2500,
          style: defaultToastStyle,
        });
        return;
      }

      // Delete template
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', deleteTarget.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }

      console.log('Template deleted from Supabase');

      // Reload templates
      await loadTemplatesFromSupabase();

      toast.success("Template deleted", {
        duration: 1200,
        style: defaultToastStyle,
      });

      setIsDeleteOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error('Failed to delete template. Please try again.', {
        duration: 2500,
        style: defaultToastStyle,
      });
    }
  };

  // === CREATE NEW TEMPLATE ===
  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim()) return;

    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        toast.error('Please sign in to create templates', {
          duration: 2500,
          style: defaultToastStyle,
        });
        return;
      }

      const templateName = newTemplateName.trim();
      const templatePrompt = newTemplatePrompt.trim();

      // Check for duplicate names
      const { data: existingTemplates, error: checkError } = await supabase
        .from('templates')
        .select('id, name')
        .eq('user_id', user.id)
        .ilike('name', templateName);

      if (checkError) {
        console.error('Error checking existing templates:', checkError);
        throw checkError;
      }

      if (existingTemplates && existingTemplates.length > 0) {
        toast.error(`A template named '${templateName}' already exists. Please choose a different name.`, {
          duration: 2500,
          style: defaultToastStyle,
        });
        return;
      }

      // Create new template with prompt
      const { data, error } = await supabase
        .from('templates')
        .insert({
          user_id: user.id,
          name: templateName,
          prompt: templatePrompt,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      console.log('Template created in Supabase:', data);

      // Reload templates
      await loadTemplatesFromSupabase();

      toast.success(`Template created: ${templateName}`, {
        duration: 1500,
        style: defaultToastStyle,
      });

      setIsCreateOpen(false);
      setNewTemplateName('');
      setNewTemplatePrompt('');
    } catch (error) {
      console.error('Failed to create template:', error);
      toast.error('Failed to create template. Please try again.', {
        duration: 2500,
        style: defaultToastStyle,
      });
    }
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
        <p className="text-sm text-purple-400/70">No templates saved yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {templates.map((t, index) => (
            <Card
              key={t.id || index}
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
                    {t.name || "Untitled Template"}
                  </div>
                  <div className="relative group mt-1">
                    <pre className="text-sm text-[var(--rl-text-secondary)] line-clamp-3 whitespace-pre-wrap font-sans">
                      {t.prompt || "No content yet."}
                    </pre>

                    {/* Tooltip on hover */}
                    <div className="invisible group-hover:visible absolute z-10 bottom-full left-0 mb-2 p-3 bg-black text-white text-xs rounded-lg max-w-md shadow-xl whitespace-pre-wrap">
                      {t.prompt || "No content yet."}
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

      {/* Modal - Template Preview with glass effect */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent
          className="rounded-xl text-rl-text w-full max-w-xl border border-white/[0.08]"
          style={{
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(20px) saturate(180%)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 16px 48px rgba(0, 0, 0, 0.8), 0 32px 96px rgba(0, 0, 0, 0.5)'
          }}
        >
          {previewTemplate && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold text-white">
                  {previewTemplate.name || "Template"}
                </DialogTitle>
                <p className="text-sm text-purple-400/70 mt-1">
                  Created: {new Date(previewTemplate.created_at).toLocaleDateString()}
                </p>
              </DialogHeader>

              <div className="mt-5 rounded-xl border border-white/8 bg-black/30 p-5">
                <div className="mt-4">
                  <div className="mb-1 text-sm text-purple-400/70">
                    Template Content:
                  </div>
                  <p className="leading-relaxed whitespace-pre-line text-white/90">
                    {previewTemplate.prompt || "No content yet."}
                  </p>
                </div>
              </div>

              <DialogFooter className="mt-6 flex justify-end gap-3">
                <button
                  className="rl-btn bg-red-600 hover:bg-red-700 text-white px-6 transition-all"
                  onClick={() => {
                    setPreviewTemplate(null);
                    openDeleteDialog(previewTemplate);
                  }}
                >
                  Delete
                </button>
                <button
                  className="rl-btn rl-btn-secondary px-6"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  className="rl-btn rl-btn-primary px-6"
                  onClick={() => handleLoadTemplate(previewTemplate)}
                >
                  Open in Build
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Rename Template Dialog */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent
          className="max-w-md w-full rounded-2xl bg-gray-900/95 backdrop-blur-xl border border-white/10 shadow-2xl p-8"
        >
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-semibold text-white">
              Rename Template
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium text-purple-400/70">
              Template Name
            </label>
            <input
              type="text"
              value={renameDraft}
              onChange={(e) => setRenameDraft(e.target.value)}
              placeholder="Enter new name..."
              className="w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white placeholder-purple-400/50 focus:ring-2 focus:ring-purple-500 transition-all duration-200"
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

          <DialogFooter className="mt-8 flex justify-between gap-3">
            <button
              className="rl-btn rl-btn-secondary px-6"
              onClick={() => {
                setIsRenameOpen(false);
                setRenameDraft("");
              }}
            >
              Cancel
            </button>
            <button
              className="rl-btn rl-btn-primary px-6"
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
        <DialogContent
          className="max-w-md w-full rounded-2xl bg-gray-900/95 backdrop-blur-xl border border-white/10 shadow-2xl p-8"
        >
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-semibold text-white">
              Delete Template?
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-purple-400/70">
              Are you sure you want to delete "<strong className="text-white">{deleteTarget?.name || deleteTarget?.title || 'this template'}</strong>"? This action cannot be undone.
            </p>
          </div>

          <DialogFooter className="mt-8 flex justify-between gap-3">
            <button
              className="rl-btn rl-btn-secondary px-6"
              onClick={() => setIsDeleteOpen(false)}
            >
              Cancel
            </button>
            <button
              className="rl-btn bg-red-600 hover:bg-red-700 text-white px-6 transition-all"
              onClick={handleDeleteConfirm}
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create New Template Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent
          className="max-w-md w-full rounded-2xl bg-[#1a1a1a] border border-white/10 shadow-2xl p-8"
        >
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-semibold text-white">
              New Template
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Template Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-purple-400/70">
                Template Name
              </label>
              <input
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="e.g., Summer bird view"
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-purple-400/50 focus:ring-2 focus:ring-purple-500 transition-all duration-200"
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

            {/* Prompt */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-purple-400/70">
                Prompt
              </label>
              <textarea
                rows={6}
                value={newTemplatePrompt}
                onChange={(e) => setNewTemplatePrompt(e.target.value)}
                placeholder="Describe the style and transformation you want..."
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-purple-400/50 focus:ring-2 focus:ring-purple-500 transition-all duration-200 resize-none"
              />
            </div>
          </div>

          <DialogFooter className="mt-8 flex justify-between gap-3">
            <button
              className="rl-btn rl-btn-secondary px-6"
              onClick={() => {
                setIsCreateOpen(false);
                setNewTemplateName("");
                setNewTemplatePrompt("");
              }}
            >
              Cancel
            </button>
            <button
              className="rl-btn rl-btn-primary px-6"
              onClick={handleCreateTemplate}
              disabled={!newTemplateName.trim()}
            >
              Create Template
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
