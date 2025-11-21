"use client";


export function Companies() {
  return (
    <section className="py-12 text-center">
      <div className="text-center space-y-4">
        <div className="text-purple-400 text-sm font-medium uppercase tracking-wide">
          Trusted by Architectural Professionals
        </div>
        <div className="flex justify-center gap-12 text-white/60">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">50,000+</div>
            <div className="text-sm">Renders Created</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">10,000+</div>
            <div className="text-sm">Architects & Designers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">50+</div>
            <div className="text-sm">Countries Worldwide</div>
          </div>
        </div>
      </div>
    </section>
  );
}
