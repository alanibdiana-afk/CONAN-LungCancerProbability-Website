"use client";

import { Shield, Lock, Trash2, Eye, Server, UserCheck } from "lucide-react";
import { useApp } from "@/lib/context";

const sections = [
  {
    icon: Lock,
    title: "Data Collection",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    content: `CONAN collects the following information when you use it:
• Symptom inputs (YES/NO answers to 13 risk factors)
• Optional personal information (age, sex)
• Uploaded chest X-ray images (processed locally)
• Assessment results and risk predictions
• App settings and preferences

We do NOT collect: passwords, payment information, location data, or device identifiers.`,
  },
  {
    icon: Server,
    title: "Data Storage",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    content: `All data is stored locally on your device using encrypted browser localStorage. 
    
• No data is transmitted to external servers without your explicit consent
• Uploaded X-ray images are processed in-browser and never stored permanently
• Assessment results are saved only if you are signed in
• Settings and preferences are stored locally for convenience`,
  },
  {
    icon: Eye,
    title: "Data Usage",
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
    content: `Your data is used solely for:
• Generating lung cancer risk assessments
• Displaying your results and trend history in the dashboard
• Personalizing your app experience (font size, contrast mode)

We do NOT use your data for: advertising, profiling, third-party sharing, or any commercial purpose.`,
  },
  {
    icon: UserCheck,
    title: "Your Rights",
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    content: `You have the following rights regarding your data:
• Right to Access: View all your saved results in the Dashboard
• Right to Deletion: Delete all your data at any time from Settings
• Right to Withdraw Consent: Stop using the app and clear all data
• Right to Portability: Your data is stored in standard JSON format locally

To exercise any of these rights, go to Settings > Delete All Data.`,
  },
  {
    icon: Shield,
    title: "Security Measures",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    content: `We implement the following security measures:
• All data is stored in browser localStorage (isolated per origin)
• X-ray images are processed client-side and never uploaded to servers
• No third-party analytics or tracking scripts are used
• The app uses HTTPS for all network communications
• No sensitive medical data leaves your device`,
  },
  {
    icon: Trash2,
    title: "Data Retention",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    content: `Data retention policy:
• Assessment results are retained until you delete them or clear browser data
• A maximum of 20 results are stored per account
• Uploaded images are not retained after the session ends
• You can delete all data at any time from the Settings page
• Clearing your browser's localStorage will also remove all app data`,
  },
];

export default function PrivacyContent() {
  const { setShowPrivacyModal } = useApp();

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Privacy Policy</h1>
          <p className="text-sm text-slate-500">How CONAN handles your data</p>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
        <p className="text-sm text-green-800">
          <strong>Last updated:</strong> February 2026 &nbsp;|&nbsp;
          <strong>Effective:</strong> Immediately upon use &nbsp;|&nbsp;
          <button
            onClick={() => setShowPrivacyModal(true)}
            className="text-green-700 underline font-medium hover:text-green-900"
          >
            Review & Re-consent
          </button>
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <p className="text-sm text-slate-600 leading-relaxed">
          CONAN is committed to protecting your privacy. This policy explains what data we collect,
          how we use it, and your rights as a user. By using CONAN, you agree to the practices
          described in this policy. This app is designed with a <strong>privacy-first</strong> approach —
          your health data stays on your device.
        </p>
      </div>

      <div className="space-y-3">
        {sections.map(({ icon: Icon, title, color, bg, border, content }) => (
          <div key={title} className={`bg-white border ${border} rounded-2xl p-5`}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <h2 className="text-sm font-bold text-slate-800">{title}</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{content}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
        <h2 className="text-sm font-bold text-slate-800 mb-2">Contact & Questions</h2>
        <p className="text-sm text-slate-600">
          If you have questions about this privacy policy or how your data is handled, please refer to
          the User Manual or contact the development team through the official project repository.
          CONAN is an academic/research project and does not have a commercial support channel.
        </p>
      </div>
    </div>
  );
}
