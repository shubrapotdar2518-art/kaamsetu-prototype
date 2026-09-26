import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Lock, Mail } from "lucide-react";
import { KaamSetuLogo } from "../../components/KaamSetuLogo";
import { useApp } from "../../context/AppContext";
import { getFriendlyAuthError } from "../../services/authService";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginAccount, showToast } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const role = await loginAccount(email.trim(), password);
      showToast("Welcome back!");
      navigate(
        role === "employer" ? "/employer-dashboard" : "/worker-dashboard",
      );
    } catch (err) {
      setError(getFriendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      <header className="flex items-center justify-between max-w-xl w-full mx-auto">
        <KaamSetuLogo size="sm" />
        <button
          type="button"
          onClick={() => navigate("/signup-options")}
          className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </header>

      <main className="max-w-xl w-full mx-auto my-auto py-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Login
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Enter your registered email and password
            </p>
          </div>
          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50/70 border border-gray-200 text-sm outline-none focus:bg-white focus:border-[#15803D]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50/70 border border-gray-200 text-sm outline-none focus:bg-white focus:border-[#15803D]"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full mt-2 py-3.5 rounded-2xl bg-[#15803D] hover:bg-[#166534] disabled:bg-gray-400 text-white font-bold flex items-center justify-center gap-2"
            >
              <span>{busy ? "Logging in..." : "Login"}</span>
              {!busy && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
          <p className="text-center text-xs text-gray-600 mt-5">
            New to KaamSetu?{" "}
            <button
              type="button"
              onClick={() => navigate("/signup-options")}
              className="text-[#15803D] font-bold hover:underline"
            >
              Create account
            </button>
          </p>
        </div>
      </main>
      <footer className="text-center text-xs text-gray-400 py-2">
        Secure login • KaamSetu
      </footer>
    </div>
  );
};
