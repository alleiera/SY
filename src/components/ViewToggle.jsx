import React from 'react';
import { LayoutGrid, List } from 'lucide-react';

const ViewToggle = ({ mode, onChange }) => {
    return (
        <div className="flex bg-[#1e1e1e] p-1 rounded-lg border border-white/10">
            <button
                onClick={() => onChange('grid')}
                className={`p-1.5 rounded-md transition-colors ${mode === 'grid'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                title="Liste Görünümü"
            >
                <List size={18} />
            </button>
            <button
                onClick={() => onChange('card')}
                className={`p-1.5 rounded-md transition-colors ${mode === 'card'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                title="Kart Görünümü"
            >
                <LayoutGrid size={18} />
            </button>
        </div>
    );
};

export default ViewToggle;
