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
    onRemoveImage
}: CanvasAreaProps) {
    const [isDragActive, setIsDragActive] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
    const [globalCursorPos, setGlobalCursorPos] = useState<{ x: number; y: number } | null>(null); // Kyle spec: for fixed lasso icon

    // For smooth brush strokes
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);

    // For lasso tool
    const lassoPathRef = useRef<{ x: number; y: number }[]>([]);

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

            // Set canvas dimensions
            const maxWidth = window.innerWidth - 300;
            const maxHeight = window.innerHeight - 400; // Reduced height for lower positioning

            let width = img.width;
            let height = img.height;

            // Scale to fit screen
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = width * ratio;
                height = height * ratio;
            }

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
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const drawBrushStroke = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, lastX?: number, lastY?: number) => {
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
    }, [brushSize]);

    const drawEraserStroke = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, lastX?: number, lastY?: number) => {
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

        ctx.globalCompositeOperation = 'source-over';
    }, [brushSize]);

    const startDrawing = (e: React.MouseEvent) => {
        if (!maskCanvasRef.current || !activeTool) return;

        const coords = getCanvasCoordinates(e, maskCanvasRef.current);

        if (activeTool === 'lasso') {
            // Start lasso path
            lassoPathRef.current = [coords];
            setIsDrawing(true);
        } else {
            // Save state before drawing
            onSaveToUndoStack();
            lastPointRef.current = coords;
            setIsDrawing(true);

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
        if (!maskCanvasRef.current || !activeTool) return;

        const coords = getCanvasCoordinates(e, maskCanvasRef.current);
        setCursorPos(coords);

        if (!isDrawing) return;

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
        if (!isDrawing || !maskCanvasRef.current) {
            setIsDrawing(false);
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

        setIsDrawing(false);
        lastPointRef.current = null;
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        // Kyle spec: track global cursor position for fixed lasso icon
        setGlobalCursorPos({ x: e.clientX, y: e.clientY });

        if (maskCanvasRef.current) {
            const coords = getCanvasCoordinates(e, maskCanvasRef.current);
            setCursorPos(coords);
        }
        draw(e);
    };

    const handleMouseLeave = () => {
        setCursorPos(null);
        setGlobalCursorPos(null); // Kyle spec: hide lasso icon when leaving canvas
        stopDrawing();
    };

    return (
        <div
            className="absolute inset-0 flex items-center justify-center pb-[200px]"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            {/* Empty State - MUCH LARGER drag area */}
            {!image && (
                <div className={clsx(
                    "w-full max-w-2xl aspect-video cursor-pointer",
                    "border-2 border-dashed rounded-2xl transition-all duration-300",
                    "flex flex-col items-center justify-center gap-4",
                    isDragActive
                        ? "bg-white/10 border-white/30 shadow-lg shadow-white/10 backdrop-blur-sm"
                        : "bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30 backdrop-blur-sm"
                )}
                    onClick={() => {
                        // Trigger file input if it exists in parent
                        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                        fileInput?.click();
                    }}>
                    {/* Upload icon */}
                    <div className="text-6xl text-gray-600">
                        ↑
                    </div>

                    {/* Text */}
                    <div className="text-center">
                        <p className="text-xl text-white font-medium mb-2">
                            Drag & Drop your image
                        </p>
                        <p className="text-sm text-gray-400">
                            or click to upload
                        </p>
                    </div>

                    {/* Supported formats */}
                    <p className="text-xs text-gray-500">
                        PNG, JPG, WebP • Max 50MB
                    </p>
                </div>
            )}

            {/* Canvas Stack */}
            {image && (
                <div className="relative rounded-xl overflow-hidden w-[90%] max-w-4xl">
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
                        className="w-full h-auto object-contain rounded-xl"
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
                        className="absolute inset-0"
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
