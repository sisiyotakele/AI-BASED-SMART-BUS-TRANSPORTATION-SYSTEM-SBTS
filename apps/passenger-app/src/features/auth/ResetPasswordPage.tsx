import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";

export const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const response = await api.post("/auth/reset-password", { token: params.get("token"), password });
      setMessage(response.data?.message || "Password reset successful.");
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "This reset link is invalid or expired.");
    }
  };

  return <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
    <form onSubmit={submit} className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-5">
      <div><h1 className="text-2xl font-black text-slate-900">Create a new password</h1><p className="text-sm text-slate-500 mt-1">Choose a secure password for your Sheger Bus account.</p></div>
      {message && <p className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-semibold">{message}</p>}
      {error && <p className="p-3 rounded-xl bg-rose-50 text-rose-700 text-sm font-semibold">{error}</p>}
      <input required type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password" className="w-full px-4 py-3 rounded-xl border border-slate-200" />
      <button type="submit" className="w-full py-3 rounded-xl bg-[#1B2A4A] text-white font-bold">Reset Password</button>
      <Link to="/login" className="block text-center text-sm font-bold text-indigo-600">Back to Login</Link>
    </form>
  </main>;
};