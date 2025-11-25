import { XCircle } from "lucide-react";

export function ErrorCard() {
    return (
        <div className="flex flex-col items-center justify-center p-6 min-h-[260px] select-none">
            <XCircle className="w-10 h-10 text-red-500 mb-3 stroke-1" />

            <p className="text-red-500 font-medium text-sm">Generation failed</p>

            <p className="text-white text-xs mt-1">
                This template produced no image
            </p>
        </div>
    );
}