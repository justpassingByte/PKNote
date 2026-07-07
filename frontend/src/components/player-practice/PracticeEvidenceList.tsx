export function PracticeEvidenceList({ evidence }: { evidence: string[] }) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-black/30 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Why This Focus</p>
      <div className="mt-3 space-y-2">
        {evidence.map((item, index) => (
          <p key={`${item}-${index}`} className="rounded-xl border border-gray-800 bg-[#161920] px-3 py-2 text-sm leading-relaxed text-gray-300">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

