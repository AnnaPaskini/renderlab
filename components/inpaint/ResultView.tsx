'use client';

import { Download, RotateCcw, Save, X } from 'lucide-react';
import { useState } from 'react';

interface ResultViewProps {
    originalImage: string;
    resultImage: string;
    prompt: string;
    onDownload: () => void;
    onEditAgain: () => void;
    onSendToHistory: () => void;
    onClearBoard: () => void;
}

export function ResultView({
    originalImage,
    resultImage,
    prompt,
    onDownload,
    onEditAgain,
    onSendToHistory,
    onClearBoard
}: ResultViewProps) {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);

    const handleMouseDown = () => setIsDragging(true);

    const handleMouseUp = () => setIsDragging(false);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        setSliderPosition(Math.max(0, Math.min(100, percentage)));
    };

    return (
        <div className="fixed inset-0 bg-black/95 z-40 flex items-center justify-center pb-[200px]">
            {/* Main Canvas Area */}
            <div className="relative flex items-center justify-center w-[90%] max-w-4xl">
                {/* Before/After Slider Container */}
                <div
                    className="relative rounded-xl overflow-hidden w-full"
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseUp}
                    style={{ cursor: isDragging ? 'ew-resize' : 'default' }}
                >
                    {/* After Image (Result) - Full */}
                    <img
                        src={resultImage}
                        alt="Result"
                        className="w-full h-auto object-contain rounded-xl pointer-events-none select-none"
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
                            className="absolute inset-0 w-full h-full object-contain rounded-xl select-none"
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

            {/* Action Buttons - Right Side Toolbar */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3">
                {/* Download PNG */}
                <button
                    onClick={onDownload}
                    className="w-12 h-12 rounded-xl bg-[#2a2a2a] hover:bg-[#333] 
                        border border-white/10 transition-all
                        flex items-center justify-center text-white group"
                    title="Download PNG"
                >
                    <Download size={20} strokeWidth={2} />
                </button>

                {/* Edit Again */}
                <button
                    onClick={onEditAgain}
                    className="w-12 h-12 rounded-xl bg-[#2a2a2a] hover:bg-[#333] 
                        border border-white/10 transition-all
                        flex items-center justify-center text-white group"
                    title="Edit Again"
                >
                    <RotateCcw size={20} strokeWidth={2} />
                </button>

                {/* Send to History */}
                <button
                    onClick={onSendToHistory}
                    className="w-12 h-12 rounded-xl bg-[#ff6b35] hover:bg-[#ff8555] 
                        transition-all
                        flex items-center justify-center text-white group"
                    title="Send to History"
                >
                    <Save size={20} strokeWidth={2} />
                </button>

                {/* Clear Board */}
                <button
                    onClick={onClearBoard}
                    className="w-12 h-12 rounded-xl bg-[#2a2a2a] hover:bg-[#333] 
                        border border-white/10 transition-all
                        flex items-center justify-center text-white/60 hover:text-white group"
                    title="Clear Board"
                >
                    <X size={20} strokeWidth={2} />
                </button>
            </div>

            {/* Prompt Display - Bottom */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl 
                bg-[#2a2a2a] rounded-xl p-4 border border-white/10">
                <p className="text-white/60 text-xs mb-1">Prompt:</p>
                <p className="text-white text-sm">{prompt}</p>
            </div>
        </div>
    );
}
