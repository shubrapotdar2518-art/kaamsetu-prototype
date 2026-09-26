import React from "react";

import { useNavigate } from "react-router-dom";

import { ArrowLeft, ArrowRight, CheckCircle2, Mail } from "lucide-react";

import { KaamSetuLogo } from "../../components/KaamSetuLogo";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { useLanguage } from "../../i18n/LanguageContext";

export const SignUpOptionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#F8FAF8] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      <header className="flex items-center justify-between max-w-xl w-full mx-auto">
        <KaamSetuLogo size="sm" />

        <div className="flex items-center gap-2">
          <LanguageSwitcher variant="dropdown" />

          <button
            type="button"
            onClick={() => navigate("/language")}
            className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-900 ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t("back", "Back")}</span>
          </button>
        </div>
      </header>

      <main className="max-w-xl w-full mx-auto my-auto py-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#ECFDF5] flex items-center justify-center text-[#15803D]">
              <Mail className="w-7 h-7" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              {t("chooseHowToContinue", "Join KaamSetu")}
            </h1>

            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              Create an account with your email address and password. No OTP is
              needed.
            </p>
          </div>

          <div className="p-5 rounded-2xl border-2 border-[#15803D] bg-[#ECFDF5]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 shrink-0 rounded-2xl bg-[#15803D] text-white flex items-center justify-center">
                <Mail className="w-6 h-6" />
              </div>

              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  Sign up with Email
                </h2>

                <p className="text-xs text-gray-600 mt-1">
                  Use one email address and password to access your KaamSetu
                  account.
                </p>
              </div>

              <CheckCircle2 className="w-5 h-5 shrink-0 text-[#15803D] ml-auto" />
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/create-account")}
            className="w-full mt-7 py-4 px-6 rounded-2xl bg-[#15803D] hover:bg-[#166534] text-white font-bold text-base flex items-center justify-center gap-2"
          >
            <span>{t("continue", "Create Account")}</span>

            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-center text-xs text-gray-600 font-medium mt-5">
            {t("alreadyHaveAccount", "Already have an account?")}{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-[#15803D] font-bold hover:underline"
            >
              {t("login", "Log in")}
            </button>
          </p>
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-2">
        Email and password registration · KaamSetu
      </footer>
    </div>
  );
};
