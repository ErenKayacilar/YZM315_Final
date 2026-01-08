import { useState, useEffect } from 'react';

export type QuestionType =
    'MULTIPLE_CHOICE' | 'MULTIPLE_SELECT' | 'TRUE_FALSE' |
    'SHORT_ANSWER' | 'LONG_ANSWER' | 'ORDERING' |
    'MATCHING' | 'FILL_IN_BLANKS' | 'NUMERIC' | 'CODE_SNIPPET';

interface QuestionEditorProps {
    initialData?: any;
    onSave: (data: any) => void;
    onCancel?: () => void;
}

export default function QuestionEditor({ initialData, onSave, onCancel }: QuestionEditorProps) {
    const [text, setText] = useState(initialData?.text || '');
    const [type, setType] = useState<QuestionType>(initialData?.type || 'MULTIPLE_CHOICE');
    const [structure, setStructure] = useState<any>(initialData?.structure || { options: [] });
    const [answerKey, setAnswerKey] = useState<any>(initialData?.answerKey || null);

    // Initialize defaults based on type if empty
    useEffect(() => {
        if (!initialData) {
            handleTypeChange(type);
        }
    }, []);

    const handleTypeChange = (newType: QuestionType) => {
        setType(newType);
        // Reset structure/answerKey defaults based on type
        switch (newType) {
            case 'MULTIPLE_CHOICE':
            case 'MULTIPLE_SELECT':
                setStructure({ options: [{ text: '', id: 'opt1' }, { text: '', id: 'opt2' }] });
                setAnswerKey(newType === 'MULTIPLE_CHOICE' ? '' : []);
                break;
            case 'TRUE_FALSE':
                setStructure({ options: [{ text: 'True', id: 'true' }, { text: 'False', id: 'false' }] });
                setAnswerKey('true');
                break;
            case 'SHORT_ANSWER':
            case 'NUMERIC':
            case 'LONG_ANSWER':
            case 'CODE_SNIPPET':
                setStructure({});
                setAnswerKey('');
                break;
            case 'MATCHING':
                setStructure({ pairs: [{ left: '', right: '' }, { left: '', right: '' }] });
                setAnswerKey({}); // Will store { left: right }
                break;
            case 'ORDERING':
                setStructure({ items: [{ text: '', id: 1 }, { text: '', id: 2 }] });
                setAnswerKey([]); // Will store correct order of IDs or texts
                break;
            case 'FILL_IN_BLANKS':
                setStructure({ parts: [] }); // or just text with placeholders
                setAnswerKey([]);
                break;
        }
    };

    const handleSave = () => {
        onSave({ text, type, structure, answerKey });
        // Reset form
        setText('');
        handleTypeChange('MULTIPLE_CHOICE');
    };

    // --- Renderers for specific types ---

    const renderMCQ = () => (
        <div className="space-y-2">
            {structure.options?.map((opt: any, idx: number) => (
                <div key={idx} className="flex gap-2 items-center">
                    <input
                        type={type === 'MULTIPLE_CHOICE' ? 'radio' : 'checkbox'}
                        name="correct_opt"
                        checked={type === 'MULTIPLE_CHOICE' ? answerKey === opt.text : (answerKey as string[])?.includes(opt.text)}
                        onChange={(e) => {
                            if (type === 'MULTIPLE_CHOICE') {
                                setAnswerKey(opt.text);
                            } else {
                                const current = Array.isArray(answerKey) ? [...answerKey] : [];
                                if (e.target.checked) setAnswerKey([...current, opt.text]);
                                else setAnswerKey(current.filter(k => k !== opt.text));
                            }
                        }}
                    />
                    <input
                        className="flex-1 p-2 border rounded input-google"
                        value={opt.text}
                        onChange={(e) => {
                            const newOpts = [...structure.options];
                            const oldText = newOpts[idx].text;
                            newOpts[idx].text = e.target.value;
                            setStructure({ ...structure, options: newOpts });

                            // Update answer key if text changes? Ideally use IDs, but keeping it simple with text for now
                            if (type === 'MULTIPLE_CHOICE' && answerKey === oldText) setAnswerKey(e.target.value);
                        }}
                        placeholder={`Option ${idx + 1}`}
                    />
                    <button onClick={() => {
                        const newOpts = structure.options.filter((_: any, i: number) => i !== idx);
                        setStructure({ ...structure, options: newOpts });
                    }} className="text-red-500">×</button>
                </div>
            ))}
            <button onClick={() => setStructure({ ...structure, options: [...(structure.options || []), { text: '', id: Date.now() }] })} className="text-blue-500 text-sm">
                + Add Option
            </button>
        </div>
    );

    const renderTextAnswer = () => (
        <div>
            <label className="block text-sm text-muted-foreground mb-1">Correct Answer (Optional for Long/Code)</label>
            <input
                className="w-full p-2 border rounded input-google"
                value={answerKey || ''}
                onChange={(e) => setAnswerKey(e.target.value)}
                placeholder="Enter correct answer..."
                disabled={type === 'LONG_ANSWER' || type === 'CODE_SNIPPET'}
            />
            {(type === 'LONG_ANSWER' || type === 'CODE_SNIPPET') && <p className="text-xs text-yellow-600 mt-1">Manual grading required.</p>}
        </div>
    );

    const renderMatching = () => (
        <div className="space-y-2">
            <div className="flex gap-4 font-semibold text-sm text-muted-foreground">
                <span className="flex-1">Left Item</span>
                <span className="flex-1">Right Item (Match)</span>
            </div>
            {structure.pairs?.map((pair: any, idx: number) => (
                <div key={idx} className="flex gap-2">
                    <input
                        className="flex-1 p-2 border rounded input-google"
                        value={pair.left}
                        onChange={(e) => {
                            const newPairs = [...structure.pairs];
                            newPairs[idx].left = e.target.value;
                            setStructure({ ...structure, pairs: newPairs });

                            // Update answer key assumes strict pairing
                            const newKey = { ...answerKey };
                            delete newKey[pair.left]; // remove old key
                            newKey[e.target.value] = pair.right;
                            setAnswerKey(newKey);
                        }}
                        placeholder="Key"
                    />
                    <input
                        className="flex-1 p-2 border rounded input-google"
                        value={pair.right}
                        onChange={(e) => {
                            const newPairs = [...structure.pairs];
                            newPairs[idx].right = e.target.value;
                            setStructure({ ...structure, pairs: newPairs });

                            // Update answer key
                            const newKey = { ...answerKey };
                            newKey[pair.left] = e.target.value;
                            setAnswerKey(newKey);
                        }}
                        placeholder="Value"
                    />
                    <button onClick={() => {
                        const newPairs = structure.pairs.filter((_: any, i: number) => i !== idx);
                        setStructure({ ...structure, pairs: newPairs });
                    }} className="text-red-500">×</button>
                </div>
            ))}
            <button onClick={() => setStructure({ ...structure, pairs: [...(structure.pairs || []), { left: '', right: '' }] })} className="text-blue-500 text-sm">
                + Add Pair
            </button>
        </div>
    );

    const renderOrdering = () => (
        <div className="space-y-2">
            <p className="text-sm text-gray-500">Define the correct order (Top to Bottom).</p>
            {structure.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex gap-2 items-center">
                    <span className="font-bold text-muted-foreground">{idx + 1}.</span>
                    <input
                        className="flex-1 p-2 border rounded input-google"
                        value={item.text}
                        onChange={(e) => {
                            const newItems = [...structure.items];
                            newItems[idx].text = e.target.value;
                            setStructure({ ...structure, items: newItems });

                            // Answer key is just the array of texts in order
                            setAnswerKey(newItems.map(i => i.text));
                        }}
                    />
                    <button onClick={() => {
                        const newItems = structure.items.filter((_: any, i: number) => i !== idx);
                        setStructure({ ...structure, items: newItems });
                        setAnswerKey(newItems.map((i: any) => i.text));
                    }} className="text-red-500">×</button>
                </div>
            ))}
            <button onClick={() => {
                const newItems = [...(structure.items || []), { text: '', id: Date.now() }];
                setStructure({ ...structure, items: newItems });
                setAnswerKey(newItems.map(i => i.text));
            }} className="text-blue-500 text-sm">
                + Add Item
            </button>
        </div>
    );

    return (
        <div className="p-4 border rounded card-google">
            <div className="mb-4">
                <label className="block text-sm font-bold text-foreground mb-2">Question Type</label>
                <select
                    className="w-full p-2 border rounded input-google"
                    value={type}
                    onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
                >
                    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                    <option value="MULTIPLE_SELECT">Multiple Select</option>
                    <option value="TRUE_FALSE">True / False</option>
                    <option value="SHORT_ANSWER">Short Answer</option>
                    <option value="LONG_ANSWER">Long Answer (Essay)</option>
                    <option value="ORDERING">Ordering</option>
                    <option value="MATCHING">Matching</option>
                    <option value="FILL_IN_BLANKS">Fill in Blanks</option>
                    <option value="NUMERIC">Numeric</option>
                    <option value="CODE_SNIPPET">Code Snippet</option>
                </select>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-bold text-foreground mb-2">Question Text</label>
                <textarea
                    className="w-full p-2 border rounded input-google"
                    rows={2}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter question text..."
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-bold text-foreground mb-2">Answer Setup</label>
                {type === 'MULTIPLE_CHOICE' && renderMCQ()}
                {type === 'MULTIPLE_SELECT' && renderMCQ()}
                {type === 'TRUE_FALSE' && renderMCQ()} {/* Reuse MCQ/Radio logic but fixed options */}
                {(type === 'SHORT_ANSWER' || type === 'LONG_ANSWER' || type === 'NUMERIC' || type === 'CODE_SNIPPET') && renderTextAnswer()}
                {type === 'MATCHING' && renderMatching()}
                {type === 'ORDERING' && renderOrdering()}
                {type === 'FILL_IN_BLANKS' && renderTextAnswer()} {/* Simple versions for now */}
            </div>

            <div className="flex justify-end gap-2">
                {onCancel && <button onClick={onCancel} className="px-4 py-2 text-gray-600">Cancel</button>}
                <button
                    onClick={handleSave}
                    disabled={!text}
                    className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                    Save Question
                </button>
            </div>
        </div>
    );
}
