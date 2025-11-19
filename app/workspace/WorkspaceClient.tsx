'use client';

import { ImageUploadPanel } from "@/components/workspace/ImageUploadPanel";
import { PromptBuilderPanel } from "@/components/workspace/PromptBuilderPanelNew";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { useWorkspace } from "@/lib/context/WorkspaceContext";
import { createClient } from "@/lib/supabaseBrowser";
import { defaultToastStyle } from "@/lib/toast-config";
import { Link as LinkIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface PreviewImage {
  id: string;
  thumbnail_url: string | null;
  url: string;
  created_at: string;
}

interface WorkspaceClientProps {
  initialPreviewImages: PreviewImage[];
}

export function WorkspaceClient({ initialPreviewImages }: WorkspaceClientProps) {
  const searchParams = useSearchParams();
  const { activeItem, loadTemporary } = useWorkspace();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [previews, setPreviews] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [additionalDetailsFromUrl, setAdditionalDetailsFromUrl] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<PreviewImage[]>(initialPreviewImages);
  const hasLoadedFromUrlRef = useRef(false);

  // Load prompt from URL query parameter (from Prompts Library)
  useEffect(() => {
    // Prevent running multiple times (React Strict Mode runs effects twice)
    if (hasLoadedFromUrlRef.current) return;

    const promptFromUrl = searchParams.get('prompt');
    const additionalPromptFromUrl = searchParams.get('additionalPrompt');

    if (promptFromUrl) {
      const decodedPrompt = decodeURIComponent(promptFromUrl);
      setPrompt(decodedPrompt);
      toast.info('Prompt loaded from library', {
        style: {
          background: '#ff6b35',
          color: 'white',
          border: 'none'
        }
      });
      hasLoadedFromUrlRef.current = true;
    }

    if (additionalPromptFromUrl) {
      const decodedAdditionalPrompt = decodeURIComponent(additionalPromptFromUrl);
      setAdditionalDetailsFromUrl(decodedAdditionalPrompt);
      toast.success('Prompt added to Additional Details', {
        style: {
          background: '#10b981',
          color: 'white',
          border: 'none'
        },
        duration: 3000
      });

      hasLoadedFromUrlRef.current = true;

      // Clear the URL parameter after loading (optional - keeps URL clean)
      // You can remove this if you want the parameter to persist in URL
      setTimeout(() => {
        window.history.replaceState({}, '', '/workspace');
      }, 100);
    }
  }, [searchParams]);

  // Sync reference image with WorkspaceContext when temporary item is loaded
  useEffect(() => {
    if (activeItem.type === 'temporary' && activeItem.data?.reference_url) {
      setUploadedImage(activeItem.data.reference_url);
      console.log('✅ [Workspace] Loaded temporary reference image:', activeItem.data.reference_url);
    }
  }, [activeItem]);

  // ✅ REALTIME SUBSCRIPTION: Listen for new images
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtimeSubscription = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.log('⚠️ [Realtime] No user found, skipping subscription');
        return;
      }

      console.log('🔴 [Realtime] Setting up subscription for user:', user.id);

      // Create channel and subscribe to INSERT events
      channel = supabase
        .channel('workspace-images')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'images',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('🔴 [Realtime] New image inserted:', payload);

            const newImage = payload.new as PreviewImage;

            // Prepend new image to preview strip (most recent first)
            setPreviewImages((prev) => [newImage, ...prev]);

            // Show toast notification
            toast.success('✨ New image generated!', {
              description: 'Added to workspace preview',
              style: {
                background: '#10b981',
                color: 'white',
                border: 'none'
              },
              duration: 3000
            });
          }
        )
        .subscribe((status) => {
          console.log('🔴 [Realtime] Subscription status:', status);
        });
    };

    setupRealtimeSubscription();

    // Cleanup: Unsubscribe when component unmounts
    return () => {
      if (channel) {
        console.log('🔴 [Realtime] Cleaning up subscription');
        supabase.removeChannel(channel);
      }
    };
  }, []); // Empty dependency array - only run once on mount

  // Clear reference image handler - preserves prompt and context
  const handleClearReference = () => {
    // Clear only the reference image
    setUploadedImage(null);

    // Positive feedback toast
    toast.info('Reference cleared — prompt preserved', {
      style: {
        background: '#ff6b35',
        color: 'white',
        border: 'none'
      }
    });

    console.log('✅ [Workspace] Reference cleared, prompt preserved');
  };

  // Handle removing image from preview strip
  const handleRemoveFromPreview = (imageId: string) => {
    setPreviewImages(prev => prev.filter(img => img.id !== imageId));
    toast.info('Removed from view', {
      style: {
        background: '#ff6b35',
        color: 'white',
        border: 'none'
      }
    });
  };

  // URL validation and loading function
  async function validateAndLoadImageUrl(url: string) {
    if (!url.trim()) {
      toast.error('Please enter an image URL');
      return;
    }

    setIsValidatingUrl(true);

    try {
      // Check 1: Direct image URL pattern
      const imageExtensions = /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i;
      if (imageExtensions.test(url)) {
        // Direct image URL - load immediately
        setUploadedImage(url);
        toast.success('Image loaded from URL');
        setImageUrl('');
        setIsValidatingUrl(false);
        return;
      }

      // Check 2: Common non-image page URLs
      const pagePatterns = [
        'pinterest.com/pin/',
        'instagram.com/p/',
        'facebook.com',
        'twitter.com',
        'x.com'
      ];

      if (pagePatterns.some(pattern => url.includes(pattern))) {
        toast.error('This link is not a direct image file', {
          description: 'Right-click the image → "Copy image address"',
          duration: 5000
        });
        setIsValidatingUrl(false);
        return;
      }

      // Check 3: Try HEAD request to verify content type
      const response = await fetch(url, { method: 'HEAD' });
      const contentType = response.headers.get('content-type');

      if (contentType?.startsWith('image/')) {
        setUploadedImage(url);
        toast.success('Image loaded from URL');
        setImageUrl('');
      } else {
        toast.error('This URL does not point to an image file');
      }

    } catch (error) {
      console.error('Failed to validate URL:', error);
      toast.error('Failed to load image from URL. Please check the link and try again.');
    } finally {
      setIsValidatingUrl(false);
    }
  }

  const handleGenerate = async (model: string) => {
    if (!prompt) {
      toast.error("Please enter a prompt", { style: defaultToastStyle });
      return;
    }

    console.log("Model used:", model || "nano-banana");
    console.log("Has reference image:", !!uploadedImage);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model: model || "nano-banana",
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
      <WorkspaceLayout
        previewImages={previewImages}
        onRemovePreview={handleRemoveFromPreview}
        leftPanel={
          <div className="space-y-6">
            {/* Upload Zone */}
            <ImageUploadPanel
              image={uploadedImage}
              onImageChange={setUploadedImage}
              onClearImage={handleClearReference}
            />

            {/* URL Input - separate section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 border-t border-white/40 dark:border-white/20" />
                <span className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">OR</span>
                <div className="flex-1 border-t border-white/40 dark:border-white/20" />
              </div>

              <label className="flex items-center gap-2 text-sm font-medium text-neutral-900 dark:text-white">
                <LinkIcon size={16} className="text-neutral-500 dark:text-neutral-400" />
                Paste image URL
              </label>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && imageUrl.trim()) {
                      validateAndLoadImageUrl(imageUrl);
                    }
                  }}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 px-3 py-2 text-sm border border-white/8 rounded-lg bg-[#141414] focus:ring-2 focus:ring-[#ff6b35] focus:ring-opacity-50 focus:border-[#ff6b35] outline-none transition-all text-white placeholder:text-gray-500"
                  disabled={isValidatingUrl}
                />

                <button
                  onClick={() => validateAndLoadImageUrl(imageUrl)}
                  disabled={!imageUrl.trim() || isValidatingUrl}
                  className="px-5 py-2.5 bg-[#202020] text-white text-sm font-medium rounded-lg hover:bg-[#282828] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isValidatingUrl ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Loading
                    </span>
                  ) : (
                    'Load'
                  )}
                </button>
              </div>

              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Direct image links only (.jpg, .png, .webp)
              </p>
            </div>
          </div>
        }
        rightPanel={
          <PromptBuilderPanel
            onPromptChange={setPrompt}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            onPreviewAdd={(url) => setPreviews((prev) => [...prev, url])}
            uploadedImage={uploadedImage}
            initialAdditionalDetails={additionalDetailsFromUrl}
          />
        }
        uploadedImage={uploadedImage}
        previews={previews}
      />
    </>
  );
}