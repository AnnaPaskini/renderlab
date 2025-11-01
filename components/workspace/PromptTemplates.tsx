"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

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
      style: { fontSize: "14px" },
    });

    // Close modal
    setPreviewTemplate(null);

    // Visually switch tab to Builder
    setTimeout(() => {
      if (setActiveTab) setActiveTab("builder");
    }, 400);
  };

  const handleDeleteTemplate = (templateToDelete: any) => {
    if (!templateToDelete) return;

    const confirmed = confirm(
      `Delete "${templateToDelete.name || templateToDelete.title || "this template"}"?`
    );
    if (!confirmed) return;

    const stored = JSON.parse(
      localStorage.getItem("RenderAI_customTemplates") || "[]"
    );
    const updated = stored.filter(
      (t: any) => t.createdAt !== templateToDelete.createdAt
    );
    localStorage.setItem("RenderAI_customTemplates", JSON.stringify(updated));
    setTemplates(updated);

    toast.success("Template deleted", {
      duration: 1200,
      style: { fontSize: "14px" },
    });

    setPreviewTemplate(null);
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

  return (
    <div className="p-4 h-full overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">My Templates</h2>
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
              onClick={() => setPreviewTemplate(t)}
              className="cursor-move rounded-xl border border-gray-200 dark:border-neutral-700 p-4 transition-all hover:shadow-md hover:border-gray-400 dark:hover:border-neutral-500 hover:-translate-y-0.5 active:cursor-grabbing"
              title="Drag to add to collection"
            >
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                {t.name || t.title || "Untitled Template"}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t.style || t.scenario || t.details || "No details yet."}
              </p>
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
                  onClick={() => handleDeleteTemplate(previewTemplate)}
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
    </div>
  );
}
