export type Dim = "L" | "S" | "G" | "R" | "C" | "K";

export interface ReasonEntry {
  code: string;
  dimension: Dim;
  dimension_label: string;
  points: number;
  subscore: number;
  text: string;
}

export interface Scoring {
  subscores: Record<Dim, number>;
  pd_12m: number;
  score: number;
  band: number;
  grade: string;
  posture: string;
}

export interface Recommendation {
  decision: "APPROVE" | "REFER" | "SMALL_TICKET" | "DECLINE";
  decision_label: string;
  limit: number;
  tenor_months: number;
  indicative_rate: number;
  serviceable_emi: number;
  monthly_surplus: number;
  guards: string[];
  covenants: string[];
  early_warning: string[];
}

export interface TraceStep {
  step: string;
  label: string;
  detail: string;
  ms: number;
}

export interface Msme {
  id: string;
  name: string;
  city: string;
  state: string;
  sector: string;
  archetype: string;
  vintage_years: number;
  proprietor: string;
  story: string;
  tier: "T1" | "T2" | "T3";
  headcount: number;
  monthly_turnover: number;
  scoring: Scoring;
  reasons: { positive: ReasonEntry[]; negative: ReasonEntry[] };
  what_if: { action: string; delta: number; new_score: number }[];
  stress: { scenario: string; score: number; delta: number; grade: string }[];
  sensitivity: Record<
    string,
    { label: string; unit: string; current: number; points: { x: number; score: number }[] }
  >;
  score_history: { month: string; score: number }[];
  benchmark: { overall: number; sector: number; sector_name: string };
  recommendation: Recommendation;
  red_flags: string[];
  features: Record<string, number>;
  series: {
    months: string[];
    turnover: number[];
    upi_inflow: number[];
    balance: number[];
    upi_txn_count: number[];
  };
  memo: string;
  trace: TraceStep[];
}

export interface DemoData {
  generated_for: string;
  validation: {
    default_rate: number;
    auroc_test: number;
    ks_test: number;
    n_train: number;
    n_val: number;
    n_test: number;
    n_features: number;
    note: string;
  };
  dimensions: Record<Dim, { label: string; question: string }>;
  portfolio: {
    n: number;
    avg_score: number;
    avg_pd_pct: number;
    total_recommended_limit: number;
    approvals: number;
    referrals: number;
    grade_distribution: Record<string, number>;
    alerts: { id: string; name: string; severity: "red" | "amber" | "watch"; text: string }[];
  };
  msmes: Msme[];
}
