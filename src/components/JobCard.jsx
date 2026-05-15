import React from 'react';
import { Clock, Factory, User, Hash, AlertCircle, CheckCircle, XCircle, Calendar, Package } from 'lucide-react';

const JobCard = ({ data, type = 'schedule' }) => {
    // Helper to get status config
    const getStatusConfig = (status) => {
        switch (status) {
            case 'Üretimde': return { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' };
            case 'Planlandı': return { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
            case 'Gecikmiş': return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }; // Used for delays
            case 'Beklemede': return { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' };
            case 'OK': return { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' };
            case 'Hurda': return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' };
            case 'Rework': return { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' };
            default: return { color: 'text-gray-400', bg: 'bg-white/5', border: 'border-white/10' };
        }
    };

    const statusVal = type === 'schedule' ? data.status : data.quality;
    const config = getStatusConfig(statusVal);

    // Derived values
    const mainTitle = data.product;
    const subTitle = data.customer;
    const machineOrOp = type === 'schedule' ? data.machine : data.operator;
    const extraInfoLabel = type === 'schedule' ? 'TESLİM' : 'SÜRE';
    const extraInfoVal = type === 'schedule' ? data.dueDate : data.duration;

    return (
        <div className={`
            group relative bg-[#222] border border-white/5 p-3 rounded-xl 
            hover:border-[#137fec]/30 hover:bg-[#262626] transition-all 
            flex items-center justify-between gap-4 w-full
        `}>
            {/* Active Line (Left) */}
            <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${config.bg.replace('/10', '')} opacity-60`}></div>

            {/* Left Section: ID & Icon */}
            <div className="flex items-center gap-3 min-w-[120px]">
                <div className={`p-2 rounded-lg ${config.bg} ${config.color}`}>
                    <Hash size={16} />
                </div>
                <div>
                    <div className="text-[10px] text-white/30 font-bold tracking-wider">İŞ EMRİ</div>
                    <div className="text-sm font-bold text-white font-mono">{data.id}</div>
                </div>
            </div>

            {/* Middle Section: Main Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-white truncate">{mainTitle}</h3>
                    <span className="text-[10px] text-white/30">•</span>
                    <span className="text-xs text-white/50 truncate max-w-[150px]">{subTitle}</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[10px] text-white/40 font-bold uppercase bg-black/20 px-2 py-0.5 rounded">
                        <Package size={10} />
                        <span>{data.quantity} ADET</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-white/40 font-bold uppercase bg-black/20 px-2 py-0.5 rounded">
                        {type === 'schedule' ? <Factory size={10} /> : <User size={10} />}
                        <span>{machineOrOp}</span>
                    </div>
                </div>
            </div>

            {/* Right Section: Date & Status */}
            <div className="flex items-center gap-4 text-right">
                <div>
                    <div className="text-[10px] text-white/30 font-bold tracking-wider">{extraInfoLabel}</div>
                    <div className="text-xs font-bold text-white/70">{extraInfoVal}</div>
                </div>

                <div className={`px-2.5 py-1 rounded text-[10px] font-black tracking-wide border ${config.bg} ${config.color} ${config.border}`}>
                    {statusVal}
                </div>
            </div>
        </div>
    );
};

export default JobCard;
