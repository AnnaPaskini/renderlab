'use client';

import { Download } from 'lucide-react';

interface TopControlsProps {
    onDownload?: () => void;
}

export function TopControls({ onDownload }: TopControlsProps) {
    return (
        <div className="absolute top-6 right-6 z-10">
            {/* Download button only */}
            <button
                onClick={onDownload}
                className="w-9 h-9 rounded-lg bg-[#1a1a1a] hover:bg-white/10 
                    flex items-center justify-center text-white transition-colors
                    border border-white/10"
                title="Download result">
                <Download size={18} />
            </button>
        </div>
    );
}
