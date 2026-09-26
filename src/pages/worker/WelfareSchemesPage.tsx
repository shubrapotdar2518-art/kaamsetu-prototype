import React, { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import { ArrowLeft, ExternalLink, Landmark, RefreshCw } from "lucide-react";

import { collection, getDocs, query, where } from "firebase/firestore";

import { DashboardLayout } from "../../layouts/DashboardLayout";
import { useLanguage } from "../../i18n/LanguageContext";
import { db } from "../../firebase/firebaseClient";

interface WelfareScheme {
  id: string;
  name: string;
  category: string;
  summary: string;
  eligibility: string[];
  benefits: string[];
  documentsRequired: string[];
  applicationSteps: string[];
  officialUrl: string;
}

function getText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function getTextList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function getSafeLink(value: string): string | null {
  try {
    const parsedUrl = new URL(value.trim());

    return parsedUrl.protocol === "https:" ? parsedUrl.href : null;
  } catch {
    return null;
  }
}

export const WelfareSchemesPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [schemes, setSchemes] = useState<WelfareScheme[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadSchemes = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const schemesQuery = query(
          collection(db, "welfareSchemes"),
          where("isActive", "==", true),
        );

        const snapshot = await getDocs(schemesQuery);

        const loadedSchemes = snapshot.docs.map((document) => {
          const data = document.data();

          return {
            id: document.id,

            name: getText(data.name),

            category: getText(data.category),

            summary: getText(data.summary),

            eligibility: getTextList(data.eligibility),

            benefits: getTextList(data.benefits),

            documentsRequired: getTextList(data.documentsRequired),

            applicationSteps: getTextList(data.applicationSteps),

            officialUrl: getText(data.officialUrl),
          };
        });

        loadedSchemes.sort((first, second) =>
          first.name.localeCompare(second.name),
        );

        if (isMounted) {
          setSchemes(loadedSchemes);
        }
      } catch (caughtError) {
        console.error("Failed to load welfare schemes:", caughtError);

        if (isMounted) {
          setError("We could not load scheme information. Please try again.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadSchemes();

    return () => {
      isMounted = false;
    };
  }, [reloadCount]);

  return (
    <DashboardLayout type="worker">
      <div className="space-y-6">
        <div>
          <button
            type="button"
            onClick={() => navigate("/worker-dashboard")}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Landmark className="w-6 h-6 text-[#15803D]" />

            <span>{t("welfareSchemes", "Welfare Schemes for Workers")}</span>
          </h1>

          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            Read introductory scheme details and check the provider’s website
            for current eligibility.
          </p>
        </div>

        <div className="rounded-3xl bg-gradient-to-r from-[#15803D] to-[#166534] p-6 text-white shadow-md">
          <p className="text-xs font-bold text-emerald-100 uppercase tracking-wide">
            Information and awareness
          </p>

          <h2 className="text-xl sm:text-2xl font-extrabold mt-2">
            Discover available support
          </h2>

          <p className="text-xs sm:text-sm text-emerald-100 mt-2 max-w-2xl">
            KaamSetu provides information only. It does not guarantee
            eligibility or submit applications on a worker’s behalf.
          </p>
        </div>

        {isLoading && (
          <p role="status" className="text-sm text-gray-600">
            Loading schemes...
          </p>
        )}

        {error && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-rose-50 border border-rose-200"
          >
            <p className="text-sm text-rose-700">{error}</p>

            <button
              type="button"
              onClick={() => setReloadCount((count) => count + 1)}
              className="inline-flex items-center gap-2 mt-3 text-sm font-bold text-[#15803D]"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
          </div>
        )}

        {!isLoading && !error && schemes.length === 0 && (
          <div className="p-6 rounded-2xl bg-white border border-gray-100 text-sm text-gray-600">
            No active welfare schemes have been added yet.
          </div>
        )}

        {!isLoading && !error && schemes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schemes.map((scheme) => {
              const website = getSafeLink(scheme.officialUrl);

              return (
                <article
                  key={scheme.id}
                  className="p-5 sm:p-6 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-4"
                >
                  <div>
                    <p className="text-xs font-bold text-[#15803D] uppercase">
                      {scheme.category || "Worker welfare"}
                    </p>

                    <h2 className="text-lg font-extrabold text-gray-900 mt-1">
                      {scheme.name}
                    </h2>

                    <p className="text-sm text-gray-600 mt-2">
                      {scheme.summary}
                    </p>
                  </div>

                  {scheme.eligibility.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-800">
                        General eligibility
                      </h3>

                      <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-gray-600">
                        {scheme.eligibility.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {scheme.benefits.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-800">
                        Benefits
                      </h3>

                      <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-gray-600">
                        {scheme.benefits.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {scheme.documentsRequired.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-800">
                        Documents to check
                      </h3>

                      <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-gray-600">
                        {scheme.documentsRequired.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {scheme.applicationSteps.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-800">
                        How to apply
                      </h3>

                      <ol className="list-decimal pl-5 mt-2 space-y-1 text-sm text-gray-600">
                        {scheme.applicationSteps.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {website && (
                    <a
                      href={website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-bold text-[#15803D] hover:underline"
                    >
                      Visit provider website
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
