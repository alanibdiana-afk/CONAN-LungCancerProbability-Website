"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, Activity, Image as ImageIcon, Layers, BarChart2, Settings, Shield, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
  {
    id: "getting-started",
    icon: BookOpen,
    title: "Getting Started",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    content: [
      { step: "1", title: "Open CONAN", desc: "Navigate to the home screen. You will see three primary assessment options." },
      { step: "2", title: "Accept Privacy Policy", desc: "On first use, review and accept the Privacy Policy to enable full functionality." },
      { step: "3", title: "Optional Sign In", desc: "Sign in with your name and email to save and track results over time. This is optional — you can use the app without an account." },
      { step: "4", title: "Choose Assessment Type", desc: "Select one of the three pathways: Symptom Assessment, X-Ray Analysis, or Combined Assessment." },
    ],
  },
  {
    id: "symptoms",
    icon: Activity,
    title: "Health Background Assessment (Option 1)",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    content: [
      { step: "1", title: "Enter Personal Info (Optional)", desc: "Provide your age and sex for context. These fields are optional." },
      { step: "2", title: "Answer Symptom Questions", desc: "For each of the 13 risk factors, select YES if you have/experience that factor, or NO if you do not. Click on the card or the YES/NO buttons." },
      { step: "3", title: "Review Your Selections", desc: "The progress bar shows how many factors you have marked as YES. Use the Reset button to start over." },
      { step: "4", title: "Analyze Risk", desc: "Click 'Analyze Risk' to submit. The model will calculate your risk level and confidence score." },
      { step: "5", title: "View Results", desc: "You will be redirected to the Results page showing your risk level, factor breakdown, and recommendations." },
    ],
  },
  {
    id: "imaging",
    icon: ImageIcon,
    title: "Chest X-Ray Analysis (Option 2)",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    content: [
      { step: "1", title: "Prepare Your X-Ray Image", desc: "Ensure you have a chest X-ray image in JPG or PNG format. DICOM images should be converted to PNG first." },
      { step: "2", title: "Upload the Image", desc: "Drag and drop your image onto the upload area, or click 'Browse Files' to select it from your device." },
      { step: "3", title: "Verify the Preview", desc: "Check that the correct image is displayed in the preview. Click the X button to remove and re-upload if needed." },
      { step: "4", title: "Analyze X-Ray", desc: "Click 'Analyze X-Ray'. The system will preprocess and analyze the image (takes ~2 seconds)." },
      { step: "5", title: "View Results", desc: "Results include imaging-specific risk factors such as lung field clarity, nodule detection, and pleural indicators." },
    ],
  },
  {
    id: "combined",
    icon: Layers,
    title: "Combined Assessment (Option 3)",
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
    content: [
      { step: "1", title: "Step 1 – Symptoms", desc: "Complete the symptom checklist (same 13 factors as Option 1). Click 'Continue to X-Ray Upload'." },
      { step: "2", title: "Step 2 – X-Ray Upload", desc: "Upload your chest X-ray image. You can go back to edit symptoms if needed." },
      { step: "3", title: "Run Combined Analysis", desc: "Click 'Run Combined Analysis'. The model integrates both symptom and imaging data for a comprehensive result." },
      { step: "4", title: "Integrated Results", desc: "The combined result weighs both inputs equally (50/50) to produce a more comprehensive risk assessment." },
    ],
  },
  {
    id: "dashboard",
    icon: BarChart2,
    title: "Results Dashboard",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    content: [
      { step: "1", title: "Sign In Required", desc: "The dashboard requires a signed-in account to display saved results and trends." },
      { step: "2", title: "Risk Distribution Chart", desc: "A pie chart shows the breakdown of your past results by risk level (Low / Moderate / High)." },
      { step: "3", title: "Confidence Scores", desc: "A bar chart displays the confidence score for each of your past assessments." },
      { step: "4", title: "Trend Analysis", desc: "If you have 2+ results, a line chart shows how your risk level and confidence have changed over time." },
      { step: "5", title: "Assessment History", desc: "A full list of all past assessments with timestamps, types, and risk levels." },
    ],
  },
  {
    id: "settings",
    icon: Settings,
    title: "Settings & Accessibility",
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
    content: [
      { step: "1", title: "Font Size", desc: "Adjust text size to Small, Normal, or Large using the 'T' icon in the header or in Settings." },
      { step: "2", title: "Contrast Mode", desc: "Toggle high-contrast mode for better visibility using the moon/sun icon in the header." },
      { step: "3", title: "Data Deletion", desc: "Go to Settings > Delete All Data to permanently remove all saved results and account information." },
      { step: "4", title: "Offline Mode", desc: "When offline, symptom assessment remains available. X-ray analysis and dashboard require internet." },
    ],
  },
];

const lungCancerInfo = [
  { title: "What is Lung Cancer?", desc: "Lung cancer is the uncontrolled growth of abnormal cells in one or both lungs. It is one of the most common and deadliest cancers worldwide." },
  { title: "Common Symptoms", desc: "Persistent cough, coughing up blood, chest pain, shortness of breath, hoarseness, unexplained weight loss, and fatigue." },
  { title: "Risk Factors", desc: "Smoking (primary risk factor), secondhand smoke, radon gas exposure, asbestos, air pollution, family history, and prior lung disease." },
  { title: "Early Detection", desc: "Low-dose CT (LDCT) scans are recommended annually for high-risk individuals aged 50–80 who have a significant smoking history." },
  { title: "Prevention", desc: "Quit smoking, avoid secondhand smoke, test your home for radon, avoid carcinogens at work, eat a healthy diet, and exercise regularly." },
];

function AccordionItem({ section }: { section: typeof sections[0] }) {
  const [open, setOpen] = useState(false);
  const Icon = section.icon;
  return (
    <div className={cn("border rounded-2xl overflow-hidden", section.border)}>
      <button
        onClick={() => setOpen(!open)}
        className={cn("w-full flex items-center gap-3 px-5 py-4 text-left transition-colors", open ? section.bg : "bg-white hover:bg-slate-50")}
      >
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", section.bg)}>
          <Icon className={cn("w-4 h-4", section.color)} />
        </div>
        <span className="flex-1 text-sm font-semibold text-slate-800">{section.title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && (
        <div className="px-5 py-4 bg-white border-t border-slate-100 space-y-3">
          {section.content.map(({ step, title, desc }) => (
            <div key={step} className="flex items-start gap-3">
              <div className={cn("w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5", section.bg, section.color)}>
                {step}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">{title}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ManualContent() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">User Manual</h1>
          <p className="text-sm text-slate-500">Step-by-step guidance for using CONAN</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          CONAN is a <strong>screening and awareness tool only</strong>. Results are not a medical diagnosis.
          Always consult a qualified healthcare professional for clinical evaluation.
        </p>
      </div>

      <div className="space-y-3">
        {sections.map((section) => (
          <AccordionItem key={section.id} section={section} />
        ))}
      </div>

      {/* Lung Cancer Educational Info (offline fallback) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-slate-700">Lung Cancer Educational Information</h2>
          <span className="ml-auto text-xs text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">Available Offline</span>
        </div>
        <div className="space-y-3">
          {lungCancerInfo.map(({ title, desc }) => (
            <div key={title} className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-800 mb-1">{title}</p>
              <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
