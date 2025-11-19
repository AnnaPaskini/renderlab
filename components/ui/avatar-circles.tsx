"use client";

import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface AvatarCirclesProps {
    className?: string;
    avatarUrls: string[];
    numPeople?: number;
    showStars?: boolean;
}

export const AvatarCircles = ({
    className,
    avatarUrls,
    numPeople,
    showStars = false,
}: AvatarCirclesProps) => {
    return (
        <div className={cn("flex flex-col items-center gap-3", className)}>
            <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                    {avatarUrls.map((url, index) => (
                        <div
                            key={index}
                            className="relative h-12 w-12 rounded-full border-2 border-neutral-900 bg-neutral-800 overflow-hidden ring-2 ring-neutral-900"
                            style={{ zIndex: avatarUrls.length - index }}
                        >
                            <img
                                src={url}
                                className="h-full w-full object-cover"
                                alt={`User ${index + 1}`}
                            />
                        </div>
                    ))}
                </div>

                {showStars && (
                    <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        ))}
                    </div>
                )}
            </div>

            {numPeople && (
                <p className="text-sm text-neutral-400">
                    Trusted by {numPeople.toLocaleString()}+ architects
                </p>
            )}
        </div>
    );
};
