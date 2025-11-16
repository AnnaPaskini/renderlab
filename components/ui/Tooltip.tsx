'use client';

import { useState } from 'react';

interface TooltipProps {
    text: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip = ({ text, children, position = 'bottom' }: TooltipProps) => {
    const [show, setShow] = useState(false);

    const positions = {
        top: '-top-12 left-1/2 -translate-x-1/2',
        bottom: '-bottom-12 left-1/2 -translate-x-1/2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-3',
        right: 'left-full top-1/2 -translate-y-1/2 ml-3'
    };

    const arrows = {
        top: 'bottom-0 translate-y-1/2 left-1/2 -translate-x-1/2 rotate-45',
        bottom: 'top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 rotate-45',
        left: 'right-0 translate-x-1/2 top-1/2 -translate-y-1/2 rotate-45',
        right: 'left-0 -translate-x-1/2 top-1/2 -translate-y-1/2 rotate-45'
    };

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            {children}

            {show && (
                <div
                    className={`absolute ${positions[position]} z-[100] pointer-events-none
            animate-fadeIn`}
                >
                    <div className="relative px-3 py-2 bg-[#2a2a2a] text-white text-xs font-medium
            rounded-lg border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.6)]
            whitespace-nowrap backdrop-blur-sm">
                        {text}

                        {/* Arrow */}
                        <div className={`absolute ${arrows[position]} w-2 h-2 bg-[#2a2a2a]
              border-white/10 ${position === 'bottom' || position === 'right' ? 'border-l border-t' : 'border-r border-b'}`}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};