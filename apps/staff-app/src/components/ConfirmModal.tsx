import { AlertTriangle, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDanger?: boolean;
}

export function ConfirmModal({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    isDanger = true
}: ConfirmModalProps) {
    const [renderState, setRenderState] = useState<'hidden' | 'entering' | 'visible' | 'exiting'>('hidden');

    useEffect(() => {
        if (isOpen) {
            setRenderState('entering');
            const timer = setTimeout(() => setRenderState('visible'), 10);
            return () => clearTimeout(timer);
        } else if (renderState !== 'hidden') {
            setRenderState('exiting');
            const timer = setTimeout(() => setRenderState('hidden'), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (renderState === 'hidden') return null;

    const isVisible = renderState === 'visible';
    
    // Smooth transition logic
    const overlayOpacity = isVisible ? "opacity-100" : "opacity-0";
    const modalTransform = isVisible 
        ? "scale-100 translate-y-0 opacity-100" 
        : "scale-95 translate-y-4 opacity-0";

    const config = isDanger 
        ? {
            iconBg: "bg-red-100 dark:bg-red-900/30",
            iconColor: "text-red-500 dark:text-red-400",
            ringColors: "ring-red-50 dark:ring-red-900/10",
            btnPrimary: "bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg shadow-red-500/20",
            Icon: AlertTriangle
        }
        : {
            iconBg: "bg-cyan-100 dark:bg-cyan-900/30",
            iconColor: "text-cyan-500 dark:text-cyan-400",
            ringColors: "ring-cyan-50 dark:ring-cyan-900/10",
            btnPrimary: "bg-cyan-500 hover:bg-cyan-600 text-white shadow-md hover:shadow-lg shadow-cyan-500/20",
            Icon: Info
        };

    const IconWrapper = config.Icon;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 overflow-hidden perspective-[1000px]">
            {/* Soft, clean overlay */}
            <div 
                className={`absolute inset-0 bg-slate-900/30 dark:bg-slate-950/60 backdrop-blur-[2px] transition-all duration-300 ease-out ${overlayOpacity}`}
                onClick={onCancel}
            />

            {/* Clean, professional modal container */}
            <div 
                className={`relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden flex flex-col ${modalTransform}`}
            >
                {/* Decorative header block */}
                <div className="h-32 w-full bg-slate-50 dark:bg-slate-800/50 relative overflow-hidden flex items-center justify-center">
                    {/* Abstract background blobs for visual interest without being overwhelming */}
                    <div className={`absolute -top-10 -left-10 w-40 h-40 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-2xl opacity-50 ${config.iconBg}`} />
                    <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-2xl opacity-50 ${config.iconBg}`} />
                    
                    <button 
                        onClick={onCancel}
                        className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-black/5 dark:hover:bg-white/10 transition-colors z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Centered Icon with gentle pulsing rings */}
                    <div className="relative group mt-6">
                        <div className={`absolute inset-0 rounded-full ${config.iconBg} animate-[ping_2.5s_ease-in-out_infinite] opacity-40`} />
                        <div className={`relative flex items-center justify-center w-16 h-16 rounded-full ${config.iconBg} ring-8 ${config.ringColors} shadow-sm z-10`}>
                            <IconWrapper className={`w-8 h-8 ${config.iconColor}`} strokeWidth={2.5} />
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-8 pt-6 pb-8 text-center flex-1">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                        {title}
                    </h3>
                    
                    <p className="text-[0.95rem] text-slate-500 dark:text-slate-400 leading-relaxed font-medium px-2">
                        {message}
                    </p>
                </div>

                {/* Footer Actions */}
                <div className="px-8 pb-8 pt-2 flex gap-3 flex-col sm:flex-row w-full justify-center">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 px-6 py-3 text-[0.95rem] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800 transition-all active:scale-[0.97]"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`flex-1 px-6 py-3 text-[0.95rem] font-semibold rounded-2xl focus:outline-none focus:ring-4 transition-all active:scale-[0.97] border border-transparent ${config.btnPrimary}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
