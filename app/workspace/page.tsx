"use client";

import { useState } from "react";
import { NavBar } from "@/components/navbar";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { ImageUploadPanel } from "@/components/workspace/ImageUploadPanel";
import { PromptBuilderPanel } from "@/components/workspace/PromptBuilderPanelNew";
import { PreviewStrip } from "@/components/workspace/PreviewStrip";

export default function WorkspacePage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [previews, setPreviews] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (model: string) => {
    if (!prompt) {
      alert("Please build a prompt first");
      return;
    }

    if (!uploadedImage) {
      alert("Please upload an image first");
      return;
    }

    console.log("Model used:", model || "google/nano-banana");
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model: model || "google/nano-banana",
          baseImage: uploadedImage,
        }),
      });

      const rawBody = await response.text();

      if (!response.ok) {
        console.error(
          "Edit request failed:",
          response.status,
          response.statusText,
          rawBody
        );
        throw new Error(`Edit failed with status ${response.status}`);
      }

      let data: any = null;
      try {
        data = rawBody ? JSON.parse(rawBody) : null;
      } catch (parseErr) {
        console.error("Failed to parse JSON:", rawBody);
        throw new Error("Server returned invalid JSON");
      }

      console.log("API response:", data);

      // === главное изменение ===
      if (data?.status === "succeeded" && data?.output?.imageUrl) {
        const nextImage = data.output.imageUrl;
        setPreviews((prev) => [...prev, nextImage]);
        alert("Image generated successfully!");
      } else {
        console.error("Unexpected API response:", data);
        alert("Edit failed: " + (data?.error || "Unknown error"));
      }
      // =========================
    } catch (error) {
      console.error("Edit error:", error);
      alert("Edit failed - check console for details.");
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
