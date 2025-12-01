import {
  IconAdjustmentsBolt,
  IconCloud,
  IconEaseInOut,
  IconHeart,
  IconHelp,
  IconRouteAltLeft,
  IconTerminal2,
} from "@tabler/icons-react";

export const GridFeatures = () => {
  return (
    <section className="relative py-32 overflow-hidden">

      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-purple-500" />
            <span className="text-purple-400 text-sm font-medium uppercase tracking-widest">
              Features
            </span>
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-purple-500" />
          </div>

          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Everything You Need
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Powerful tools designed specifically for architectural visualization professionals
          </p>
        </div>

        {/* Primary Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* PRICING FEATURE - PROMINENT */}
          <div className="col-span-full mb-4">
            <div className="max-w-3xl mx-auto bg-purple-900/8 shadow-lg shadow-black/20 rounded-2xl p-8 text-center">
              <h3 className="text-3xl font-bold text-white mb-4">
                Simple, Transparent Pricing
              </h3>
              <div className="text-5xl font-bold mb-4" style={{ color: '#ff6b35' }}>
                $0.3
              </div>
              <p className="text-xl text-gray-300 mb-6">
                Per render. No subscriptions. No hidden fees. Pay only for what you use.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1"><span className="text-green-400">✓</span> Cancel anytime</span>
                <span className="flex items-center gap-1"><span className="text-green-400">✓</span> No commitments</span>
                <span className="flex items-center gap-1"><span className="text-green-400">✓</span> Volume discounts available</span>
              </div>
            </div>
          </div>

          {/* Feature 1: RenderLab-Powered */}
          <div className="group relative p-8 bg-gray-900/50 shadow-lg shadow-black/20 rounded-3xl hover:scale-[1.02] overflow-hidden">
            <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10">
              <div className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20 flex items-center justify-center shadow-lg shadow-purple-500/10">
                <IconTerminal2 className="w-8 h-8 text-purple-400" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-3">
                RenderLab-Powered Rendering
              </h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Professional results in less than60 seconds. Upload, select style, generate.
              </p>

              {/* Visual Preview */}
              <div className="aspect-video bg-gray-900/50 rounded-xl border border-white/5 overflow-hidden relative group-hover:border-purple-500/20 transition-colors">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3/4 h-3/4 bg-gray-800 rounded-lg border border-white/10 flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full bg-[url('/renders/1.jpg')] bg-cover bg-center opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Templates */}
          <div className="group relative p-8 bg-gray-900/50 shadow-lg shadow-black/20 rounded-3xl hover:scale-[1.02] overflow-hidden">
            <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10">
              <div className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/20 flex items-center justify-center shadow-lg shadow-orange-500/10">
                <IconEaseInOut className="w-8 h-8 text-orange-400" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-3">
                Template Collections
              </h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                50+ curated presets for every architectural style and use case.
              </p>

              {/* Visual Preview */}
              <div className="grid grid-cols-2 gap-2">
                <div className="aspect-square rounded-lg bg-gray-800/50 border border-white/5 overflow-hidden">
                  <div className="w-full h-full bg-[url('/renders/2.jpg')] bg-cover bg-center opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="aspect-square rounded-lg bg-gray-800/50 border border-white/5 overflow-hidden">
                  <div className="w-full h-full bg-[url('/renders/3.jpg')] bg-cover bg-center opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="aspect-square rounded-lg bg-gray-800/50 border border-white/5 overflow-hidden">
                  <div className="w-full h-full bg-[url('/renders/4.jpg')] bg-cover bg-center opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="aspect-square rounded-lg bg-gray-800/50 border border-white/5 overflow-hidden flex items-center justify-center bg-gray-900">
                  <span className="text-xs text-orange-400 font-medium">+47</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3: Batch */}
          <div className="group relative p-8 bg-gray-900/50 shadow-lg shadow-black/20 rounded-3xl hover:scale-[1.02] overflow-hidden">
            <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10">
              <div className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20 flex items-center justify-center shadow-lg shadow-purple-500/10">
                <IconCloud className="w-8 h-8 text-purple-400" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-3">
                Batch Processing
              </h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Transform up to 10 renders at once!
              </p>

              {/* Visual Preview */}
              <div className="relative h-32 mt-4">
                <div className="absolute top-0 left-0 w-3/4 h-24 bg-gray-800 rounded-lg border border-white/10 transform -rotate-6 z-10 bg-[url('/renders/5.jpg')] bg-cover bg-center opacity-60" />
                <div className="absolute top-2 left-4 w-3/4 h-24 bg-gray-800 rounded-lg border border-white/10 transform -rotate-3 z-20 bg-[url('/renders/6.jpg')] bg-cover bg-center opacity-80" />
                <div className="absolute top-4 left-8 w-3/4 h-24 bg-gray-800 rounded-lg border border-white/10 transform rotate-0 z-30 bg-[url('/renders/7.jpg')] bg-cover bg-center group-hover:scale-105 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Real-time Collaboration',
              desc: 'Share and iterate instantly',
              icon: <IconRouteAltLeft className="w-6 h-6 text-purple-400" />
            },
            {
              title: 'Expert Support',
              desc: '24/7 specialist assistance',
              icon: <IconHelp className="w-6 h-6 text-orange-400" />
            },
            {
              title: 'Quality Assurance',
              desc: 'Automated checks',
              icon: <IconAdjustmentsBolt className="w-6 h-6 text-purple-400" />
            },
            {
              title: 'Version Control',
              desc: 'Track all changes',
              icon: <IconHeart className="w-6 h-6 text-orange-400" />
            },
          ].map((feature, i) => (
            <div key={i} className="group p-6 bg-gray-900/50 shadow-lg shadow-black/20 rounded-2xl hover:bg-gray-900/50 transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 mb-4 rounded-xl bg-gray-800/50 border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h4 className="font-semibold text-white mb-2 text-lg">{feature.title}</h4>
              <p className="text-sm text-gray-500 group-hover:text-gray-400 transition-colors">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
