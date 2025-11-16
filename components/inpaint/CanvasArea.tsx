'use client';

import clsx from 'clsx';
import { Lasso, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

type Tool = 'brush' | 'eraser' | 'lasso' | null;

interface CanvasAreaProps {
    image: string | null;
    imageCanvasRef: React.RefObject<HTMLCanvasElement | null>;
    maskCanvasRef: React.RefObject<HTMLCanvasElement | null>;
    drawCanvasRef: React.RefObject<HTMLCanvasElement | null>;
    brushSize: number;
    activeTool: Tool;
    showMask: boolean;
    onImageChange?: (image: string) => void;
    onSaveToUndoStack: () => void;
    onRemoveImage?: () => void; // Kyle spec: Remove Image button
    onDrawingStart?: () => void;
    onDrawingEnd?: () => void;
}

export function CanvasArea({
    image,
    imageCanvasRef,
    maskCanvasRef,
    drawCanvasRef,
    brushSize,
    activeTool,
    showMask,
    onImageChange,
    onSaveToUndoStack,
    onRemoveImage,
    onDrawingStart,
    onDrawingEnd
}: CanvasAreaProps) {
    const [isDragActive, setIsDragActive] = useState(false);
    const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
    const [globalCursorPos, setGlobalCursorPos] = useState<{ x: number; y: number } | null>(null); // Kyle spec: for fixed lasso icon

    // For smooth brush strokes
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);
    const isDrawingRef = useRef(false); // Use ref instead of state to prevent re-renders

    // For lasso tool
    const lassoPathRef = useRef<{ x: number; y: number }[]>([]);

    // Global mouse up handler to stop drawing when mouse is released anywhere
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (isDrawingRef.current) {
                stopDrawing();
            }
        };

        document.addEventListener('mouseup', handleGlobalMouseUp);
        document.addEventListener('mouseleave', handleGlobalMouseUp); // Also handle when mouse leaves window
        return () => {
            document.removeEventListener('mouseup', handleGlobalMouseUp);
            document.removeEventListener('mouseleave', handleGlobalMouseUp);
        };
    }, []);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(e.type === "dragenter" || e.type === "dragover");
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageUrl = event.target?.result as string;
                if (imageUrl && onImageChange) {
                    onImageChange(imageUrl);
                }
            };
            reader.readAsDataURL(file);
        }
    }, [onImageChange]);

    // Load image onto canvas when image changes
    useEffect(() => {
        if (!image || !imageCanvasRef.current || !maskCanvasRef.current || !drawCanvasRef.current) return;

        const img = new Image();
        img.onload = () => {
            const imageCanvas = imageCanvasRef.current!;
            const maskCanvas = maskCanvasRef.current!;
            const drawCanvas = drawCanvasRef.current!;

            // Set canvas dimensions to fixed size (1024x1024 for consistency)
            const width = 1024;
            const height = 1024;

            imageCanvas.width = width;
            imageCanvas.height = height;
            maskCanvas.width = width;
            maskCanvas.height = height;
            drawCanvas.width = width;
            drawCanvas.height = height;

            // Draw image
            const ctx = imageCanvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
            }
        };
        img.src = image;
    }, [image, imageCanvasRef, maskCanvasRef, drawCanvasRef]);

    const getCanvasCoordinates = (e: React.MouseEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();

        // Get mouse position relative to displayed canvas
        const displayX = e.clientX - rect.left;
        const displayY = e.clientY - rect.top;

        // Scale coordinates to match internal canvas coordinate system (1024x1024)
        // The canvas is displayed with object-contain, so we need to scale
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: displayX * scaleX,
            y: displayY * scaleY
        };
    };

    const drawBrushStroke = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, lastX?: number, lastY?: number) => {
        ctx.save(); // Save context state for performance
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = brushSize;
        ctx.strokeStyle = 'rgba(255, 70, 70, 1)'; // Kyle spec: solid red
        ctx.fillStyle = 'rgba(255, 70, 70, 1)';

        if (lastX !== undefined && lastY !== undefined) {
            // Draw smooth line from last point to current point
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            ctx.stroke();
        } else {
            // Draw initial point
            ctx.beginPath();
            ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore(); // Restore context state
    }, [brushSize]);

    const drawEraserStroke = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, lastX?: number, lastY?: number) => {
        ctx.save(); // Save context state for performance
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = brushSize;

        if (lastX !== undefined && lastY !== undefined) {
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore(); // Restore context state
    }, [brushSize]);

    const startDrawing = (e: React.MouseEvent) => {
        if (!maskCanvasRef.current || !activeTool) return;

        // Notify parent that drawing started
        onDrawingStart?.();

        const coords = getCanvasCoordinates(e, maskCanvasRef.current);

        if (activeTool === 'lasso') {
            // Start lasso path
            lassoPathRef.current = [coords];
            isDrawingRef.current = true;
        } else {
            // Save state before drawing
            onSaveToUndoStack();
            lastPointRef.current = coords;
            isDrawingRef.current = true;

            const ctx = maskCanvasRef.current.getContext('2d');
            if (!ctx) return;

            if (activeTool === 'brush') {
                drawBrushStroke(ctx, coords.x, coords.y);
            } else if (activeTool === 'eraser') {
                drawEraserStroke(ctx, coords.x, coords.y);
            }
        }
    };

    const draw = (e: React.MouseEvent) => {
        if (!isDrawingRef.current || !maskCanvasRef.current || !activeTool) return;

        const coords = getCanvasCoordinates(e, maskCanvasRef.current);

        const ctx = maskCanvasRef.current.getContext('2d');
        if (!ctx) return;

        if (activeTool === 'lasso') {
            // Add point to lasso path
            lassoPathRef.current.push(coords);

            // Draw lasso path on draw canvas for visualization - Kyle spec
            if (drawCanvasRef.current) {
                const drawCtx = drawCanvasRef.current.getContext('2d');
                if (drawCtx) {
                    drawCtx.clearRect(0, 0, drawCanvasRef.current.width, drawCanvasRef.current.height);
                    drawCtx.strokeStyle = 'rgba(255, 255, 255, 0.85)'; // Kyle spec: white line
                    drawCtx.lineWidth = 1.5; // Kyle spec: thin line
                    drawCtx.lineCap = 'round';
                    drawCtx.lineJoin = 'round';

                    // Smooth curve with quadraticCurveTo - Kyle spec
                    drawCtx.beginPath();
                    drawCtx.moveTo(lassoPathRef.current[0].x, lassoPathRef.current[0].y);

                    for (let i = 1; i < lassoPathRef.current.length - 1; i++) {
                        const xMid = (lassoPathRef.current[i].x + lassoPathRef.current[i + 1].x) / 2;
                        const yMid = (lassoPathRef.current[i].y + lassoPathRef.current[i + 1].y) / 2;
                        drawCtx.quadraticCurveTo(
                            lassoPathRef.current[i].x,
                            lassoPathRef.current[i].y,
                            xMid,
                            yMid
                        );
                    }

                    // Last point
                    if (lassoPathRef.current.length > 1) {
                        const last = lassoPathRef.current[lassoPathRef.current.length - 1];
                        drawCtx.lineTo(last.x, last.y);
                    }

                    drawCtx.stroke();
                }
            }
        } else if (activeTool === 'brush') {
            const lastPoint = lastPointRef.current;
            if (lastPoint) {
                drawBrushStroke(ctx, coords.x, coords.y, lastPoint.x, lastPoint.y);
            }
            lastPointRef.current = coords;
        } else if (activeTool === 'eraser') {
            const lastPoint = lastPointRef.current;
            if (lastPoint) {
                drawEraserStroke(ctx, coords.x, coords.y, lastPoint.x, lastPoint.y);
            }
            lastPointRef.current = coords;
        }
    };

    const stopDrawing = () => {
        // Notify parent that drawing ended
        onDrawingEnd?.();

        if (!isDrawingRef.current || !maskCanvasRef.current) {
            isDrawingRef.current = false;
            return;
        }

        if (activeTool === 'lasso' && lassoPathRef.current.length > 2) {
            // Save state before filling
            onSaveToUndoStack();

            const ctx = maskCanvasRef.current.getContext('2d');
            if (ctx) {
                // Fill the lasso path with mask - Kyle spec: same as brush color
                ctx.fillStyle = 'rgba(255, 70, 70, 1)';
                ctx.beginPath();
                ctx.moveTo(lassoPathRef.current[0].x, lassoPathRef.current[0].y);
                for (let i = 1; i < lassoPathRef.current.length; i++) {
                    ctx.lineTo(lassoPathRef.current[i].x, lassoPathRef.current[i].y);
                }
                ctx.closePath();
                ctx.fill();
            }

            // Clear draw canvas
            if (drawCanvasRef.current) {
                const drawCtx = drawCanvasRef.current.getContext('2d');
                if (drawCtx) {
                    drawCtx.clearRect(0, 0, drawCanvasRef.current.width, drawCanvasRef.current.height);
                }
            }

            lassoPathRef.current = [];
        }

        isDrawingRef.current = false;
        lastPointRef.current = null;
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        // Kyle spec: track global cursor position for fixed lasso icon
        setGlobalCursorPos({ x: e.clientX, y: e.clientY });

        if (maskCanvasRef.current) {
            const coords = getCanvasCoordinates(e, maskCanvasRef.current);
            setCursorPos(coords);
        }

        // Only call draw if we're actively drawing
        if (isDrawingRef.current) {
            draw(e);
        }
    };

    const handleMouseLeave = () => {
        setCursorPos(null);
        setGlobalCursorPos(null); // Kyle spec: hide lasso icon when leaving canvas
        // CRITICAL: Don't stop drawing when mouse leaves canvas - allow continuous strokes
        // Drawing should only stop on mouse up, not mouse leave
    };

    return (
        <div
            className="relative w-full h-full flex items-center justify-center"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            {/* Empty State - Fill the container */}
            {!image && (
                <div className={clsx(
                    "absolute inset-0 flex items-center justify-center cursor-pointer",
                    "border-2 border-dashed border-gray-600 rounded-lg",
                    "hover:border-gray-500 transition-colors group"
                )}
                    onClick={() => {
                        // Trigger file input if it exists in parent
                        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                        fileInput?.click();
                    }}>
                    <div className="text-center pointer-events-none">
                        <div className="mb-4">
                            <svg className="w-16 h-16 mx-auto text-gray-600 group-hover:text-gray-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <p className="text-xl font-medium text-white mb-2">
                            Drag & Drop your image
                        </p>
                        <p className="text-sm text-gray-400">or click to upload</p>
                        <p className="text-xs text-gray-500 mt-2">
                            PNG, JPG, WebP • Max 50MB
                        </p>
                    </div>

                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && file.type.startsWith('image/')) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                    const imageUrl = event.target?.result as string;
                                    if (imageUrl && onImageChange) {
                                        onImageChange(imageUrl);
                                    }
                                };
                                reader.readAsDataURL(file);
                            }
                            e.target.value = '';
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                </div>
            )}

            {/* Canvas Stack - Fill the container */}
            {image && (
                <div className="relative w-full h-full dot-grid rounded-lg overflow-hidden border border-white/10">
                    {/* ANNA FIX: Circular close icon (28-32px glass style) */}
                    <button
                        onClick={onRemoveImage}
                        className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full 
                            bg-white/10 backdrop-blur-sm border border-white/20 
                            hover:bg-white/20 transition-all
                            flex items-center justify-center group"
                        title="Remove Image"
                    >
                        <X size={16} className="text-white" strokeWidth={2} />
                    </button>

                    {/* Base Image Canvas */}
                    <canvas
                        ref={imageCanvasRef}
                        className="absolute inset-0 w-full h-full object-contain"
                    />

                    {/* Mask Overlay Canvas */}
                    <canvas
                        ref={maskCanvasRef}
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            opacity: showMask ? 0.7 : 0,
                            transition: 'opacity 0.2s'
                        }}
                    />

                    {/* Interactive Drawing Canvas */}
                    <canvas
                        ref={drawCanvasRef}
                        className="absolute inset-0 cursor-crosshair"
                        style={{
                            cursor: activeTool ? 'none' : 'default'
                        }}
                        onMouseDown={startDrawing}
                        onMouseMove={handleMouseMove}
                        onMouseUp={stopDrawing}
                        onMouseLeave={handleMouseLeave}
                    />

                    {/* Custom Cursor - Kyle spec: brush/eraser on canvas, lasso fixed globally */}
                    {cursorPos && (activeTool === 'brush' || activeTool === 'eraser') && (
                        <div
                            className="absolute pointer-events-none"
                            style={{
                                left: cursorPos.x,
                                top: cursorPos.y,
                                transform: 'translate(-50%, -50%)',
                                width: brushSize,
                                height: brushSize,
                                borderRadius: '50%',
                                // Kyle spec: 1px white stroke, semi-transparent
                                border: activeTool === 'eraser'
                                    ? '1px solid rgba(173, 216, 230, 0.9)' // light blue for eraser
                                    : '1px solid rgba(255, 255, 255, 0.7)', // white for brush
                                backgroundColor: 'transparent'
                            }}
                        />
                    )}
                </div>
            )}

            {/* Lasso Icon - same as toolbar, offset +12px right, -10px up */}
            {globalCursorPos && activeTool === 'lasso' && image && (
                <div
                    className="pointer-events-none z-50"
                    style={{
                        position: 'fixed',
                        left: globalCursorPos.x + 12,
                        top: globalCursorPos.y - 10,
                        width: 22,
                        height: 22,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))'
                    }}
                >
                    <Lasso
                        size={20}
                        color="#FFF"
                        strokeWidth={2}
                        style={{ opacity: 0.9 }}
                    />
                </div>
            )}
        </div>
    );
}
