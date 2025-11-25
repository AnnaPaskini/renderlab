'use client';

import { BottomToolbar } from '@/components/inpaint/BottomToolbar';
import { CanvasArea } from '@/components/inpaint/CanvasArea';
import { ResultView } from '@/components/inpaint/ResultView';
import { Tooltip } from '@/components/ui/Tooltip';
import { createClient } from '@/lib/supabaseBrowser';
import { extractMaskBounds } from '@/lib/utils/inpaint/maskExtractor';
import { uploadImageToStorage } from '@/lib/utils/uploadToStorage';
import {
    Download,
    Eraser,
    Lasso,
    Paintbrush,
    Redo,
    RotateCcw,
    Save,
    Trash2,
    Undo,
    X
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type Tool = 'brush' | 'eraser' | 'lasso' | null;

export default function InpaintPage() {
    // State
    const [image, setImage] = useState<string | null>(null);
    const [brushSize, setBrushSize] = useState(40);
    const [activeTool, setActiveTool] = useState<Tool>('lasso');
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
    const [isSaved, setIsSaved] = useState(false); // Track if result is saved to history
    const [isSaveButtonPulsing, setIsSaveButtonPulsing] = useState(false); // Pulse animation for Save button

    // Drawing state for panel visibility
    const [isDrawing, setIsDrawing] = useState(false);
    const [showBrushPanel, setShowBrushPanel] = useState(false);
    const [canvasSize, setCanvasSize] = useState({ width: 1024, height: 1024 });

    // Canvas refs
    const imageCanvasRef = useRef<HTMLCanvasElement>(null);
    const maskCanvasRef = useRef<HTMLCanvasElement>(null);
    const drawCanvasRef = useRef<HTMLCanvasElement>(null);

    // Undo/Redo stacks
    const undoStackRef = useRef<ImageData[]>([]);
    const redoStackRef = useRef<ImageData[]>([]);

    // Load image from URL parameter
    const searchParams = useSearchParams();

    useEffect(() => {
        const imageUrl = searchParams.get('image');
        if (imageUrl) {
            setImage(decodeURIComponent(imageUrl));
        }
    }, [searchParams]);

    // FIX #2: Hide brush panel on actions
    useEffect(() => {
        if (isGenerating) {
            setActiveTool(null);
        }
    }, [isGenerating]);

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

        // FIX #2: Hide brush panel
        setActiveTool(null);
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

        // FIX #2: Hide brush panel
        setActiveTool(null);
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

        // FIX #2: Hide brush panel
        setActiveTool(null);
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
            const supabase = createClient();
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError || !user) {
                alert('Please log in to generate');
                return;
            }

            // 2. Convert image canvas to Blob (mask not needed - extracted in-memory)
            console.log('📦 Converting canvas to Blob...');
            const imageBlob = await new Promise<Blob>((resolve) => {
                imageCanvasRef.current!.toBlob((blob) => resolve(blob!), 'image/png');
            });

            // 3. Upload base image to Supabase (mask processed in-memory by Sharp)
            console.log('☁️ Uploading base image to Supabase...');
            const imageUrl = await uploadImageToStorage(imageBlob, user.id, 'inpaint', `inpaint_base_${Date.now()}.png`);

            if (!imageUrl) {
                throw new Error('Failed to upload base image');
            }

            console.log('✅ Base image uploaded:', imageUrl);

            // ✅ UPLOAD MASK TO SUPABASE (V3 - actual user-drawn shape)
            console.log('☁️ Uploading mask image to Supabase...');
            const maskBlob = await new Promise<Blob>((resolve) => {
                maskCanvasRef.current?.toBlob((blob) => {
                    if (blob) resolve(blob);
                }, 'image/png');
            });

            const maskUrl = await uploadImageToStorage(maskBlob, user.id, 'inpaint', `inpaint_mask_${Date.now()}.png`);

            if (!maskUrl) {
                throw new Error('Failed to upload mask image');
            }

            console.log('✅ Mask image uploaded:', maskUrl);

            // 4. Extract mask bounds (Sharp will process mask in-memory)
            console.log('📐 Extracting mask bounds...');
            const maskBounds = extractMaskBounds(maskCanvasRef.current);
            console.log('✅ Mask bounds:', maskBounds);

            if (!maskBounds) {
                toast.error('Please draw a mask on the image');
                return;
            }

            // ✅ ADD THIS LOGGING BLOCK - FRONTEND MASK BOUNDS
            console.log('═══════════════════════════════════════════');
            console.log('🎨 FRONTEND: Mask Bounds Extracted');
            console.log('═══════════════════════════════════════════');
            console.log('Canvas Size:', maskCanvasRef.current.width, '×', maskCanvasRef.current.height);
            console.log('Mask Bounds:', maskBounds);
            console.log('Mask Position:', {
                topLeft: `(${maskBounds.x}, ${maskBounds.y})`,
                bottomRight: `(${maskBounds.x + maskBounds.width}, ${maskBounds.y + maskBounds.height})`,
                percentageOfImage: `${Math.round(maskBounds.width / maskBounds.imageWidth * 100)}% × ${Math.round(maskBounds.height / maskBounds.imageHeight * 100)}%`
            });
            console.log('Semantic Location:', (() => {
                const leftPercent = (maskBounds.x / maskBounds.imageWidth) * 100;
                const topPercent = (maskBounds.y / maskBounds.imageHeight) * 100;
                const horizontal = leftPercent < 33 ? 'left' : leftPercent > 66 ? 'right' : 'center';
                const vertical = topPercent < 33 ? 'upper' : topPercent > 66 ? 'lower' : 'middle';
                return `${vertical}-${horizontal}`;
            })());
            console.log('User Prompt:', inpaintPrompt);
            console.log('═══════════════════════════════════════════\n');

            // ✅ BUILD OPTIMIZED REQUEST PAYLOAD
            console.log('🎨 Reference image in state:', referenceImage);

            const requestPayload = {
                userId: user.id,                    // ✅ Required by backend
                imageUrl: imageUrl,                 // ✅ Uploaded base image
                maskUrl: maskUrl,                   // ✅ V3: Actual mask PNG with user-drawn shape
                maskBounds: maskBounds,             // ✅ Extracted mask bounds
                userPrompt: inpaintPrompt.trim(),   // ✅ User's instruction
                referenceUrls: referenceImage ? [referenceImage] : [],  // ✅ Reference images (0-3)
                width: canvasSize.width,            // ✅ Canvas width for aspect ratio
                height: canvasSize.height           // ✅ Canvas height for aspect ratio
            };

            console.log('📦 Final request payload:', requestPayload);

            console.log('🚀 FRONTEND: Sending API Request');
            console.log('API Endpoint:', '/api/inpaint/nano-banana');
            console.log('Request Payload:', requestPayload);
            console.log('\n');

            // 5. Call Optimized Nano Banana API
            console.log('🤖 Calling Gemini API with Sharp processing...');
            const response = await fetch('/api/inpaint/nano-banana', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestPayload)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'API request failed');
            }

            // ✅ HANDLE OPTIMIZED API RESPONSE
            console.log('✅ FRONTEND: API Response Received');
            console.log('Success:', result.success);
            console.log('Result URL:', result.url);
            console.log('Processing Time:', result.processingTimeMs, 'ms');
            console.log('Memory Estimate:', result.memoryEstimate);
            console.log('═══════════════════════════════════════════\n\n');

            if (result.success && result.url) {
                console.log('✅ Generation successful!');
                console.log('Result URL:', result.url);
                setResultImage(result.url);
                setShowResult(true);
                setIsSaved(false); // Mark as not saved yet
                setIsSaveButtonPulsing(true); // Trigger pulse animation

                // Stop pulsing after 3 seconds
                setTimeout(() => {
                    setIsSaveButtonPulsing(false);
                }, 3000);

                // ✅ Show success notification with processing time
                toast(
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                            💡
                        </div>
                        <div>
                            <p className="font-semibold text-sm">Result Ready!</p>
                            <p className="text-xs text-gray-300 mt-1">
                                Generated in {Math.round(result.processingTimeMs / 1000)}s •
                                Click <span className="font-medium text-white">"Save to History"</span> to keep this image
                            </p>
                        </div>
                    </div>,
                    {
                        duration: 6000,  // 6 seconds - long enough to read
                        position: 'top-center',
                        style: {
                            background: '#2a2a2a',
                            color: 'white',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            padding: '16px',
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                            fontSize: '14px',
                            fontWeight: '500'
                        }
                    }
                );
            } else {
                throw new Error('Generation failed');
            }

        } catch (error) {
            console.error('❌ FRONTEND: Generation Error', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            // Show user-friendly error with toast
            if (errorMessage.includes('Gemini did not return an image')) {
                toast.error('Generation failed', {
                    description: 'The AI couldn\'t process this request. Try using a different prompt, drawing a smaller mask area, or describing changes more specifically.',
                    duration: 5000,
                });
            } else {
                toast.error('Failed to generate: ' + errorMessage);
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = async () => {
        if (!resultImage) return;

        try {
            // FIX #6: Properly download the image
            const response = await fetch(resultImage);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const filename = `renderlab_inpaint_${Date.now()}.png`;

            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download image');
        }
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
        if (!resultImage) return;

        // Show loading state
        toast.loading('Saving to history...', { id: 'save-history' });

        try {
            // The image is already in storage, just need to mark it as saved
            // FIX #5: Only save when explicitly clicked
            toast.dismiss('save-history');

            // Show success toast
            toast.success(
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                        ✓
                    </div>
                    <div>
                        <p className="font-semibold text-sm">Saved to History!</p>
                        <p className="text-xs text-purple-400/70">
                            View in <a href="/history" className="underline hover:text-white">History page</a>
                        </p>
                    </div>
                </div>,
                {
                    duration: 4000,
                    position: 'top-center',
                    style: {
                        background: '#2a2a2a',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        padding: '16px',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                        fontSize: '14px',
                        fontWeight: '500'
                    }
                }
            );

            setIsSaved(true); // Mark as saved
            setIsSaveButtonPulsing(false); // Stop pulsing since it's saved

            // Don't clear everything - just close result view
            setShowResult(false);
        } catch (error) {
            toast.dismiss('save-history');
            console.error('Save failed:', error);
            toast.error('Failed to save to history');
        }
    };

    const handleClearBoard = () => {
        setShowResult(false);
        setImage(null);
        setResultImage(null);
        setInpaintPrompt('');
        setReferenceImage(null);
        setActiveTool(null);
        setIsSaveButtonPulsing(false); // Reset pulse when clearing
        handleClearMask();
    };

    const getToolButtonClass = (isActive: boolean) =>
        `w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${isActive
            ? 'bg-white text-black'
            : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'}`;

    const getActionButtonClass = (isDisabled: boolean) =>
        `w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${isDisabled
            ? 'text-gray-400/30 cursor-not-allowed'
            : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'}`;

    return (
        <div className="min-h-screen pt-32 pb-8 px-8">
            <div className="relative w-full max-w-7xl mx-auto">
                <div className="relative flex items-center justify-center gap-8 mb-8">
                    <div className="flex-shrink-0">
                        <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col gap-2">
                            <Tooltip text="Brush Tool" position="right">
                                <button
                                    onClick={() => {
                                        setActiveTool('brush');
                                        setShowBrushPanel(true);
                                    }}
                                    className={getToolButtonClass(activeTool === 'brush')}
                                >
                                    <Paintbrush size={18} />
                                </button>
                            </Tooltip>

                            <Tooltip text="Eraser Tool" position="right">
                                <button
                                    onClick={() => {
                                        setActiveTool('eraser');
                                        setShowBrushPanel(true);
                                    }}
                                    className={getToolButtonClass(activeTool === 'eraser')}
                                >
                                    <Eraser size={18} />
                                </button>
                            </Tooltip>

                            <Tooltip text="Lasso Tool" position="right">
                                <button
                                    onClick={() => {
                                        setActiveTool('lasso');
                                        setShowBrushPanel(false);
                                    }}
                                    className={getToolButtonClass(activeTool === 'lasso')}
                                >
                                    <Lasso size={18} />
                                </button>
                            </Tooltip>

                            <div className="h-px bg-white/10 my-1" />

                            <Tooltip text="Undo" position="right">
                                <button
                                    onClick={handleUndo}
                                    disabled={!canUndo}
                                    className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${!canUndo
                                        ? 'text-gray-400/30 cursor-not-allowed'
                                        : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                                        }`}
                                >
                                    <Undo size={18} />
                                </button>
                            </Tooltip>

                            <Tooltip text="Redo" position="right">
                                <button
                                    onClick={handleRedo}
                                    disabled={!canRedo}
                                    className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${!canRedo
                                        ? 'text-gray-400/30 cursor-not-allowed'
                                        : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                                        }`}
                                >
                                    <Redo size={18} />
                                </button>
                            </Tooltip>

                            <div className="h-px bg-white/10 my-1" />

                            <Tooltip text="Clear Mask" position="right">
                                <button
                                    onClick={handleClearMask}
                                    className="w-12 h-12 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </Tooltip>
                        </div>
                    </div>

                    <div className="relative w-full max-w-4xl aspect-square">
                        {showResult && resultImage && image ? (
                            <ResultView
                                originalImage={image}
                                resultImage={resultImage}
                                prompt={inpaintPrompt}
                                onDownload={handleDownload}
                                onEditAgain={handleEditAgain}
                                onSendToHistory={handleSendToHistory}
                                onClearBoard={handleClearBoard}
                            />
                        ) : (
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
                                onDrawingStart={() => {
                                    setIsDrawing(true);
                                    setShowBrushPanel(false);
                                }}
                                onDrawingEnd={() => setIsDrawing(false)}
                                onCanvasSizeChange={setCanvasSize}
                            />
                        )}

                        {showBrushPanel && (
                            <div className="absolute left-[112px] top-1/2 -translate-y-1/2 z-50 transition-all duration-200 ease-out animate-fadeIn">
                                <div className="bg-[#2a2a2a] rounded-xl px-4 py-3 border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-medium text-purple-400/70">
                                            {activeTool === 'brush' ? 'Brush Size' : 'Eraser Size'}
                                        </span>
                                        <span className="text-sm font-semibold text-white">{brushSize}px</span>
                                    </div>

                                    <input
                                        type="range"
                                        min="5"
                                        max="150"
                                        value={brushSize}
                                        onChange={(e) => setBrushSize(Number(e.target.value))}
                                        className="w-40 h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition-colors"
                                    />

                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => setBrushSize(20)}
                                            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${brushSize === 20
                                                ? 'bg-purple-500 text-white'
                                                : 'bg-[#1a1a1a] text-gray-300 hover:bg-[#242424]'
                                                }`}
                                        >
                                            Small
                                        </button>
                                        <button
                                            onClick={() => setBrushSize(60)}
                                            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${brushSize === 60
                                                ? 'bg-purple-500 text-white'
                                                : 'bg-[#1a1a1a] text-gray-300 hover:bg-[#242424]'
                                                }`}
                                        >
                                            Medium
                                        </button>
                                        <button
                                            onClick={() => setBrushSize(120)}
                                            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${brushSize === 120
                                                ? 'bg-purple-500 text-white'
                                                : 'bg-[#1a1a1a] text-gray-300 hover:bg-[#242424]'
                                                }`}
                                        >
                                            Large
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex-shrink-0">
                        <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-2 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col gap-2">
                            <Tooltip text="Download PNG" position="left">
                                <button
                                    onClick={handleDownload}
                                    disabled={!resultImage}
                                    className={getActionButtonClass(!resultImage)}
                                >
                                    <Download size={20} />
                                </button>
                            </Tooltip>

                            <Tooltip text="Edit Again" position="left">
                                <button
                                    onClick={handleEditAgain}
                                    disabled={!resultImage}
                                    className={getActionButtonClass(!resultImage)}
                                >
                                    <RotateCcw size={20} />
                                </button>
                            </Tooltip>

                            <Tooltip text="Save to History" position="left">
                                <button
                                    onClick={handleSendToHistory}
                                    disabled={!resultImage}
                                    className={`relative ${getActionButtonClass(!resultImage)} ${isSaveButtonPulsing ? 'animate-pulse' : ''}`}
                                >
                                    <Save size={20} />
                                    {/* Pulsing indicator for unsaved */}
                                    {resultImage && !isSaved && (
                                        <div className={`absolute -top-1 -right-1 w-3 h-3 bg-[#ff6b35] rounded-full ring-2 ring-black ${isSaveButtonPulsing ? 'animate-pulse' : ''}`} />
                                    )}
                                </button>
                            </Tooltip>

                            <Tooltip text="Clear All" position="left">
                                <button
                                    onClick={handleClearBoard}
                                    disabled={!image && !resultImage}
                                    className={getActionButtonClass(!image && !resultImage)}
                                >
                                    <X size={20} />
                                </button>
                            </Tooltip>
                        </div>
                    </div>
                </div>

                <div className="w-full">
                    <BottomToolbar
                        inpaintPrompt={inpaintPrompt}
                        setInpaintPrompt={setInpaintPrompt}
                        hasMask={hasMask}
                        onGenerate={handleGenerate}
                        isGenerating={isGenerating}
                        referenceImage={referenceImage}
                        onReferenceImageChange={setReferenceImage}
                    />
                </div>
            </div>
        </div>
    );
}
