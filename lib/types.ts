export type RiskLevel = "low" | "moderate" | "high";

export interface UserInfo {
  age: number | null;
  gender: "male" | "female" | null;
}

export interface PredictionResult {
  riskLevel: RiskLevel;
  confidence: number;
  factors: { name: string; impact: "high" | "medium" | "low"; present: boolean }[];
  summary: string;
  timestamp: Date;
  type: "symptoms" | "imaging" | "combined";
}

export interface User {
  id: string;
  name: string;
  email: string;
  results: PredictionResult[];
}

export interface AppSettings {
  fontSize: "small" | "normal" | "large";
  contrastMode: boolean;
  privacyConsented: boolean;
}
