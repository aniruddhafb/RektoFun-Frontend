"use client";

import { useState } from "react";

interface DatePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
}

export function DatePickerModal({
    isOpen,
    onClose,
    selectedDate,
    onSelectDate,
}: DatePickerModalProps) {
    const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
    const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());
    const [selectedHour, setSelectedHour] = useState(selectedDate.getHours());
    const [selectedMinute, setSelectedMinute] = useState(selectedDate.getMinutes());

    if (!isOpen) return null;

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ];

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const isSelected = (day: number) =>
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === currentMonth &&
        selectedDate.getFullYear() === currentYear;

    const isToday = (day: number) => {
        const today = new Date();
        return (
            today.getDate() === day &&
            today.getMonth() === currentMonth &&
            today.getFullYear() === currentYear
        );
    };

    const handleDateSelect = (day: number) => {
        const newDate = new Date(currentYear, currentMonth, day, selectedHour, selectedMinute);
        onSelectDate(newDate);
        onClose();
    };

    const handleConfirm = () => {
        const newDate = new Date(currentYear, currentMonth, selectedDate.getDate(), selectedHour, selectedMinute);
        onSelectDate(newDate);
        onClose();
    };

    const formatHour = (hour: number) => {
        const h = hour % 12 || 12;
        return hour < 12 ? `${h} AM` : `${h} PM`;
    };

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/20" onClick={onClose} />
            <div className="relative bg-[#f3e1d7] rounded-2xl p-6 shadow-2xl w-full max-w-sm">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => {
                            if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
                            else setCurrentMonth(currentMonth - 1);
                        }}
                        className="p-2 hover:bg-[#e8d5c8] rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <span className="font-semibold text-gray-900">{months[currentMonth]} {currentYear}</span>
                    <button
                        onClick={() => {
                            if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
                            else setCurrentMonth(currentMonth + 1);
                        }}
                        className="p-2 hover:bg-[#e8d5c8] rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                        <div key={d} className="text-center text-xs text-gray-500 font-medium py-2">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {days.map((day, index) => (
                        <div key={index} className="aspect-square">
                            {day && (
                                <button
                                    onClick={() => handleDateSelect(day)}
                                    className={`w-full h-full rounded-lg text-sm font-medium transition-colors ${isSelected(day) ? "bg-emerald-500 text-white"
                                        : isToday(day) ? "bg-amber-300 text-gray-900"
                                            : "hover:bg-[#e8d5c8] text-gray-700"
                                        }`}
                                >
                                    {day}
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Time Selection */}
                <div className="mt-4 pt-4 border-t border-[#e8d5c8]">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Select Time</label>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <select
                                value={selectedHour}
                                onChange={(e) => setSelectedHour(Number(e.target.value))}
                                className="w-full px-3 py-2 bg-[#faf0eb] border border-[#e8d5c8] rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:border-[#d4b8a8]"
                            >
                                {hours.map((h) => (
                                    <option key={h} value={h}>{formatHour(h)}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1">
                            <select
                                value={selectedMinute}
                                onChange={(e) => setSelectedMinute(Number(e.target.value))}
                                className="w-full px-3 py-2 bg-[#faf0eb] border border-[#e8d5c8] rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:border-[#d4b8a8]"
                            >
                                {minutes.map((m) => (
                                    <option key={m} value={m}>{m.toString().padStart(2, "0")}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between mt-4 pt-4 border-t border-[#e8d5c8]">
                    <button onClick={() => { onSelectDate(new Date()); onClose(); }} className="text-sm text-emerald-600 font-medium hover:text-emerald-700">Today</button>
                    <button onClick={handleConfirm} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors">Confirm</button>
                </div>
            </div>
        </div>
    );
}
