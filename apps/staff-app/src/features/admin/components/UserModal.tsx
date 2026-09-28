import { useState, useEffect } from 'react';
import { X, Loader2, Eye, EyeOff } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { rbacService } from '@/services/rbac.service';
import { User } from '@/services/user.service';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    user?: User | null;
    isLoading?: boolean;
}

export function UserModal({ isOpen, onClose, onSubmit, user, isLoading = false }: UserModalProps) {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        isActive: true,
        department: '',
        roles: [] as string[],
    });

    const [showPassword, setShowPassword] = useState(false);

    const { data: dbRoles = [] } = useQuery({
        queryKey: ['roles'],
        queryFn: () => rbacService.getRoles(),
        enabled: isOpen,
    });

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || '',
                email: user.email || '',
                phone: user.phone || '',
                password: '',
                isActive: user.isActive ?? true,
                department: user.department || '',
                roles: user.roles?.map(r => typeof r === 'string' ? r : (r as any).roleName) || [],
            });
        } else {
            setFormData({
                fullName: '',
                email: '',
                phone: '',
                password: '',
                isActive: true,
                department: '',
                roles: [],
            });
        }
    }, [user, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const submitData = { ...formData };
        if (!submitData.password) {
            delete (submitData as any).password;
        }

        onSubmit(submitData);
    };

    const toggleRole = (roleName: string) => {
        setFormData(prev => ({
            ...prev,
            roles: prev.roles.includes(roleName)
                ? prev.roles.filter(r => r !== roleName)
                : [...prev.roles, roleName]
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-navy-900 rounded-2xl w-full max-w-xl shadow-xl overflow-hidden flex flex-col max-h-[95vh]">
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-navy-700">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                        {user ? 'Edit User' : 'Create New User'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto">
                    <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full px-3 py-1.5 bg-white dark:bg-navy-800 border border-slate-300 dark:border-navy-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-slate-100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-1.5 bg-white dark:bg-navy-800 border border-slate-300 dark:border-navy-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-slate-100"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Phone <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-3 py-1.5 bg-white dark:bg-navy-800 border border-slate-300 dark:border-navy-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-slate-100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Department
                                </label>
                                <input
                                    type="text"
                                    value={formData.department}
                                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                                    className="w-full px-3 py-1.5 bg-white dark:bg-navy-800 border border-slate-300 dark:border-navy-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-slate-100"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Password {user && <span className="text-slate-400 font-normal">(Leave blank to keep current)</span>} {!user && <span className="text-red-500">*</span>}
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required={!user}
                                    minLength={8}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-3 py-1.5 pr-10 bg-white dark:bg-navy-800 border border-slate-300 dark:border-navy-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-slate-100"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                            {formData.password && (
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Password length: {formData.password.length} characters
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Assign Roles <span className="text-red-500">*</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {dbRoles.map(role => (
                                    <button
                                        key={role.id}
                                        type="button"
                                        onClick={() => toggleRole(role.roleName)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${formData.roles.includes(role.roleName)
                                            ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border-cyan-300 dark:border-cyan-700'
                                            : 'bg-slate-50 dark:bg-navy-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-navy-600 hover:border-slate-300 dark:hover:border-navy-500'
                                            }`}
                                    >
                                        {role.roleName.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center pt-2">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                />
                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-300 dark:peer-focus:ring-cyan-800 rounded-full peer dark:bg-navy-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-navy-600 peer-checked:bg-cyan-500"></div>
                                <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Account Active
                                </span>
                            </label>
                        </div>
                    </form>
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-navy-700 flex justify-end gap-3 bg-slate-50 dark:bg-navy-800/50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-lg transition-colors border border-slate-300 dark:border-navy-600"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="user-form"
                        disabled={isLoading || formData.roles.length === 0}
                        className="flex items-center px-4 py-1.5 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg disabled:opacity-50 transition-colors"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {user ? 'Save Changes' : 'Create User'}
                    </button>
                </div>
            </div>
        </div>
    );
}
