import { useState, useEffect } from 'react';

// Reusing the type definition or importing if shared
export type QuestionType =
    'MULTIPLE_CHOICE' | 'MULTIPLE_SELECT' | 'TRUE_FALSE' |
    'SHORT_ANSWER' | 'LONG_ANSWER' | 'ORDERING' |
    'MATCHING' | 'FILL_IN_BLANKS' | 'NUMERIC' | 'CODE_SNIPPET';

interface QuestionRendererProps {
    question: {
        id: number;
        text: string;
        type: QuestionType;
        structure: any; // The JSON structure
    };
    value: any;
    onChange: (value: any) => void;
}

export default function QuestionRenderer({ question, value, onChange }: QuestionRendererProps) {
    const { type, structure } = question;

    // --- Renderers ---

    if (type === 'MULTIPLE_CHOICE' || type === 'TRUE_FALSE') {
        const options = structure.options || [];
        return (
            <div className="space-y-3">
                {options.map((opt: any, idx: number) => (
                    <label key={idx} className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${value === opt.text
                            ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/30 dark:border-blue-400'
                            : 'hover:bg-gray-50 border-gray-200 dark:border-gray-700 dark:hover:bg-[#303134]'
                        }`}>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${value === opt.text ? 'border-blue-600' : 'border-gray-400'
                            }`}>
                            {value === opt.text && <div className="w-3 h-3 bg-blue-600 rounded-full" />}
                        </div>
                        <span className="text-gray-900 dark:text-gray-200">{opt.text}</span>
                        <input
                            type="radio"
                            className="hidden"
                            name={`q-${question.id}`}
                            value={opt.text}
                            checked={value === opt.text}
                            onChange={() => onChange(opt.text)}
                        />
                    </label>
                ))}
            </div>
        );
    }

    if (type === 'MULTIPLE_SELECT') {
        const options = structure.options || [];
        const currentSelection = Array.isArray(value) ? value : [];
        return (
            <div className="space-y-3">
                {options.map((opt: any, idx: number) => (
                    <label key={idx} className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${currentSelection.includes(opt.text)
                            ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/30 dark:border-blue-400'
                            : 'hover:bg-gray-50 border-gray-200 dark:border-gray-700 dark:hover:bg-[#303134]'
                        }`}>
                        <input
                            type="checkbox"
                            className="w-5 h-5 accent-blue-600"
                            checked={currentSelection.includes(opt.text)}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    onChange([...currentSelection, opt.text]);
                                } else {
                                    onChange(currentSelection.filter((v: string) => v !== opt.text));
                                }
                            }}
                        />
                        <span className="text-gray-900 dark:text-gray-200">{opt.text}</span>
                    </label>
                ))}
            </div>
        );
    }

    if (type === 'SHORT_ANSWER' || type === 'NUMERIC' || type === 'FILL_IN_BLANKS') {
        return (
            <div>
                <input
                    type={type === 'NUMERIC' ? 'number' : 'text'}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-[#303134] border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Type your answer here..."
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>
        );
    }

    if (type === 'LONG_ANSWER') {
        return (
            <div>
                <textarea
                    rows={6}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-[#303134] border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder="Type your detailed answer here..."
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>
        );
    }

    if (type === 'CODE_SNIPPET') {
        return (
            <div>
                <textarea
                    rows={10}
                    className="w-full p-4 border rounded-lg bg-gray-900 text-gray-100 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="// Write your code here..."
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>
        );
    }

    if (type === 'MATCHING') {
        // Value is an object { leftItem: rightItem }
        // We render left items and a dropdown for each
        const pairs = structure.pairs || [];
        const currentMatches = value || {};
        const rightOptions = pairs.map((p: any) => p.right).sort(); // Shuffle? ideally

        return (
            <div className="space-y-4">
                {pairs.map((pair: any, idx: number) => (
                    <div key={idx} className="flex gap-4 items-center">
                        <div className="flex-1 p-3 bg-gray-50 dark:bg-[#303134] border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-medium">
                            {pair.left}
                        </div>
                        <div className="text-gray-400">→</div>
                        <select
                            className="flex-1 p-3 border rounded-lg bg-white dark:bg-[#303134] border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={currentMatches[pair.left] || ''}
                            onChange={(e) => {
                                onChange({ ...currentMatches, [pair.left]: e.target.value });
                            }}
                        >
                            <option value="">Select match...</option>
                            {rightOptions.map((opt: string, i: number) => (
                                <option key={i} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>
        );
    }

    if (type === 'ORDERING') {
        // Value is an array of strings in order.
        // Initialize with default order if empty?
        // simple UI: Up/Down buttons
        const items = Array.isArray(value) && value.length > 0 ? value : (structure.items?.map((i: any) => i.text) || []);

        // Ensure we initialize the value if it's null, but we can't call onChange in render.
        // Handled by user initial interaction or default state in parent.

        const move = (index: number, direction: -1 | 1) => {
            const newItems = [...items];
            if (index + direction < 0 || index + direction >= newItems.length) return;
            // Swap
            [newItems[index], newItems[index + direction]] = [newItems[index + direction], newItems[index]];
            onChange(newItems);
        };

        return (
            <div className="space-y-2">
                {items.map((itemText: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-[#303134]">
                        <div className="flex flex-col gap-1">
                            <button
                                onClick={() => move(idx, -1)}
                                disabled={idx === 0}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30"
                            >
                                ▲
                            </button>
                            <button
                                onClick={() => move(idx, 1)}
                                disabled={idx === items.length - 1}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30"
                            >
                                ▼
                            </button>
                        </div>
                        <div className="flex-1 font-medium text-gray-900 dark:text-white">
                            {itemText}
                        </div>
                        <div className="text-xs font-bold text-gray-400">
                            #{idx + 1}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return <div className="text-red-500">Unknown Question Type: {type}</div>;
}
