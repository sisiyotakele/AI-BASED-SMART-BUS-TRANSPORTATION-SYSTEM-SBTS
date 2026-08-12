import React, { useState, useEffect } from "react";
import { X, Camera, User, Phone, Mail, Check, Save, LogOut, ShieldAlert, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName?: string;
  currentEmail?: string;
  currentPhone?: string;
  currentAvatar?: string;
  isGuest?: boolean;
  onLogout?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentName = "Abebe Bikila",
  currentEmail = "abebe.bikila@example.com",
  currentPhone = "+251 91 123 4567",
  currentAvatar = "",
  isGuest = false,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [name, setName] = useState(currentName);
  const [email, setEmail] = useState(currentEmail);
  const [phone, setPhone] = useState(currentPhone);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentAvatar || null);
  const [isSaved, setIsSaved] = useState(false);

  // Synchronize state when modal opens or profile props change
  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setEmail(currentEmail);
      setPhone(currentPhone);
      setAvatarPreview(currentAvatar || null);
    }
  }, [isOpen, currentName, currentEmail, currentPhone, currentAvatar]);

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
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">Passenger Profile</h3>
            {isGuest && (
              <span className="text-[10px] font-bold text-[#12B2E4] bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full inline-block mt-0.5">
                Guest Mode Active
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden border-2 border-indigo-200 bg-indigo-50 text-indigo-700 font-extrabold text-xl shadow-xs">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{name ? name.split(" ").map((n) => n[0]).join("") : "P"}</span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-1.5 text-white rounded-full shadow-md cursor-pointer transition-transform hover:scale-105" style={{ backgroundColor: "#2B4B9E" }}>
                <Camera className="w-3.5 h-3.5" />
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Click camera icon to change photo</span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" style={{ color: "#2B4B9E" }} /> Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs font-semibold rounded-xl px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2B4B9E]/20"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" style={{ color: "#2B4B9E" }} /> Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full text-xs font-semibold rounded-xl px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2B4B9E]/20"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" style={{ color: "#2B4B9E" }} /> Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs font-semibold rounded-xl px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2B4B9E]/20"
            />
          </div>

          {/* Action Row */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-bold px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="text-white text-xs font-bold px-5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs hover:opacity-90"
                style={{ backgroundColor: "#2B4B9E" }}
              >
                {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                {isSaved ? "Saved!" : "Save Changes"}
              </button>
            </div>

            {/* ONLY SHOW LOGOUT WHEN USER IS NOT A GUEST */}
            {!isGuest ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout?.();
                }}
                className="w-full py-2.5 text-white text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:opacity-90"
                style={{ backgroundColor: "#2B4B9E" }}
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            ) : (
              <div className="bg-indigo-50/70 border border-[#2B4B9E]/20 rounded-xl p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" style={{ color: "#2B4B9E" }} />
                  <span className="text-xs font-semibold text-slate-700">Not logged in</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate("/login");
                  }}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all cursor-pointer flex items-center gap-1"
                  style={{ backgroundColor: "#2B4B9E" }}
                >
                  <LogIn className="w-3 h-3" />
                  <span>Log In</span>
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};


export default ProfileModal;