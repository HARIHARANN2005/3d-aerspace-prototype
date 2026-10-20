import React, { useState } from 'react';
import { FileSpreadsheet, X, Download, Check, ShieldCheck, Ruler, Scale } from 'lucide-react';
import { ProceduralSubject } from '../three/models/types.ts';
import { soundFx } from '../utils/audio.ts';

interface BlueprintOverlayProps {
  model: ProceduralSubject | null;
  onClose: () => void;
}

export const BlueprintOverlay: React.FC<BlueprintOverlayProps> = ({ model, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!model) return null;

  const totalMass = model.parts.reduce((acc, p) => acc + p.massKg, 0);

  const handleCopyManifest = () => {
    soundFx.playClick(900);
    const data = {
      modelId: model.id,
      modelName: model.name,
      category: model.category,
      totalParts: model.parts.length,
      totalMassKg: totalMass,
      parts: model.parts.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        material: p.materialSpec,
        massKg: p.massKg,
        tolerance: p.tolerance,
      })),
    };
    navigator.clipboard?.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="blueprint-title"
      className="fixed inset-4 sm:inset-12 z-40 bg-slate-950/95 border border-slate-700 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col text-slate-200 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-950 border border-sky-600/50 text-sky-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-sky-400 font-semibold">
              ENGINEERING TECHNICAL SPECIFICATION // BOM MANIFEST
            </div>
            <h2 id="blueprint-title" className="text-xl font-bold text-white">
              {model.name} — {model.subtitle}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyManifest}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied JSON' : 'Export JSON'}</span>
          </button>
          <button
            onClick={() => {
              soundFx.playClick(600);
              onClose();
            }}
            aria-label="Close specifications view"
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-950 text-indigo-400">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 uppercase font-mono">Calculated Mass</div>
            <div className="text-sm font-bold text-white font-mono">
              {totalMass < 1 ? `${(totalMass * 1000).toFixed(2)} g` : `${totalMass.toFixed(1)} kg`}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400">
            <Ruler className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 uppercase font-mono">Sub-Assemblies</div>
            <div className="text-sm font-bold text-emerald-400 font-mono">
              {model.parts.length} Certified Units
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-950 text-amber-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 uppercase font-mono">Domain Classification</div>
            <div className="text-sm font-bold text-amber-300 font-mono">
              {model.category}
            </div>
          </div>
        </div>
      </div>

      {/* Bill-of-Materials Table */}
      <div className="flex-1 overflow-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900 text-slate-400 uppercase font-mono sticky top-0 border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">Part ID</th>
              <th className="py-2.5 px-3">Component Name</th>
              <th className="py-2.5 px-3">Classification</th>
              <th className="py-2.5 px-3">Material Specification</th>
              <th className="py-2.5 px-3">Tolerance</th>
              <th className="py-2.5 px-3 text-right">Mass</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {model.parts.map((p, idx) => (
              <tr key={p.id} className="hover:bg-slate-900/60 transition-colors">
                <td className="py-2 px-3 text-slate-500">{`#${(idx + 1).toString().padStart(2, '0')}`}</td>
                <td className="py-2 px-3 font-sans font-semibold text-slate-100">{p.name}</td>
                <td className="py-2 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-slate-800 text-slate-300">
                    {p.category}
                  </span>
                </td>
                <td className="py-2 px-3 font-sans text-slate-300">{p.materialSpec}</td>
                <td className="py-2 px-3 text-amber-400">{p.tolerance}</td>
                <td className="py-2 px-3 text-right text-emerald-400 font-bold">
                  {p.massKg < 1 ? `${(p.massKg * 1000).toFixed(1)} g` : `${p.massKg} kg`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
