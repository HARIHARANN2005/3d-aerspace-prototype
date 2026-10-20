import React from 'react';
import { X, Layers, Cpu, Wrench } from 'lucide-react';
import { ModelPartInfo } from '../three/models/types.ts';
import { soundFx } from '../utils/audio.ts';

interface PartDetailModalProps {
  part: ModelPartInfo | null;
  onClose: () => void;
}

export const PartDetailModal: React.FC<PartDetailModalProps> = ({ part, onClose }) => {
  if (!part) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="part-title"
      className="fixed top-20 right-4 z-40 w-80 max-w-[90vw] bg-slate-900 border border-slate-700/90 rounded-2xl p-4 shadow-2xl text-slate-200 animate-in fade-in slide-in-from-right-4 duration-200"
    >
      <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2 mb-3">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 font-semibold">
            {part.category} Assembly
          </span>
          <h2 id="part-title" className="text-sm font-bold text-white">
            {part.name}
          </h2>
        </div>
        <button
          onClick={() => {
            soundFx.playClick(600);
            onClose();
          }}
          aria-label="Close part details"
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed mb-3">
        {part.description}
      </p>

      <div className="space-y-2 bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60 text-xs font-mono">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Cpu className="w-3 h-3 text-indigo-400" />
            <span>Material:</span>
          </span>
          <span className="text-slate-200 font-sans text-right max-w-[150px] truncate" title={part.materialSpec}>
            {part.materialSpec}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-emerald-400" />
            <span>Mass / Weight:</span>
          </span>
          <span className="text-emerald-400 font-bold">
            {part.massKg < 1 ? `${(part.massKg * 1000).toFixed(1)} g` : `${part.massKg} kg`}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Wrench className="w-3 h-3 text-amber-400" />
            <span>Tolerance:</span>
          </span>
          <span className="text-amber-300">{part.tolerance}</span>
        </div>
      </div>
    </div>
  );
};
