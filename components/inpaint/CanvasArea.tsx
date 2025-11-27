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
    onCanvasSizeChange?: (size: { width: number; height: number }) => void;
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
    onDrawingEnd,
    onCanvasSizeChange
}: CanvasAreaProps) {
    const [isDragActive, setIsDragActive] = useState(false);
    const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
    const [globalCursorPos, setGlobalCursorPos] = useState<{ x: number; y: number } | null>(null); // Kyle spec: for fixed lasso icon
    const [canvasSize, setCanvasSize] = useState({ width: 1024, height: 1024 });
    const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number } | null>(null);

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

        console.log('File dropped:', e.dataTransfer.files);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            console.log('Dropped file:', file.name, file.type, file.size);
            const maxSize = 100 * 1024 * 1024; // 100MB
            if (file.size > maxSize) {
                console.error('Dropped file too large:', file.size, 'max:', maxSize);
                alert('File size must be less than 100MB');
                return;
            }
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const imageUrl = event.target?.result as string;
                    console.log('Dropped file read successfully, URL length:', imageUrl?.length);
                    if (imageUrl && onImageChange) {
                        onImageChange(imageUrl);
                    } else {
                        console.error('No imageUrl or onImageChange for dropped file');
                    }
                };
                reader.onerror = (error) => {
                    console.error('FileReader error for dropped file:', error);
                };
                reader.readAsDataURL(file);
            } else {
                console.error('Dropped file is not an image:', file.type);
                alert('Please drop an image file');
            }
        } else {
            console.log('No file in drop');
        }
    }, [onImageChange]);

    // Load image onto canvas when image changes
    useEffect(() => {
        if (!image || !imageCanvasRef.current || !maskCanvasRef.current || !drawCanvasRef.current) return;

        const img = new Image();
        img.crossOrigin = 'anonymous';  // Fix CORS for canvas export
        img.onload = () => {
            const imageCanvas = imageCanvasRef.current;
            const maskCanvas = maskCanvasRef.current;
            const drawCanvas = drawCanvasRef.current;

            // Null guard: check if canvas refs are still valid
            if (!imageCanvas || !maskCanvas || !drawCanvas) return;

            // Вычисляем размер canvas с сохранением aspect ratio
            const MAX_SIZE = 1024;
            let width = img.width;
            let height = img.height;

            // Масштабируем если изображение больше MAX_SIZE
            if (width > MAX_SIZE || height > MAX_SIZE) {
                const aspectRatio = width / height;

                if (width > height) {
                    width = MAX_SIZE;
                    height = MAX_SIZE / aspectRatio;
                } else {
                    height = MAX_SIZE;
                    width = MAX_SIZE * aspectRatio;
                }
            }

            // Округляем до целых чисел
            width = Math.round(width);
            height = Math.round(height);

            // Устанавливаем размер ВСЕХ canvas
            imageCanvas.width = width;
            imageCanvas.height = height;
            maskCanvas.width = width;
            maskCanvas.height = height;
            drawCanvas.width = width;
            drawCanvas.height = height;

            // Рисуем изображение без растягивания
            const imgCtx = imageCanvas.getContext("2d");
            if (imgCtx) {
                imgCtx.drawImage(img, 0, 0, width, height);
            }

            // Сохраняем размеры для отправки на API
            setCanvasSize({ width, height });
            // Save dimensions for container aspect ratio
            setCanvasDimensions({ width: Math.round(width), height: Math.round(height) });
            if (onCanvasSizeChange) {
                onCanvasSizeChange({ width, height });
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
                    "border-2 border-dashed rounded-2xl transition-all duration-300",
                    isDragActive ? "bg-black/50 border-white/20 shadow-[0_0_0_1px_rgba(220,220,225,0.6),0_0_4px_rgba(220,220,225,0.2)]" : "bg-black/50 border-white/12 hover:bg-black/60 hover:border-white/20 hover:shadow-[0_0_0_1px_rgba(220,220,225,0.4),0_0_2px_rgba(220,220,225,0.1)]"
                )}>
                    <div className="text-center pointer-events-none">
                        <div className="mb-4">
                            <svg className="w-16 h-16 mx-auto text-purple-400/30 group-hover:text-purple-400/50 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <p className="text-xl font-medium text-white mb-2">
                            Drag & Drop your image
                        </p>
                        <p className="text-sm text-purple-400/70">or click to upload</p>
                        <p className="text-xs text-purple-400/50 mt-2">
                            PNG, JPG, WebP • Max 100MB
                        </p>
                    </div>

                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            console.log('File input changed:', e.target.files);
                            const file = e.target.files?.[0];
                            if (file) {
                                console.log('File selected:', file.name, file.type, file.size);
                                const maxSize = 100 * 1024 * 1024; // 100MB
                                if (file.size > maxSize) {
                                    console.error('File too large:', file.size, 'max:', maxSize);
                                    alert('File size must be less than 100MB');
                                    e.target.value = '';
                                    return;
                                }
                                if (file.type.startsWith('image/')) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                        const imageUrl = event.target?.result as string;
                                        console.log('File read successfully, URL length:', imageUrl?.length);
                                        if (imageUrl && onImageChange) {
                                            onImageChange(imageUrl);
                                        } else {
                                            console.error('No imageUrl or onImageChange');
                                        }
                                    };
                                    reader.onerror = (error) => {
                                        console.error('FileReader error:', error);
                                    };
                                    reader.readAsDataURL(file);
                                } else {
                                    console.error('File is not an image:', file.type);
                                    alert('Please select an image file');
                                }
                            } else {
                                console.log('No file selected');
                            }
                            e.target.value = '';
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                </div>
            )}

            {/* Canvas Stack - Fill the container */}
            {image && (
                <div
                    className="relative dot-grid rounded-lg overflow-hidden border border-white/10 mx-auto"
                    style={canvasDimensions ? {
                        width: '100%',
                        maxWidth: canvasDimensions.width,
                        aspectRatio: `${canvasDimensions.width} / ${canvasDimensions.height}`
                    } : { width: '100%', height: '100%' }}
                >
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
                        className="absolute inset-0 w-full h-full"
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
                                    ? '1px solid rgba(192, 132, 252, 0.9)' // purple for eraser
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
