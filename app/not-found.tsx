import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#0a0a0a] relative">
            {/* Purple glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-md">
                {/* Logo */}
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-8 text-2xl font-bold text-white mx-auto shadow-lg shadow-orange-500/20">
                    R
                </div>

                <h1 className="text-3xl font-semibold text-white mb-3">
                    Page not found
                </h1>

                <p className="text-neutral-400 mb-8 leading-relaxed">
                    The page you're looking for doesn't exist or has been moved.
                </p>

                {/* Links */}
                <div className="flex flex-col gap-4">
                    <Link
                        href="/workspace"
                        className="text-white hover:text-orange-400 transition-colors font-medium"
                    >
                        Go to Workspace
                    </Link>

                    <Link
                        href="/"
                        className="text-neutral-400 hover:text-white transition-colors"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
