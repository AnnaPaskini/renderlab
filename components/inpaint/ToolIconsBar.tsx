'use client';

import { Eraser, Lasso, Paintbrush, Redo, Trash2, Undo } from 'lucide-react';

type Tool = 'brush' | 'eraser' | 'lasso' | null;

interface ToolIconsBarProps {
    activeTool: Tool;
    setActiveTool: (tool: Tool) => void;
    onUndo: () => void;
    onRedo: () => void;
    onClearMask: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

export function ToolIconsBar({
    activeTool,
    setActiveTool,
    onUndo,
    onRedo,
    onClearMask,
    canUndo,
    canRedo
}: ToolIconsBarProps) {
    return (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
            <div className="bg-[#2a2a2a] rounded-2xl border border-white/10 p-2 
        shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col gap-2">

                {/* Brush Tool */}
                <button
                    onClick={() => setActiveTool('brush')}
                    className={`w-12 h-12 rounded-lg flex items-center justify-center 
            transition-colors ${activeTool === 'brush'
                            ? 'bg-white text-black'
                            : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                        }`}
                    title="Brush Tool">
                    <Paintbrush size={20} />
                </button>

                {/* Eraser Tool */}
                <button
                    onClick={() => setActiveTool('eraser')}
                    className={`w-12 h-12 rounded-lg flex items-center justify-center 
            transition-colors ${activeTool === 'eraser'
                            ? 'bg-white text-black'
                            : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                        }`}
                    title="Eraser">
                    <Eraser size={20} />
                </button>

                {/* Lasso Tool */}
                <button
                    onClick={() => setActiveTool('lasso')}
                    className={`w-12 h-12 rounded-lg flex items-center justify-center 
            transition-colors ${activeTool === 'lasso'
                            ? 'bg-white text-black'
                            : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                        }`}
                    title="Lasso">
                    <Lasso size={20} />
                </button>

                {/* Divider */}
                <div className="h-px bg-white/10 my-1" />

                {/* Undo */}
                <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className={`w-12 h-12 rounded-lg flex items-center justify-center 
            transition-colors ${!canUndo
                            ? 'text-gray-400/30 cursor-not-allowed'
                            : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                        }`}
                    title="Undo">
                    <Undo size={20} />
                </button>

                {/* Redo */}
                <button
                    onClick={onRedo}
                    disabled={!canRedo}
                    className={`w-12 h-12 rounded-lg flex items-center justify-center 
            transition-colors ${!canRedo
                            ? 'text-gray-400/30 cursor-not-allowed'
                            : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                        }`}
                    title="Redo">
                    <Redo size={20} />
                </button>

                {/* Divider */}
                <div className="h-px bg-white/10 my-1" />

                {/* Clear All */}
                <button
                    onClick={onClearMask}
                    className="w-12 h-12 rounded-lg flex items-center justify-center 
            text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-colors"
                    title="Clear Mask">
                    <Trash2 size={20} />
                </button>
            </div>
        </div>
    );
}
