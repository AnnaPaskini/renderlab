"use client";
import Link from "next/link";
export const CTA = () => {
  return (
    <div className="text-center max-w-2xl mx-auto space-y-6 py-20">
      <h2 className="text-4xl font-bold text-white">
        Ready to Transform Your Renders?
      </h2>
      <p className="text-xl text-gray-300">
        Join thousands of architects creating stunning visualizations in seconds.
      </p>
      <Link href="/workspace" className="inline-block">
        <button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-lg font-semibold px-12 py-4 rounded-xl transition-all duration-200 hover:scale-105 shadow-2xl shadow-orange-500/30">
          Start Free Trial
        </button>
      </Link>
      <p className="text-sm text-gray-500">
        5 free renders • No credit card required • Cancel anytime
      </p>
    </div>
  );
};
