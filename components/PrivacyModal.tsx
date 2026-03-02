"use client";

import { useApp } from "@/lib/context";
import { Shield, X } from "lucide-react";

export default function PrivacyModal() {
  const { showPrivacyModal, setShowPrivacyModal, updateSettings } = useApp();

  if (!showPrivacyModal) return null;

  const handleAccept = () => {
    updateSettings({ privacyConsented: true });
    setShowPrivacyModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col animate-fadeIn">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Privacy Policy & Consent</h2>
            <p className="text-sm text-slate-500">Please review before continuing</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 text-sm text-slate-600">
          <div>
            <h3 className="font-semibold text-slate-800 mb-1">Data Collection</h3>
            <p>
              CONAN collects symptom inputs, uploaded images, and optional user profile
              information (age and sex) solely for the purpose of generating risk assessments.
              No data is transmitted to external servers without your explicit consent.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 mb-1">Data Storage</h3>
            <p>
              All data is stored locally on your device using encrypted browser storage. If you
              choose to create an account, your results are saved for trend analysis. You may
              delete all data at any time from Settings.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 mb-1">Medical Disclaimer</h3>
            <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              ⚠️ CONAN is a screening and awareness tool only. Results are NOT a medical
              diagnosis and should NOT replace professional medical advice, diagnosis, or
              treatment. Always consult a qualified healthcare professional.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 mb-1">Your Rights</h3>
            <p>
              You have the right to access, modify, and delete your data at any time. You may
              withdraw consent by clearing your data in Settings. This app does not sell or share
              personal information with third parties.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 mb-1">Prediction Basis</h3>
            <p>
              Predictions are based on publicly available anonymized lung cancer patient datasets
              and validated machine learning models. Confidence scores reflect model certainty,
              not clinical certainty.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
          <button
            onClick={() => setShowPrivacyModal(false)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors"
          >
            I Understand & Accept
          </button>
        </div>
      </div>
    </div>
  );
}
