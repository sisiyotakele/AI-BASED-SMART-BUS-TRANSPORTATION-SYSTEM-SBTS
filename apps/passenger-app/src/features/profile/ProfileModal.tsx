// src/features/profile/ProfileModal.tsx
import React, { useState } from "react";
import { X, Camera, User, Phone, Mail, Moon, Sun, Check, Save } from "lucide-react";

export interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName?: string;
  currentEmail?: string;
  currentPhone?: string;
  currentAvatar?: string;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentName = "Abebe Bikila",
  currentEmail = "abebe.bikila@example.com",
  currentPhone = "+251 91 123 4567",
  currentAvatar = "",
  isDarkMode = false,
  onToggleTheme,
}) => {
  const [name, setName] = useState(currentName);
  const [email, setEmail] = useState(currentEmail);
  const [phone, setPhone] = useState(currentPhone);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentAvatar || null);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setAvatarPreview(imageUrl);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className={`w-full max-w-md rounded-2xl border shadow-xl transition-all ${
        isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isDarkMode ? "border-slate-800" : "border-slate-100"
        }`}>
          <h3 className="font-extrabold text-sm sm:text-base">Passenger Profile & Settings</h3>
          <button
            onClick={onClose}
            type="button"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDarkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="relative group">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center overflow-hidden border-2 font-bold text-xl ${
                isDarkMode ? "bg-indigo-950/80 border-indigo-500/50 text-indigo-300" : "bg-indigo-50 border-indigo-200 text-indigo-700"
              }`}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{name.split(" ").map((n) => n[0]).join("")}</span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-md cursor-pointer transition-transform hover:scale-105">
                <Camera className="w-3.5 h-3.5" />
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Click camera icon to change photo</span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-500" /> Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full text-xs font-semibold rounded-xl px-3 py-2 border focus:outline-none ${
                isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
              }`}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-indigo-500" /> Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`w-full text-xs font-semibold rounded-xl px-3 py-2 border focus:outline-none ${
                isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
              }`}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-500" /> Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full text-xs font-semibold rounded-xl px-3 py-2 border focus:outline-none ${
                isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
              }`}
            />
          </div>

          {/* Theme Row */}
          <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
            isDarkMode ? "bg-slate-800/60 border-slate-700" : "bg-slate-50 border-slate-200"
          }`}>
            <div className="flex items-center gap-2">
              {isDarkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <div>
                <span className="text-xs font-bold block leading-none">Theme Mode</span>
                <span className="text-[10px] text-slate-400 font-medium">{isDarkMode ? "Dark Theme" : "Light Theme"}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleTheme}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                isDarkMode ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-800"
              }`}
            >
              Toggle Mode
            </button>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`text-xs font-bold px-4 py-2 rounded-xl border cursor-pointer ${
                isDarkMode ? "border-slate-700 text-slate-300" : "border-slate-200 text-slate-600"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {isSaved ? "Saved!" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;