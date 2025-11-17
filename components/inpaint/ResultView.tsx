'use client';

import { useEffect, useRef, useState } from 'react';

interface ResultViewProps {
    originalImage: string;
    resultImage: string;
    prompt: string;
    onDownload: () => void;
    onEditAgain: () => void;
    onSendToHistory: () => void;
    onClearBoard: () => void;
    maskBounds?: { x: number; y: number; width: number; height: number };
}

export function ResultView({
    originalImage,
    resultImage,
    prompt,
    onDownload,
    onEditAgain,
    onSendToHistory,
    onClearBoard,
    maskBounds
}: ResultViewProps) {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const sliderRef = useRef<HTMLDivElement>(null);

    // FIX #4: Fix slider sticking at edges with document-level events
    const updateSliderPosition = (clientX: number) => {
        if (!sliderRef.current) return;

        const rect = sliderRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const percentage = (x / rect.width) * 100;

        setSliderPosition(Math.max(0, Math.min(100, percentage)));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        updateSliderPosition(e.clientX);
    };

    useEffect(() => {
        if (!isDragging) return;

        // Prevent text selection during drag
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';

        const handleMouseMove = (e: MouseEvent) => {
            e.preventDefault();
            updateSliderPosition(e.clientX);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            // Restore text selection
            document.body.style.userSelect = '';
            document.body.style.webkitUserSelect = '';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            // Ensure cleanup
            document.body.style.userSelect = '';
            document.body.style.webkitUserSelect = '';
        };
    }, [isDragging]);

    return (
        // FIX: Fill the entire container like CanvasArea does
        <div className="relative w-full h-full dot-grid rounded-lg overflow-hidden border border-white/10">
            {/* Before/After Slider Container */}
            <div
                ref={sliderRef}
                className="relative w-full h-full"
                onMouseDown={handleMouseDown}
                style={{ cursor: isDragging ? 'ew-resize' : 'default' }}
            >
                {/* After Image (Result) - Full */}
                <img
                    src={resultImage}
                    alt="Result"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                    draggable={false}
                />

                {/* Before Image (Original) - Clipped Overlay */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
                        willChange: 'clip-path'
                    }}
                >
                    <img
                        src={originalImage}
                        alt="Original"
                        className="absolute inset-0 w-full h-full object-contain select-none"
                        draggable={false}
                    />
                </div>

                {/* Slider Divider Line */}
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white/90 shadow-lg pointer-events-none"
                    style={{
                        left: `${sliderPosition}%`,
                        willChange: 'left'
                    }}
                >
                    {/* Slider Handle */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                            w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center
                            cursor-ew-resize pointer-events-auto">
                        <div className="flex gap-1">
                            <div className="w-0.5 h-3 bg-gray-800"></div>
                            <div className="w-0.5 h-3 bg-gray-800"></div>
                        </div>
                    </div>
                </div>

                {/* Labels */}
                <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-md text-white text-xs font-medium pointer-events-none">
                    Before
                </div>
                <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-md text-white text-xs font-medium pointer-events-none">
                    After
                </div>
            </div>
        </div>
    );
}
