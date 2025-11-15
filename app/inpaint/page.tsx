'use client';

import { BottomToolbar } from '@/components/inpaint/BottomToolbar';
import { BrushControls } from '@/components/inpaint/BrushControls';
import { CanvasArea } from '@/components/inpaint/CanvasArea';
import { ToolIconsBar } from '@/components/inpaint/ToolIconsBar';
import { TopControls } from '@/components/inpaint/TopControls';
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
        </div>
    );
}
