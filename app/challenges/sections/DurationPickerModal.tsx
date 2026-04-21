"use client";

import { useState } from "react";

interface DurationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDuration: { hours: number; minutes: number };
  onSelectDuration: (duration: { hours: number; minutes: number }) => void;
}

export function DurationPickerModal({
  isOpen,
  onClose,
  selectedDuration,
  onSelectDuration,
}: DurationPickerModalProps) {
  const [hours, setHours] = useState(selectedDuration.hours);
  const [minutes, setMinutes] = useState(selectedDuration.minutes);

  if (!isOpen) return null;

  const maxHours = 7 * 24;

  const formatDuration = () => {
    if (hours === 0 && minutes === 0) return "Select duration";
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    let result = "";
    if (days > 0) result += `${days}d `;
    if (remainingHours > 0) result += `${remainingHours}h `;
    if (minutes > 0) result += `${minutes}m`;
    return result.trim();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-[#f3e1d7] rounded-2xl p-6 shadow-2xl w-full max-w-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Challenge Duration</h3>
        <p className="text-sm text-gray-600 text-center mb-6">Max duration: 7 days</p>
        <div className="bg-[#faf0eb] rounded-xl p-4 mb-6 text-center">
          <span className="text-2xl font-bold text-gray-900">{formatDuration()}</span>
        </div>
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Hours</label>
          <div className="flex items-center gap-3">
            <button onClick={() => hours > 0 && setHours(hours - 1)} className="w-10 h-10 rounded-lg bg-[#e8d5c8] hover:bg-[#dcc9bc] flex items-center justify-center text-gray-700 font-bold">-</button>
            <input type="number" value={hours} onChange={(e) => { const v = Number(e.target.value); if (v >= 0 && v <= maxHours) setHours(v); }} className="flex-1 text-center py-2 bg-[#faf0eb] border border-[#e8d5c8] rounded-lg text-lg font-semibold" min={0} max={maxHours} />
            <button onClick={() => hours < maxHours && setHours(hours + 1)} className="w-10 h-10 rounded-lg bg-[#e8d5c8] hover:bg-[#dcc9bc] flex items-center justify-center text-gray-700 font-bold">+</button>
          </div>
        </div>
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Minutes</label>
          <div className="flex items-center gap-3">
            <button onClick={() => minutes >= 5 && setMinutes(minutes - 5)} className="w-10 h-10 rounded-lg bg-[#e8d5c8] hover:bg-[#dcc9bc] flex items-center justify-center text-gray-700 font-bold">-</button>
            <input type="number" value={minutes} onChange={(e) => { const v = Number(e.target.value); if (v >= 0 && v < 60) setMinutes(v); }} className="flex-1 text-center py-2 bg-[#faf0eb] border border-[#e8d5c8] rounded-lg text-lg font-semibold" min={0} max={59} step={5} />
            <button onClick={() => minutes < 55 && setMinutes(minutes + 5)} className="w-10 h-10 rounded-lg bg-[#e8d5c8] hover:bg-[#dcc9bc] flex items-center justify-center text-gray-700 font-bold">+</button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[15, 30, 60, 120, 240, 480].map((mins) => (
            <button key={mins} onClick={() => { setHours(Math.floor(mins / 60)); setMinutes(mins % 60); }} className="py-2 px-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-lg text-sm font-medium text-gray-700 hover:bg-[#e8d5c8] transition-colors">
              {mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h`}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-[#e8d5c8] rounded-xl text-gray-700 font-medium hover:bg-[#dcc9bc] transition-colors">Cancel</button>
          <button onClick={() => { onSelectDuration({ hours, minutes }); onClose(); }} className="flex-1 py-3 bg-emerald-500 rounded-xl text-white font-medium hover:bg-emerald-600 transition-colors">Confirm</button>
        </div>
      </div>
    </div>
  );
}