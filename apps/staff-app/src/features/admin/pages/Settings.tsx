import { useState, useRef } from 'react';
import { User, Lock, Palette, Save, Copy, Check, Camera, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useTheme } from '@/contexts/ThemeContext';
import toast from 'react-hot-toast';
import adminLogo from '../../../assets/admin-logo.jpg';

type SettingsTab = 'profile' | 'security' | 'appearance';

export function Settings() {
    const { user } = useAuthStore();
    const { theme, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const [isSaving, setIsSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Profile settings
    const [profileData, setProfileData] = useState({
        firstName: user?.fullName?.split(' ')[0] || 'Samson',
        lastName: user?.fullName?.split(' ').slice(1).join(' ') || 'Kassahun',
        email: user?.email || 'admin@shegerbus.et',
        phone: user?.phone || '+251 911 234 567',
    });

    // Password Settings
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleProfileChange = (field: string, value: string) => {
        setProfileData(prev => ({ ...prev, [field]: value }));
    };

    const handlePasswordChange = (field: string, value: string) => {
        setPasswordData(prev => ({ ...prev, [field]: value }));
    };

    const handleThemeChange = (selectedTheme: string) => {
        if (theme !== selectedTheme) {
            toggleTheme();
        }
    };

    const copyUserId = () => {
        navigator.clipboard.writeText(user?.id || 'usr_8f9e2d3c4b5a');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('User ID copied to clipboard');
    };

    const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Simulated upload
            toast.success('Profile photo updated successfully!');
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleSave = () => {
        setIsSaving(true);
        // Simulate API call
        setTimeout(() => {
            setIsSaving(false);
            if (activeTab === 'security' && passwordData.newPassword !== passwordData.confirmPassword) {
                toast.error('Passwords do not match');
                return;
            }
            if (activeTab === 'security' && passwordData.newPassword) {
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                toast.success('Password updated successfully!');
                return;
            }
            toast.success('Settings saved successfully!');
        }, 1000);
    };

    return (
        <div className="max-w-6xl mx-auto py-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your account preferences and personal information.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all font-medium disabled:opacity-70 shadow-sm"
                >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                
                {/* Left Sidebar */}
                <div className="md:col-span-4 lg:col-span-3 space-y-6">
                    {/* User Profile Summary */}
                    <div className="flex flex-col items-center text-center">
                        <div className="relative mb-4 group cursor-pointer" onClick={triggerFileInput}>
                            <img
                                src={adminLogo}
                                alt="Profile"
                                className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-md group-hover:opacity-75 transition-opacity"
                            />
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-6 h-6 text-white" />
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={handlePhotoUpload}
                            />
                        </div>
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">{profileData.email}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Last sign in 4 minutes ago</p>

                        <div className="mt-4 flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-1 border border-gray-200 dark:border-gray-700 shadow-sm">
                            <span className="px-3 py-1 text-xs font-semibold text-gray-600 dark:text-gray-300">
                                User ID : <span className="font-normal opacity-80 pl-1">{user?.id?.slice(0, 15) || 'usr_fjei7n7...'}</span>
                            </span>
                            <button 
                                onClick={copyUserId}
                                className="ml-1 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-full px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 flex items-center transition-colors"
                            >
                                {copied ? <Check className="w-3 h-3 mr-1 text-green-500" /> : <Copy className="w-3 h-3 mr-1" />}
                                Copy
                            </button>
                        </div>
                    </div>

                    <hr className="border-gray-200 dark:border-gray-800" />

                    {/* Navigation Menu */}
                    <nav className="space-y-1">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                activeTab === 'profile'
                                    ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                            }`}
                        >
                            <User className={`w-5 h-5 mr-3 ${activeTab === 'profile' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`} />
                            Personal Information
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                activeTab === 'security'
                                    ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                            }`}
                        >
                            <Lock className={`w-5 h-5 mr-3 ${activeTab === 'security' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`} />
                            Change Password
                        </button>
                        <button
                            onClick={() => setActiveTab('appearance')}
                            className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                activeTab === 'appearance'
                                    ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                            }`}
                        >
                            <Palette className={`w-5 h-5 mr-3 ${activeTab === 'appearance' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`} />
                            Appearance
                        </button>
                    </nav>
                </div>

                {/* Right Content Area */}
                <div className="md:col-span-8 lg:col-span-9">
                    
                    {/* Personal Information Tab */}
                    {activeTab === 'profile' && (
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Personal Information</h3>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">First Name</label>
                                        <input
                                            type="text"
                                            value={profileData.firstName}
                                            onChange={(e) => handleProfileChange('firstName', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 dark:text-white font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">Last Name</label>
                                        <input
                                            type="text"
                                            value={profileData.lastName}
                                            onChange={(e) => handleProfileChange('lastName', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 dark:text-white font-medium"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">Email Address</label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                value={profileData.email}
                                                onChange={(e) => handleProfileChange('email', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 dark:text-white font-medium pr-24"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-500/20 text-xs font-semibold rounded-md">Verified</span>
                                        </div>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">Phone Number</label>
                                        <div className="relative">
                                            <input
                                                type="tel"
                                                value={profileData.phone}
                                                onChange={(e) => handleProfileChange('phone', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 dark:text-white font-medium pr-24"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-500/20 text-xs font-semibold rounded-md">Verified</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Security (Change Password) Tab */}
                    {activeTab === 'security' && (
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Change Password</h3>
                            </div>
                            <div className="p-6">
                                <div className="max-w-lg space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">Current Password</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">New Password</label>
                                        <input
                                            type="password"
                                            placeholder="Enter new password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">Confirm New Password</label>
                                        <input
                                            type="password"
                                            placeholder="Repeat new password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="pt-2">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Minimum 8 characters. Must contain at least one uppercase letter and one number for strong security.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Appearance Tab */}
                    {activeTab === 'appearance' && (
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Interface Theme</h3>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-2 gap-4 max-w-lg">
                                    {/* Light Mode Card */}
                                    <button
                                        onClick={() => handleThemeChange('light')}
                                        className={`flex flex-col items-center p-4 border-2 rounded-xl transition-all ${
                                            theme === 'light' 
                                                ? 'border-cyan-500 bg-cyan-50 dark:bg-transparent shadow-sm' 
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                    >
                                        <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-3 border border-gray-200">
                                            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                                                <Sun className="w-6 h-6 text-gray-400" />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between w-full">
                                            <span className={`font-semibold text-sm ${theme === 'light' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>Light Style</span>
                                            {theme === 'light' && <div className="w-4 h-4 bg-cyan-500 rounded-full border-2 border-white"></div>}
                                        </div>
                                    </button>

                                    {/* Dark Mode Card */}
                                    <button
                                        onClick={() => handleThemeChange('dark')}
                                        className={`flex flex-col items-center p-4 border-2 rounded-xl transition-all ${
                                            theme === 'dark' 
                                                ? 'border-cyan-500 bg-cyan-900/10 dark:bg-transparent shadow-sm' 
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                    >
                                        <div className="w-full h-24 bg-gray-900 rounded-lg flex items-center justify-center mb-3 border border-gray-700">
                                            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center shadow-sm">
                                                <Moon className="w-6 h-6 text-gray-400" />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between w-full">
                                            <span className={`font-semibold text-sm ${theme === 'dark' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>Dark Style</span>
                                            {theme === 'dark' && <div className="w-4 h-4 bg-cyan-500 rounded-full border-2 border-white dark:border-gray-900"></div>}
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
