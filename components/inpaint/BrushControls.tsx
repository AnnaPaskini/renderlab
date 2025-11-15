'use client';

import { motion } from 'framer-motion';

interface BrushControlsProps {
    brushSize: number;
    setBrushSize: (size: number) => void;
}

export function BrushControls({ brushSize, setBrushSize }: BrushControlsProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute left-24 top-1/2 -translate-y-1/2 z-10"
        >
            <div className="bg-[#2a2a2a] rounded-2xl border border-white/10 p-4 
        shadow-[0_8px_32px_rgba(0,0,0,0.6)] min-w-[200px]">

                {/* Title */}
                <div className="text-white text-sm font-medium mb-3">
                    Brush Size
                </div>

                {/* Slider */}
                <div className="flex items-center gap-3">
                    <input
                        type="range"
                        min="10"
                        max="200"
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-moz-range-thumb]:w-4
              [&::-moz-range-thumb]:h-4
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-white
              [&::-moz-range-thumb]:border-0
              [&::-moz-range-thumb]:cursor-pointer"
                    />
                    <span className="text-white text-sm font-medium min-w-[40px] text-right">
                        {brushSize}px
                    </span>
                </div>

                {/* Quick Size Presets */}
                <div className="flex items-center gap-2 mt-4">
                    <button
                        onClick={() => setBrushSize(20)}
                        className={`px-3 py-1 rounded-lg text-xs transition-colors ${brushSize === 20
                            ? 'bg-white text-black'
                            : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
                            }`}>
                        Small
                    </button>
                    <button
                        onClick={() => setBrushSize(60)}
                        className={`px-3 py-1 rounded-lg text-xs transition-colors ${brushSize === 60
                            ? 'bg-white text-black'
                            : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
                            }`}>
                        Medium
                    </button>
                    <button
                        onClick={() => setBrushSize(120)}
                        className={`px-3 py-1 rounded-lg text-xs transition-colors ${brushSize === 120
                            ? 'bg-white text-black'
                            : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
                            }`}>
                        Large
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
