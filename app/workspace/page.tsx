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
      const response = await fetch("/api/generate/replicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model: model || "google/nano-banana",
          imageUrl: uploadedImage,
        }),
      });

      let data;

      try {
        // безопасный парсинг
        data = await response.json();
      } catch (parseErr) {
        console.error("Failed to parse JSON:", parseErr);
        const text = await response.text();
        console.log("Raw response:", text);
        throw new Error("Server returned invalid JSON");
      }

      console.log("Edit response:", data);

      if (data.success && data.result) {
        // сервер возвращает result, не imageUrl
        setPreviews((prev) => [...prev, data.result]);
        alert("Image edited successfully!");
      } else {
        alert("Edit failed: " + (data.error || "Unknown error"));
      }
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
          />
        }
        uploadedImage={uploadedImage}
        previews={previews}
      />
    </>
  );
}
