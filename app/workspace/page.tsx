"use client";

import { useState } from "react";
import { NavBar } from "@/components/navbar";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { ImageUploadPanel } from "@/components/workspace/ImageUploadPanel";
import { PromptBuilderPanel } from "@/components/workspace/PromptBuilderPanelNew";
import { PreviewStrip } from "@/components/workspace/PreviewStrip";
import { toast } from "sonner";
import { defaultToastStyle } from "@/lib/toast-config";

export default function WorkspacePage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [previews, setPreviews] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (model: string) => {
    if (!prompt) {
      toast.error("Please enter a prompt", { style: defaultToastStyle });
      return;
    }

    console.log("Model used:", model || "google/nano-banana");
    console.log("Has reference image:", !!uploadedImage);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model: model || "google/nano-banana",
          imageUrl: uploadedImage || null,
        }),
      });

      const rawBody = await response.text();

      if (!response.ok) {
        console.error(
          "Generation request failed:",
          response.status,
          response.statusText,
          rawBody
        );
        throw new Error(`Generation failed with status ${response.status}`);
      }

      let data: any = null;
      try {
        data = rawBody ? JSON.parse(rawBody) : null;
      } catch (parseErr) {
        console.error("Failed to parse JSON:", rawBody);
        throw new Error("Server returned invalid JSON");
      }

      console.log("API response:", data);

      if (data?.status === "succeeded" && data?.output?.imageUrl) {
        const nextImage = data.output.imageUrl;
        setPreviews((prev) => [...prev, nextImage]);
        
        // Show different toast based on mode
        if (uploadedImage) {
          toast.success("✨ Generated from reference image", { style: defaultToastStyle });
        } else {
          toast.success("✨ Generated from text prompt only", { style: defaultToastStyle });
        }
      } else {
        console.error("Unexpected API response:", data);
        toast.error("Generation failed: " + (data?.error || "Unknown error"), { style: defaultToastStyle });
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Generation failed - check console for details.", { style: defaultToastStyle });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <NavBar />
      <WorkspaceLayout
        leftPanel={
          <ImageUploadPanel
            image={uploadedImage}
            onImageChange={setUploadedImage}
          />
        }
        rightPanel={
          <PromptBuilderPanel
            onPromptChange={setPrompt}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            onPreviewAdd={(url) => setPreviews((prev) => [...prev, url])}
            uploadedImage={uploadedImage}
          />
        }
        uploadedImage={uploadedImage}
        previews={previews}
      />
    </>
  );
}
