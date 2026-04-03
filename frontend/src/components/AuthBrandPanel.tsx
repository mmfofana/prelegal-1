const FEATURES = [
  "AI-guided document drafting",
  "12 legal document templates",
  "Editable document history",
  "Download as PDF instantly",
];

export function AuthBrandPanel() {
  return (
    <div className="hidden md:flex w-1/2 bg-[#032147] flex-col justify-center px-12 py-16">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-white mb-3">
          <span className="text-[#ecad0a]">Pre</span>legal
        </h1>
        <p className="text-xl text-gray-300 leading-relaxed">
          Legal documents, drafted by AI.
        </p>
      </div>

      <ul className="space-y-4">
        {FEATURES.map((feature) => (
          <li key={feature} className="flex items-center gap-3 text-gray-200 text-sm">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#ecad0a]/20 flex items-center justify-center">
              <span className="text-[#ecad0a] text-xs font-bold">✓</span>
            </span>
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-12 pt-8 border-t border-white/10">
        <p className="text-xs text-gray-500">
          Templates from Common Paper · CC BY 4.0
        </p>
      </div>
    </div>
  );
}
