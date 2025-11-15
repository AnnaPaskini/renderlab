'use client';

import { BottomToolbar } from '@/components/inpaint/BottomToolbar';
import { BrushControls } from '@/components/inpaint/BrushControls';
import { CanvasArea } from '@/components/inpaint/CanvasArea';
import { ResultView } from '@/components/inpaint/ResultView';
import { ToolIconsBar } from '@/components/inpaint/ToolIconsBar';
import { TopControls } from '@/components/inpaint/TopControls';
import { supabase } from '@/lib/supabase';
import { extractMaskBounds } from '@/lib/utils/inpaint/maskExtractor';
import { uploadImageToStorage } from '@/lib/utils/uploadToStorage';
import { AnimatePresence } from 'framer-motion';
import { useRef, useState } from 'react';

type Tool = 'brush' | 'eraser' | 'lasso' | null;

export default function InpaintPage() {
    // State
    const [image, setImage] = useState<string | null>(null);
    const [brushSize, setBrushSize] = useState(40);
    const [activeTool, setActiveTool] = useState<Tool>('brush');
    const [inpaintPrompt, setInpaintPrompt] = useState('');
    const [showMask, setShowMask] = useState(true);
    const [hasMask, setHasMask] = useState(false); // Kyle spec: track if mask exists
    const [referenceImage, setReferenceImage] = useState<string | null>(null); // ANNA FIX: reference image
    const [visualReference, setVisualReference] = useState<string | null>(null); // ANNA FIX: visual tab reference

    // ANNA FIX: Force re-render for undo/redo button states
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    // Generation state
    const [isGenerating, setIsGenerating] = useState(false);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);

    // Canvas refs
    const imageCanvasRef = useRef<HTMLCanvasElement>(null);
    const maskCanvasRef = useRef<HTMLCanvasElement>(null);
    const drawCanvasRef = useRef<HTMLCanvasElement>(null);

    // Undo/Redo stacks
    const undoStackRef = useRef<ImageData[]>([]);
    const redoStackRef = useRef<ImageData[]>([]);

    // Handlers
    const handleUndo = () => {
        if (undoStackRef.current.length === 0 || !maskCanvasRef.current) return;

        const ctx = maskCanvasRef.current.getContext('2d');
        if (!ctx) return;

        // Save current state to redo
        redoStackRef.current.push(ctx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height));

        // Restore previous state
        const previousState = undoStackRef.current.pop()!;
        ctx.putImageData(previousState, 0, 0);

        // ANNA FIX: Update button states
        setCanUndo(undoStackRef.current.length > 0);
        setCanRedo(redoStackRef.current.length > 0);
    };

    const handleRedo = () => {
        if (redoStackRef.current.length === 0 || !maskCanvasRef.current) return;

        const ctx = maskCanvasRef.current.getContext('2d');
        if (!ctx) return;

        // Save current state to undo
        undoStackRef.current.push(ctx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height));

        // Restore redo state
        const nextState = redoStackRef.current.pop()!;
        ctx.putImageData(nextState, 0, 0);

        // ANNA FIX: Update button states
        setCanUndo(undoStackRef.current.length > 0);
        setCanRedo(redoStackRef.current.length > 0);
    };

    const handleClearMask = () => {
        if (!maskCanvasRef.current) return;

        const ctx = maskCanvasRef.current.getContext('2d');
        if (!ctx) return;

        // Save to undo stack
        undoStackRef.current.push(ctx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height));

        // Clear mask
        ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);

        // Clear redo stack
        redoStackRef.current = [];

        // Kyle spec: reset hasMask state
        setHasMask(false);

        // ANNA FIX: Update button states
        setCanUndo(undoStackRef.current.length > 0);
        setCanRedo(false);
    };

    const saveToUndoStack = () => {
        if (!maskCanvasRef.current) return;

        const ctx = maskCanvasRef.current.getContext('2d');
        if (!ctx) return;

        undoStackRef.current.push(ctx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height));
        redoStackRef.current = []; // Clear redo stack on new action

        // Kyle spec: track if mask exists
        setHasMask(true);

        // ANNA FIX: Update button states
        setCanUndo(undoStackRef.current.length > 0);
        setCanRedo(false);
    };

    // Kyle spec: Remove Image handler
    const handleRemoveImage = () => {
        // Clear image
        setImage(null);

        // Clear all canvas
        if (imageCanvasRef.current) {
            const ctx = imageCanvasRef.current.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, imageCanvasRef.current.width, imageCanvasRef.current.height);
            }
        }
        if (maskCanvasRef.current) {
            const ctx = maskCanvasRef.current.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
            }
        }
        if (drawCanvasRef.current) {
            const ctx = drawCanvasRef.current.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, drawCanvasRef.current.width, drawCanvasRef.current.height);
            }
        }

        // Reset state
        setHasMask(false);
        undoStackRef.current = [];
        redoStackRef.current = [];

        // ANNA FIX: Update button states
        setCanUndo(false);
        setCanRedo(false);
    };

    const handleGenerate = async () => {
        if (!image || !hasMask || !inpaintPrompt.trim()) {
            alert('Please upload image, draw mask, and enter prompt');
            return;
        }

        if (!imageCanvasRef.current || !maskCanvasRef.current) {
            alert('Canvas not ready');
            return;
        }

        try {
            setIsGenerating(true);
            console.log('🚀 Starting inpaint generation...');

            // 1. Get user
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError || !user) {
                alert('Please log in to generate');
                return;
            }

            // 2. Convert canvas to Blob
            console.log('📦 Converting canvas to Blob...');
            const imageBlob = await new Promise<Blob>((resolve) => {
                imageCanvasRef.current!.toBlob((blob) => resolve(blob!), 'image/png');
            });

            const maskBlob = await new Promise<Blob>((resolve) => {
                maskCanvasRef.current!.toBlob((blob) => resolve(blob!), 'image/png');
            });

            // 3. Upload to Supabase
            console.log('☁️ Uploading to Supabase...');
            const imageUrl = await uploadImageToStorage(imageBlob, user.id, `inpaint_base_${Date.now()}.png`);
            const maskUrl = await uploadImageToStorage(maskBlob, user.id, `inpaint_mask_${Date.now()}.png`);

            if (!imageUrl || !maskUrl) {
                throw new Error('Failed to upload images');
            }

            console.log('✅ Images uploaded:', { imageUrl, maskUrl });

            // 4. Extract mask bounds
            console.log('📐 Extracting mask bounds...');
            const maskBounds = extractMaskBounds(maskCanvasRef.current);
            console.log('✅ Mask bounds:', maskBounds);

            // 5. Call API
            console.log('🤖 Calling Gemini API...');
            const response = await fetch('/api/inpaint/nano-banana', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageUrl,
                    maskUrl,
                    maskBounds,
                    userPrompt: inpaintPrompt,
                    referenceUrls: referenceImage ? [referenceImage] : [],
                    baseImageUrl: image
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'API request failed');
            }

            if (result.success) {
                console.log('✅ Generation successful!');
                console.log('Result URL:', result.output);
                setResultImage(result.output);
                setShowResult(true);
            } else {
                throw new Error('Generation failed');
            }

        } catch (error) {
            console.error('❌ Generate failed:', error);
            alert('Failed to generate: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = () => {
        if (!resultImage) return;

        const filename = `renderlab_inpaint_${Date.now()}.png`;
        const link = document.createElement('a');
        link.href = resultImage;
        link.download = filename;
        link.click();
    };

    const handleEditAgain = () => {
        // Close result view, keep prompt and reference
        setShowResult(false);
        // Load result as new base image
        if (resultImage) {
            setImage(resultImage);
        }
        setResultImage(null);
        // Clear mask but keep prompt
        handleClearMask();
    };

    const handleSendToHistory = async () => {
        // Image already saved to database by API
        // Just show confirmation and close
        alert('Saved to History successfully!');
        setShowResult(false);
        setImage(null);
        setResultImage(null);
        setInpaintPrompt('');
        setReferenceImage(null);
    };

    const handleClearBoard = () => {
        setShowResult(false);
        setImage(null);
        setResultImage(null);
        setInpaintPrompt('');
        setReferenceImage(null);
        handleClearMask();
    };

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden dot-grid">
            {/* Canvas Area */}
            <CanvasArea
                image={image}
                imageCanvasRef={imageCanvasRef}
                maskCanvasRef={maskCanvasRef}
                drawCanvasRef={drawCanvasRef}
                brushSize={brushSize}
                activeTool={activeTool}
                showMask={showMask}
                onImageChange={setImage}
                onSaveToUndoStack={saveToUndoStack}
                onRemoveImage={handleRemoveImage}
            />

            {/* Top Controls */}
            <TopControls />

            {/* Bottom Toolbar */}
            <BottomToolbar
                inpaintPrompt={inpaintPrompt}
                setInpaintPrompt={setInpaintPrompt}
                hasMask={hasMask}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
            />

            {/* Tool Icons Bar */}
            <ToolIconsBar
                activeTool={activeTool}
                setActiveTool={setActiveTool}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onClearMask={handleClearMask}
                canUndo={canUndo}
                canRedo={canRedo}
            />

            {/* Brush Controls (conditional) */}
            <AnimatePresence>
                {(activeTool === 'brush' || activeTool === 'eraser') && (
                    <BrushControls
                        brushSize={brushSize}
                        setBrushSize={setBrushSize}
                    />
                )}
            </AnimatePresence>

            {/* Result View - conditional */}
            {showResult && resultImage && image && (
                <ResultView
                    originalImage={image}
                    resultImage={resultImage}
                    prompt={inpaintPrompt}
                    onDownload={handleDownload}
                    onEditAgain={handleEditAgain}
                    onSendToHistory={handleSendToHistory}
                    onClearBoard={handleClearBoard}
                />
            )}
        </div>
    );
}
