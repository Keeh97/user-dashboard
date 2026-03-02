import React, { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import JSZip from 'jszip';
import {
  ComposedChart, Line, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer
} from 'recharts';

// Color Palette
const COLORS = {
  bgDark: '#0f172a',
  bgCard: '#1e293b',
  border: '#334155',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  primary: '#6366f1',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
};

// Mock Data - Top Tracked Journeys (3 segments: Mass, Premier, Jade)
// Note: CSV input accepts 4 segments (Retail, Advance, Premier, Jade) where Retail+Advance merge to Mass
const top10Journeys = [
  {
    name: 'M2NM',
    overall: { nps: 65, completion: 82, dropOff: 18 },
    segments: {
      Mass: { nps: 62, completion: 80, dropOff: 20 },
      Premier: { nps: 71, completion: 86, dropOff: 14 },
      Jade: { nps: 78, completion: 91, dropOff: 9 }
    },
    prevNps: 63,
    prevCompletion: 80,
    prevDropOff: 20
  },
  {
    name: 'M2M',
    overall: { nps: 70, completion: 88, dropOff: 12 },
    segments: {
      Mass: { nps: 67, completion: 86, dropOff: 14 },
      Premier: { nps: 75, completion: 91, dropOff: 9 },
      Jade: { nps: 82, completion: 95, dropOff: 5 }
    },
    prevNps: 68,
    prevCompletion: 86,
    prevDropOff: 14
  },
  {
    name: 'Balance Forecast',
    overall: { nps: 60, completion: 75, dropOff: 25 },
    segments: {
      Mass: { nps: 57, completion: 72, dropOff: 28 },
      Premier: { nps: 65, completion: 80, dropOff: 20 },
      Jade: { nps: 73, completion: 87, dropOff: 13 }
    },
    prevNps: 58,
    prevCompletion: 73,
    prevDropOff: 27
  },
  {
    name: 'Account: manage card',
    overall: { nps: 58, completion: 79, dropOff: 21 },
    segments: {
      Mass: { nps: 55, completion: 76, dropOff: 24 },
      Premier: { nps: 63, completion: 83, dropOff: 17 },
      Jade: { nps: 71, completion: 89, dropOff: 11 }
    },
    prevNps: 56,
    prevCompletion: 77,
    prevDropOff: 23
  },
  {
    name: 'Add Payee',
    overall: { nps: 52, completion: 71, dropOff: 29 },
    segments: {
      Mass: { nps: 48, completion: 68, dropOff: 32 },
      Premier: { nps: 58, completion: 76, dropOff: 24 },
      Jade: { nps: 66, completion: 83, dropOff: 17 }
    },
    prevNps: 50,
    prevCompletion: 69,
    prevDropOff: 31
  },
  {
    name: 'Account: estatements',
    overall: { nps: 63, completion: 84, dropOff: 16 },
    segments: {
      Mass: { nps: 60, completion: 81, dropOff: 19 },
      Premier: { nps: 68, completion: 88, dropOff: 12 },
      Jade: { nps: 75, completion: 93, dropOff: 7 }
    },
    prevNps: 61,
    prevCompletion: 82,
    prevDropOff: 18
  },
  {
    name: 'Payee details',
    overall: { nps: 55, completion: 76, dropOff: 24 },
    segments: {
      Mass: { nps: 52, completion: 73, dropOff: 27 },
      Premier: { nps: 60, completion: 80, dropOff: 20 },
      Jade: { nps: 68, completion: 87, dropOff: 13 }
    },
    prevNps: 53,
    prevCompletion: 74,
    prevDropOff: 26
  },
  {
    name: 'Money out notification',
    overall: { nps: 68, completion: 86, dropOff: 14 },
    segments: {
      Mass: { nps: 65, completion: 83, dropOff: 17 },
      Premier: { nps: 73, completion: 89, dropOff: 11 },
      Jade: { nps: 80, completion: 94, dropOff: 6 }
    },
    prevNps: 66,
    prevCompletion: 84,
    prevDropOff: 16
  },
  {
    name: 'M2C',
    overall: { nps: 48, completion: 69, dropOff: 31 },
    segments: {
      Mass: { nps: 44, completion: 65, dropOff: 35 },
      Premier: { nps: 54, completion: 75, dropOff: 25 },
      Jade: { nps: 62, completion: 82, dropOff: 18 }
    },
    prevNps: 46,
    prevCompletion: 67,
    prevDropOff: 33
  }
];

// Qualitative Data
const qualitativeData = [
  {
    journey: 'Onboarding',
    issues: [
      { type: 'Pain Point', text: 'Cannot find the save button during account setup' },
      { type: 'Insight', text: 'Users prefer video tutorials over text instructions' }
    ]
  },
  {
    journey: 'Loan Application',
    issues: [
      { type: 'Pain Point', text: 'Too many document upload steps' },
      { type: 'Opportunity', text: 'Users want pre-approval feature before full application' },
      { type: 'Insight', text: 'Drop-off happens at income verification stage' }
    ]
  },
  {
    journey: 'Account Opening',
    issues: [
      { type: 'Pain Point', text: 'Form validation errors are unclear' },
      { type: 'Pain Point', text: 'Mobile number verification fails frequently' },
      { type: 'Opportunity', text: 'Add progress indicator showing steps remaining' }
    ]
  },
  {
    journey: 'Insurance Purchase',
    issues: [
      { type: 'Pain Point', text: 'Policy comparison table is confusing' },
      { type: 'Insight', text: 'Users abandon when they see premium calculation' },
      { type: 'Opportunity', text: 'Add chatbot to explain policy differences' }
    ]
  },
  {
    journey: 'Investment Portfolio',
    issues: [
      { type: 'Pain Point', text: 'Risk assessment questionnaire is too long' },
      { type: 'Opportunity', text: 'Provide beginner-friendly investment suggestions' }
    ]
  }
];

// NPS Trend Data (last 6 months)
const npsTrendData = [
  { month: 'Sep', nps: 48 },
  { month: 'Oct', nps: 51 },
  { month: 'Nov', nps: 49 },
  { month: 'Dec', nps: 53 },
  { month: 'Jan', nps: 52 },
  { month: 'Feb', nps: 54 }
];

// ── Demo Data ─────────────────────────────────────────────────────────────
const demoNpsTrend = [
  { month: 'Sep', nps: 44 },
  { month: 'Oct', nps: 50 },
  { month: 'Nov', nps: 47 },
  { month: 'Dec', nps: 55 },
  { month: 'Jan', nps: 59 },
  { month: 'Feb', nps: 63 },
];

// Retail+Advance → Mass (averaged); clear tier gap: Retail lowest, Jade highest
const mkDemoJourney = (
  name: string,
  rNps: number, aNps: number, pNps: number, jNps: number,
  rCom: number, aCom: number, pCom: number, jCom: number
) => {
  const massNps = Math.round((rNps + aNps) / 2);
  const massCom = Math.round((rCom + aCom) / 2);
  const ovNps = Math.round((rNps + aNps + pNps + jNps) / 4);
  const ovCom = Math.round((rCom + aCom + pCom + jCom) / 4);
  return {
    name,
    overall:  { nps: ovNps,   completion: ovCom,   dropOff: 100 - ovCom },
    segments: {
      Mass:    { nps: massNps, completion: massCom, dropOff: 100 - massCom },
      Premier: { nps: pNps,    completion: pCom,    dropOff: 100 - pCom },
      Jade:    { nps: jNps,    completion: jCom,    dropOff: 100 - jCom },
    },
    prevNps: ovNps - 3, prevCompletion: ovCom - 2, prevDropOff: (100 - ovCom) + 2,
  };
};

const demoJourneys = [
  mkDemoJourney('M2NM',                   42, 52, 67, 84,  62, 71, 83, 94),
  mkDemoJourney('M2M',                    48, 57, 73, 89,  68, 76, 87, 96),
  mkDemoJourney('Balance Forecast',       35, 45, 60, 76,  55, 64, 76, 88),
  mkDemoJourney('Account: manage card',   38, 48, 63, 79,  59, 68, 79, 90),
  mkDemoJourney('Add Payee',              30, 41, 56, 72,  51, 60, 72, 85),
  mkDemoJourney('Account: estatements',   44, 54, 69, 85,  65, 73, 83, 93),
  mkDemoJourney('Payee details',          33, 43, 58, 74,  53, 62, 74, 86),
  mkDemoJourney('Money out notification', 45, 55, 70, 86,  64, 72, 82, 92),
  mkDemoJourney('M2C',                    28, 39, 54, 70,  49, 58, 70, 82),
  mkDemoJourney('Loan Application',       25, 36, 50, 66,  44, 53, 65, 78),
];

const demoQual = [
  { journey: 'M2NM', issues: [
    { type: 'Pain Point',  text: 'Transfer limits are unclear for Retail users' },
    { type: 'Insight',     text: 'Jade users complete transfers 3× faster on average' },
    { type: 'Opportunity', text: 'Add saved recipient nicknames for repeat transfers' },
  ]},
  { journey: 'Add Payee', issues: [
    { type: 'Pain Point',  text: 'Too many verification steps for Mass segment' },
    { type: 'Pain Point',  text: 'Error messages unclear when payee details are invalid' },
    { type: 'Insight',     text: 'Premier users abandon at OTP verification step' },
  ]},
  { journey: 'Loan Application', issues: [
    { type: 'Pain Point',  text: 'Income verification has 45%+ drop-off in Retail segment' },
    { type: 'Opportunity', text: 'Pre-qualification tool would reduce abandonment significantly' },
    { type: 'Insight',     text: 'Jade users expect faster approval decisions' },
  ]},
  { journey: 'Balance Forecast', issues: [
    { type: 'Opportunity', text: 'Add spending category breakdown to forecast view' },
    { type: 'Insight',     text: 'Premier users engage with forecast feature weekly' },
  ]},
  { journey: 'M2C', issues: [
    { type: 'Pain Point',  text: 'Counter location search is difficult on mobile' },
    { type: 'Opportunity', text: 'Add queue time estimates for counter visits' },
  ]},
];

// ── Column-mapping dialog ─────────────────────────────────────────────────
interface CsvFileInfo {
  name: string;
  headers: string[];
  rows: any[];
}
interface MappingDialogState {
  files: CsvFileInfo[];
  currentIndex: number;
  fileTypes: ('quant' | 'qual' | 'skip')[];
  mappings: { [field: string]: string }[];
  autoQuantRows: any[];
  autoQualRows: any[];
  zipFileName: string;
  totalCsvCount: number;
  normalizeMode: boolean; // true = export normalized CSV, false = import to dashboard
}
const QUANT_FIELDS = [
  { key: 'journey_name', label: 'Journey Name',   required: true },
  { key: 'segment',      label: 'Segment',         required: true },
  { key: 'nps_score',    label: 'NPS Score',       required: true },
  { key: 'completion',   label: 'Completion %',    required: true },
  { key: 'drop_off',     label: 'Drop-off %',      required: true },
  { key: 'user_id',      label: 'User ID',         required: false },
];
const QUAL_FIELDS = [
  { key: 'journey_name',  label: 'Journey Name',  required: true },
  { key: 'feedback_type', label: 'Feedback Type', required: true },
  { key: 'feedback_text', label: 'Feedback Text', required: true },
];
const guessFileType = (headers: string[]): 'quant' | 'qual' | 'skip' => {
  const h = headers.map(x => x.toLowerCase());
  const qn = ['nps', 'score', 'completion', 'drop', 'segment'].filter(k => h.some(x => x.includes(k))).length;
  const ql = ['feedback', 'comment', 'insight', 'type', 'text'].filter(k => h.some(x => x.includes(k))).length;
  return ql > qn ? 'qual' : 'quant';
};
const autoSuggestMapping = (headers: string[], type: 'quant' | 'qual' | 'skip'): { [field: string]: string } => {
  const fields = type === 'quant' ? QUANT_FIELDS : type === 'qual' ? QUAL_FIELDS : [];
  const mapping: { [field: string]: string } = {};
  for (const field of fields) {
    const exact = headers.find(h => h.toLowerCase() === field.key.toLowerCase());
    if (exact) { mapping[field.key] = exact; continue; }
    const parts = field.key.split('_');
    const partial = headers.find(h => parts.some(p => h.toLowerCase().includes(p.toLowerCase())));
    mapping[field.key] = partial || '';
  }
  return mapping;
};
// ─────────────────────────────────────────────────────────────────────────────

function App() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'nps' | 'completion' | 'dropOff'>('nps');
  const [journeyData, setJourneyData] = useState(top10Journeys);
  const [qualitativeFindings, setQualitativeFindings] = useState(qualitativeData);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [prevKPIs, setPrevKPIs] = useState({ nps: 48, completion: 71, riskPoints: 5 });
  const [segmentFilter, setSegmentFilter] = useState<'All' | 'Mass' | 'Premier' | 'Jade'>('All');
  const [mappingState, setMappingState] = useState<MappingDialogState | null>(null);
  const [pageExitData, setPageExitData] = useState<{ [journey: string]: { page: string; exitRate: number } }>({});
  const [zipAvgCompletion, setZipAvgCompletion] = useState<number | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const qualitativeSectionRef = useRef<HTMLDivElement>(null);
  const menuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedRealData = useRef<{ journeyData: any; qualitativeFindings: any; pageExitData: any; zipAvgCompletion: number | null } | null>(null);

  // Load persisted data on mount
  useEffect(() => {
    try {
      const sj = localStorage.getItem('journeyData');
      const sq = localStorage.getItem('qualitativeFindings');
      const se = localStorage.getItem('pageExitData');
      const sc = localStorage.getItem('zipAvgCompletion');
      if (sj) setJourneyData(JSON.parse(sj));
      if (sq) setQualitativeFindings(JSON.parse(sq));
      if (se) setPageExitData(JSON.parse(se));
      if (sc !== null) setZipAvgCompletion(JSON.parse(sc));
    } catch (e) {}
  }, []);

  // Calculate metrics based on segment filter
  const overallNPS = Math.round(
    segmentFilter === 'All'
      ? journeyData.reduce((sum: number, j: any) => sum + (j.overall.nps ?? 0), 0) / journeyData.length
      : journeyData.reduce((sum: number, j: any) => sum + (j.segments[segmentFilter]?.nps ?? 0), 0) / journeyData.length
  );
  const avgCompletion = zipAvgCompletion !== null ? zipAvgCompletion : Math.round(
    segmentFilter === 'All'
      ? journeyData.reduce((sum: number, j: any) => sum + (j.overall.completion ?? 0), 0) / journeyData.length
      : journeyData.reduce((sum: number, j: any) => sum + (j.segments[segmentFilter]?.completion ?? 0), 0) / journeyData.length
  );

  // Sort journeys
  const sortedJourneys = [...journeyData].sort((a: any, b: any) => {
    if (sortBy === 'nps') return b.overall.nps - a.overall.nps;
    if (sortBy === 'completion') return b.overall.completion - a.overall.completion;
    return b.overall.dropOff - a.overall.dropOff;
  });

  // Helper function to get pain point risk level
  const getPainPointRisk = (painPointCount: number): 'High' | 'Medium' | 'Low' => {
    if (painPointCount > 15) return 'High';
    if (painPointCount >= 10) return 'Medium';
    return 'Low';
  };

  // Helper function to get drop-off risk level
  const getDropOffRisk = (dropOff: number): 'High' | 'Medium' | 'Low' => {
    if (dropOff >= 45) return 'High';
    if (dropOff >= 30) return 'Medium';
    return 'Low';
  };

  // Helper function to combine risks
  const combineRisks = (risk1: string, risk2: string): string => {
    if (risk1 === 'High' || risk2 === 'High') {
      if (risk1 === 'High' && risk2 === 'High') return 'High';
      if ((risk1 === 'High' && risk2 === 'Medium') || (risk1 === 'Medium' && risk2 === 'High')) return 'High';
      if ((risk1 === 'High' && risk2 === 'Low') || (risk1 === 'Low' && risk2 === 'High')) return 'Medium';
    }
    if (risk1 === 'Medium' && risk2 === 'Medium') return 'Medium';
    if ((risk1 === 'Medium' && risk2 === 'Low') || (risk1 === 'Low' && risk2 === 'Medium')) return 'Low';
    if (risk1 === 'Low' && risk2 === 'Low') return 'Low';
    return 'Low';
  };

  // Risk Alerts with qualitative insights
  const riskAlerts = journeyData
    .map((j: any) => {
      // Count pain points for this journey
      const journeyFeedback = qualitativeFindings.find((q: any) => q.journey === j.name);
      const painPointCount = journeyFeedback
        ? journeyFeedback.issues.filter((issue: any) => issue.type === 'Pain Point').length
        : 0;

      // Drop-off = 100 - completion
      const completion = segmentFilter === 'All' ? j.overall.completion : j.segments[segmentFilter]?.completion;
      const dropOff = completion != null ? Math.round(100 - completion) : j.overall.dropOff;
      const dropOffRisk = getDropOffRisk(dropOff);
      const painPointRisk = getPainPointRisk(painPointCount);

      // Combine risks
      const combinedRisk = combineRisks(dropOffRisk, painPointRisk);

      return {
        journey: j.name,
        dropOff,
        painPointCount,
        dropOffRisk,
        painPointRisk,
        risk: combinedRisk,
        action: combinedRisk === 'High'
          ? 'Immediate investigation required - conduct user interviews'
          : combinedRisk === 'Medium'
          ? 'Monitor closely - review analytics and user feedback'
          : 'Continue monitoring - no immediate action needed'
      };
    })
    .filter((alert: any) => alert.risk === 'High' || alert.risk === 'Medium')
    .sort((a: any, b: any) => {
      if (a.risk === 'High' && b.risk !== 'High') return -1;
      if (a.risk !== 'High' && b.risk === 'High') return 1;
      return b.dropOff - a.dropOff;
    });

  // Calculate Active Risk Points - count high and medium risks
  const highRiskCount = riskAlerts.filter((alert: any) => alert.risk === 'High').length;
  const mediumRiskCount = riskAlerts.filter((alert: any) => alert.risk === 'Medium').length;
  const finalActiveRiskPoints = highRiskCount + mediumRiskCount;

  // Trend indicator helper
  const getTrendIndicator = (current: number, previous: number) => {
    if (current > previous) return '▲';
    if (current < previous) return '▼';
    return '━';
  };

  const getTrendColor = (current: number, previous: number, higherIsBetter: boolean) => {
    if (current > previous) return higherIsBetter ? COLORS.success : COLORS.danger;
    if (current < previous) return higherIsBetter ? COLORS.danger : COLORS.success;
    return COLORS.textSecondary;
  };

  // NPS color helper
  const getNPSColor = (nps: number) => {
    if (nps >= 50) return COLORS.success;
    if (nps >= 0) return COLORS.warning;
    return COLORS.danger;
  };

  // Risk level helper based on completion rate; returns null when no data
  const getRiskLevel = (completion: number | null): { label: string; color: string } | null => {
    if (completion == null) return null;
    if (completion < 60) return { label: 'High risk', color: COLORS.danger };
    if (completion < 80) return { label: 'Medium risk', color: COLORS.warning };
    return { label: 'Low risk', color: COLORS.success };
  };

  // Navigate to Qualitative Findings
  const navigateToInsights = (journeyName: string) => {
    setActiveTab('Qualitative Findings');
    setTimeout(() => {
      qualitativeSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Active NPS trend: demo data or static data
  const activeNpsTrend = isDemoMode ? demoNpsTrend : npsTrendData;

  // Demo mode handlers
  const enterDemoMode = () => {
    savedRealData.current = { journeyData, qualitativeFindings, pageExitData, zipAvgCompletion };
    setJourneyData(demoJourneys as any);
    setQualitativeFindings(demoQual as any);
    setPageExitData({});
    setZipAvgCompletion(null);
    setIsDemoMode(true);
    setMenuOpen(false);
  };
  const exitDemoMode = () => {
    if (savedRealData.current) {
      setJourneyData(savedRealData.current.journeyData);
      setQualitativeFindings(savedRealData.current.qualitativeFindings);
      setPageExitData(savedRealData.current.pageExitData);
      setZipAvgCompletion(savedRealData.current.zipAvgCompletion);
    }
    setIsDemoMode(false);
  };

  // Persist state to localStorage and record upload timestamp
  const saveToStorage = (updates: {
    journeyData?: any; qualitativeFindings?: any;
    pageExitData?: any; zipAvgCompletion?: number | null;
  }) => {
    const ts = new Date().toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
    localStorage.setItem('lastUploadTime', ts);
    if ('journeyData' in updates)         localStorage.setItem('journeyData',         JSON.stringify(updates.journeyData));
    if ('qualitativeFindings' in updates) localStorage.setItem('qualitativeFindings', JSON.stringify(updates.qualitativeFindings));
    if ('pageExitData' in updates)        localStorage.setItem('pageExitData',        JSON.stringify(updates.pageExitData));
    if ('zipAvgCompletion' in updates)    localStorage.setItem('zipAvgCompletion',    JSON.stringify(updates.zipAvgCompletion));
  };

  // File upload handlers
  const handleQuantitativeUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (file) {
        setUploadStatus('Processing quantitative data...');

        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results: any) => {
            try {
              // Validate required columns
              const requiredColumns = ['user_id', 'journey_name', 'segment', 'nps_score', 'completion', 'drop_off'];
              const headers = Object.keys(results.data[0] || {});
              const missingColumns = requiredColumns.filter(col => !headers.includes(col));

              if (missingColumns.length > 0) {
                setUploadStatus(`❌ Error: Missing columns: ${missingColumns.join(', ')}`);
                setTimeout(() => setUploadStatus(''), 5000);
                return;
              }

              // Group data by journey and segment
              const journeyMap: any = {};

              results.data.forEach((row: any) => {
                const journey = row.journey_name;
                let segment = row.segment;

                // Accept 4 input segments: Retail, Advance, Premier, Jade
                // Merge Retail + Advance into Mass
                if (segment === 'Retail' || segment === 'Advance') {
                  segment = 'Mass';
                } else if (segment !== 'Premier' && segment !== 'Jade') {
                  return; // Skip invalid segments
                }

                if (!journeyMap[journey]) {
                  journeyMap[journey] = {
                    name: journey,
                    Mass: [],
                    Premier: [],
                    Jade: []
                  };
                }

                journeyMap[journey][segment].push({
                  nps: parseFloat(row.nps_score) || 0,
                  completion: parseFloat(row.completion) || 0,
                  dropOff: parseFloat(row.drop_off) || 0
                });
              });

              // Calculate averages for each journey
              const processedJourneys = Object.values(journeyMap).map((journey: any) => {
                const calcAvg = (arr: any[], key: string) => {
                  if (arr.length === 0) return 0;
                  return Math.round(arr.reduce((sum, item) => sum + item[key], 0) / arr.length);
                };

                const massMetrics = {
                  nps: calcAvg(journey.Mass, 'nps'),
                  completion: calcAvg(journey.Mass, 'completion'),
                  dropOff: calcAvg(journey.Mass, 'dropOff')
                };

                const premierMetrics = {
                  nps: calcAvg(journey.Premier, 'nps'),
                  completion: calcAvg(journey.Premier, 'completion'),
                  dropOff: calcAvg(journey.Premier, 'dropOff')
                };

                const jadeMetrics = {
                  nps: calcAvg(journey.Jade, 'nps'),
                  completion: calcAvg(journey.Jade, 'completion'),
                  dropOff: calcAvg(journey.Jade, 'dropOff')
                };

                const allData = [...journey.Mass, ...journey.Premier, ...journey.Jade];
                const overallMetrics = {
                  nps: calcAvg(allData, 'nps'),
                  completion: calcAvg(allData, 'completion'),
                  dropOff: calcAvg(allData, 'dropOff')
                };

                return {
                  name: journey.name,
                  overall: overallMetrics,
                  segments: {
                    Mass: massMetrics,
                    Premier: premierMetrics,
                    Jade: jadeMetrics
                  },
                  prevNps: overallMetrics.nps - 2,
                  prevCompletion: overallMetrics.completion - 2,
                  prevDropOff: overallMetrics.dropOff + 2
                };
              });

              // Save current KPIs as previous before updating
              setPrevKPIs({
                nps: overallNPS,
                completion: avgCompletion,
                riskPoints: finalActiveRiskPoints
              });

              setJourneyData(processedJourneys);
              saveToStorage({ journeyData: processedJourneys });
              setUploadStatus(`✅ Successfully imported ${processedJourneys.length} journeys from ${file.name}`);
              setTimeout(() => setUploadStatus(''), 5000);
              setMenuOpen(false);
            } catch (error: any) {
              setUploadStatus(`❌ Error parsing CSV: ${error.message}`);
              setTimeout(() => setUploadStatus(''), 5000);
            }
          },
          error: (error: any) => {
            setUploadStatus(`❌ Error reading file: ${error.message}`);
            setTimeout(() => setUploadStatus(''), 5000);
          }
        });
      }
    };
    input.click();
  };

  const handleQualitativeUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (file) {
        setUploadStatus('Processing qualitative data...');

        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results: any) => {
            try {
              // Validate required columns
              const requiredColumns = ['journey_name', 'feedback_type', 'feedback_text'];
              const headers = Object.keys(results.data[0] || {});
              const missingColumns = requiredColumns.filter(col => !headers.includes(col));

              if (missingColumns.length > 0) {
                setUploadStatus(`❌ Error: Missing columns: ${missingColumns.join(', ')}`);
                setTimeout(() => setUploadStatus(''), 5000);
                return;
              }

              // Group feedback by journey
              const feedbackMap: any = {};

              results.data.forEach((row: any) => {
                const journey = row.journey_name;
                const type = row.feedback_type;
                const text = row.feedback_text;

                // Only accept valid feedback types
                if (!['Pain Point', 'Insight', 'Opportunity'].includes(type)) return;
                if (!text || text.trim() === '') return;

                if (!feedbackMap[journey]) {
                  feedbackMap[journey] = {
                    journey: journey,
                    issues: []
                  };
                }

                feedbackMap[journey].issues.push({
                  type: type,
                  text: text.trim()
                });
              });

              const processedFindings = Object.values(feedbackMap);

              setQualitativeFindings(processedFindings as any);
              saveToStorage({ qualitativeFindings: processedFindings });
              setUploadStatus(`✅ Successfully imported ${processedFindings.length} journeys with feedback from ${file.name}`);
              setTimeout(() => setUploadStatus(''), 5000);
              setMenuOpen(false);
            } catch (error: any) {
              setUploadStatus(`❌ Error parsing CSV: ${error.message}`);
              setTimeout(() => setUploadStatus(''), 5000);
            }
          },
          error: (error: any) => {
            setUploadStatus(`❌ Error reading file: ${error.message}`);
            setTimeout(() => setUploadStatus(''), 5000);
          }
        });
      }
    };
    input.click();
  };

  // ── Core data processor (used by both auto-match and post-mapping paths) ──
  const processAllData = (quantRows: any[], qualRows: any[], zipFileName: string, csvCount: number) => {
    let updatedJourneys = false;
    let updatedQual = false;

    if (quantRows.length > 0) {
      const journeyMap: any = {};
      quantRows.forEach((row: any) => {
        const journey = row.journey_name;
        let segment = row.segment;
        if (segment === 'Retail' || segment === 'Advance') segment = 'Mass';
        else if (segment !== 'Premier' && segment !== 'Jade') return;
        if (!journeyMap[journey]) journeyMap[journey] = { name: journey, Mass: [], Premier: [], Jade: [] };
        journeyMap[journey][segment].push({
          nps: parseFloat(row.nps_score) || 0,
          completion: parseFloat(row.completion) || 0,
          dropOff: parseFloat(row.drop_off) || 0
        });
      });
      const calcAvg = (arr: any[], key: string) =>
        arr.length === 0 ? 0 : Math.round(arr.reduce((s: number, x: any) => s + x[key], 0) / arr.length);
      const processedJourneys = Object.values(journeyMap).map((journey: any) => {
        const allData = [...journey.Mass, ...journey.Premier, ...journey.Jade];
        const overall = {
          nps: calcAvg(allData, 'nps'),
          completion: calcAvg(allData, 'completion'),
          dropOff: calcAvg(allData, 'dropOff')
        };
        return {
          name: journey.name, overall,
          segments: {
            Mass:    { nps: calcAvg(journey.Mass,    'nps'), completion: calcAvg(journey.Mass,    'completion'), dropOff: calcAvg(journey.Mass,    'dropOff') },
            Premier: { nps: calcAvg(journey.Premier, 'nps'), completion: calcAvg(journey.Premier, 'completion'), dropOff: calcAvg(journey.Premier, 'dropOff') },
            Jade:    { nps: calcAvg(journey.Jade,    'nps'), completion: calcAvg(journey.Jade,    'completion'), dropOff: calcAvg(journey.Jade,    'dropOff') },
          },
          prevNps: overall.nps - 2, prevCompletion: overall.completion - 2, prevDropOff: overall.dropOff + 2
        };
      });
      setPrevKPIs({ nps: overallNPS, completion: avgCompletion, riskPoints: finalActiveRiskPoints });
      setJourneyData(processedJourneys);
      updatedJourneys = true;
    }

    if (qualRows.length > 0) {
      const feedbackMap: any = {};
      qualRows.forEach((row: any) => {
        const journey = row.journey_name;
        const type = row.feedback_type;
        const text = row.feedback_text;
        if (!['Pain Point', 'Insight', 'Opportunity'].includes(type)) return;
        if (!text || text.trim() === '') return;
        if (!feedbackMap[journey]) feedbackMap[journey] = { journey, issues: [] };
        feedbackMap[journey].issues.push({ type, text: text.trim() });
      });
      setQualitativeFindings(Object.values(feedbackMap) as any);
      updatedQual = true;
    }

    if (!updatedJourneys && !updatedQual) {
      setUploadStatus('❌ No valid data found — check column assignments');
    } else {
      const parts = [];
      if (updatedJourneys) parts.push('quantitative data');
      if (updatedQual) parts.push('qualitative data');
      setUploadStatus(`✅ Imported ${parts.join(' + ')} from ${csvCount} CSV file(s) in ${zipFileName}`);
    }
    setTimeout(() => setUploadStatus(''), 5000);
  };

  // ── Apply user-defined column mappings then process ───────────────────────
  const processWithMappings = (state: MappingDialogState) => {
    const quantRows = [...state.autoQuantRows];
    const qualRows  = [...state.autoQualRows];

    state.files.forEach((file, i) => {
      const type    = state.fileTypes[i];
      const mapping = state.mappings[i] || {};
      if (type === 'skip') return;

      const remapped = file.rows.map((row: any) => {
        const out: any = {};
        Object.entries(mapping).forEach(([stdKey, actualKey]) => {
          if (actualKey) out[stdKey] = row[actualKey];
        });
        return out;
      });

      if (type === 'quant') quantRows.push(...remapped);
      else if (type === 'qual') qualRows.push(...remapped);
    });

    processAllData(quantRows, qualRows, state.zipFileName, state.totalCsvCount);
    setMappingState(null);
  };

  const handleZipUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip';
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;

      setUploadStatus('Processing ZIP...');

      try {
        const zip = await JSZip.loadAsync(file);
        const csvFiles: { name: string; content: string }[] = [];
        const promises: Promise<void>[] = [];

        zip.forEach((relativePath, zipEntry) => {
          if (!zipEntry.dir && relativePath.toLowerCase().endsWith('.csv')) {
            promises.push(zipEntry.async('string').then(c => { csvFiles.push({ name: relativePath, content: c }); }));
          }
        });
        await Promise.all(promises);

        if (csvFiles.length === 0) {
          setUploadStatus('❌ No CSV files found in ZIP');
          setTimeout(() => setUploadStatus(''), 5000);
          return;
        }

        // ── Filename-based type detection ──────────────────────────────────
        const getFileSuffix = (name: string): 'complete' | 'page_level' | 'skip' => {
          const base = name.split('/').pop()?.toLowerCase() || '';
          if (/_funnel|_sankey|_error/.test(base)) return 'skip';
          if (base.includes('_page_level')) return 'page_level';
          if (base.includes('_complete') || base.includes('_completion')) return 'complete';
          return 'skip';
        };

        // Strip suffix + extension, convert underscores to spaces
        const getJourneyFromFile = (name: string): string =>
          (name.split('/').pop() || '')
            .replace(/\.csv$/i, '')
            .replace(/_page_level|_completion|_complete|_funnel|_sankey|_error/gi, '')
            .replace(/_/g, ' ').trim();

        const completeRows: any[] = [];
        const allCompletionValues: number[] = [];
        const newExitData: { [k: string]: { page: string; exitRate: number } } = {};
        let completeCount = 0, pageCount = 0, skippedCount = 0;

        for (const { name, content } of csvFiles) {
          const suffix = getFileSuffix(name);
          if (suffix === 'skip') { skippedCount++; continue; }

          const result = Papa.parse(content, { header: true, skipEmptyLines: true });
          if ((result.data as any[]).length === 0) continue;
          const headers = Object.keys(result.data[0] as object);

          if (suffix === 'complete') {
            const journeyFromFile = getJourneyFromFile(name);
            const knownSegs = ['advance', 'jade', 'premier', 'retail', 'mass'];
            const allDataRows = (result.data as any[]).filter(row =>
              Object.values(row).some(v => v !== '' && v !== null && v !== undefined)
            );

            // ── Format A: double-row header ──────────────────────────────────
            // Row 1 (PapaParse headers) = segment names: Advance, Jade, Premier, Retail
            // Row 2 (first data row)   = "Complete %" labels  ← sub-header, skip
            // Row 3+ = actual daily completion values
            const firstRowVals = Object.values(allDataRows[0] || {}).map(v => String(v).toLowerCase());
            const isDoubleHeader = firstRowVals.some(v => v.includes('complete') || v.includes('rate'));

            if (isDoubleHeader) {
              const segHeaders = headers.filter(h => knownSegs.includes(h.toLowerCase().trim()));
              const actualRows = allDataRows.slice(1); // skip the "Complete %" sub-header row
              segHeaders.forEach(col => {
                actualRows.forEach(row => {
                  const v = parseFloat(row[col]);
                  if (isNaN(v)) return;
                  allCompletionValues.push(v);
                  let segment = col.trim();
                  if (segment === 'Retail' || segment === 'Advance') segment = 'Mass';
                  if (!['Premier', 'Jade', 'Mass'].includes(segment)) return;
                  completeRows.push({ journey_name: journeyFromFile, segment, completion: v });
                });
              });

            // ── Format B: wide single-header ─────────────────────────────────
            // e.g. headers: 'Advance Complete %', 'Premier Complete %', ...
            } else {
              const segCompleteCols = headers.filter(h => {
                if (!h.includes('%')) return false;
                const lower = h.toLowerCase();
                const idx = lower.indexOf('complete');
                if (idx < 0) return false;
                const prefix = h.substring(0, idx).trim().replace(/[\s_]+$/, '');
                return prefix.length > 0;
              });

              if (segCompleteCols.length > 0) {
                allDataRows.forEach(row => {
                  segCompleteCols.forEach(col => {
                    const v = parseFloat(row[col]);
                    if (isNaN(v)) return;
                    allCompletionValues.push(v);
                    const rawSeg = col.replace(/[\s_]*complete[\s\S]*/i, '').trim();
                    let segment = rawSeg;
                    if (segment === 'Retail' || segment === 'Advance') segment = 'Mass';
                    if (!['Premier', 'Jade', 'Mass'].includes(segment)) return;
                    completeRows.push({ journey_name: journeyFromFile, segment, completion: v });
                  });
                });

              // ── Format C: long-format fallback ───────────────────────────────
              } else {
                const journeyCol  = headers.find(h => h.toLowerCase().includes('journey'));
                const segmentCol  = headers.find(h => ['segment', 'group', 'customer'].some(k => h.toLowerCase().includes(k)));
                const completeCol = headers.find(h => h.toLowerCase().includes('complet'));
                const npsCol      = headers.find(h => h.toLowerCase().includes('nps'));
                const dropOffCol  = headers.find(h => h.toLowerCase().includes('drop'));
                allDataRows.forEach(row => {
                  const journeyName = (journeyCol && row[journeyCol]) ? row[journeyCol] : journeyFromFile;
                  if (!journeyName) return;
                  let segment = segmentCol ? (row[segmentCol] || '') : '';
                  if (segment === 'Retail' || segment === 'Advance') segment = 'Mass';
                  if (!['Premier', 'Jade', 'Mass'].includes(segment)) segment = 'Mass';
                  const compVal = completeCol ? parseFloat(row[completeCol]) : NaN;
                  if (!isNaN(compVal)) allCompletionValues.push(compVal);
                  completeRows.push({
                    journey_name: journeyName,
                    segment,
                    nps_score:  npsCol      ? row[npsCol]      : undefined,
                    completion: completeCol ? row[completeCol]  : undefined,
                    drop_off:   dropOffCol  ? row[dropOffCol]   : undefined,
                  });
                });
              }
            }
            completeCount++;

          } else if (suffix === 'page_level') {
            // Find page_name and exit_rate columns
            const pageCol = headers.find(h => /page.?name|screen.?name/i.test(h))
              || headers.find(h => /^page$|^screen$|^step$/i.test(h))
              || headers.find(h => h.toLowerCase().includes('page'));
            const exitCol = headers.find(h => /exit.?rate|exit_pct|exit%/i.test(h))
              || headers.find(h => h.toLowerCase().includes('exit'));
            if (!pageCol || !exitCol) continue;

            let maxPage = '', maxRate = -1;
            (result.data as any[]).forEach(row => {
              const rate = parseFloat(row[exitCol]) || 0;
              if (rate > maxRate) { maxRate = rate; maxPage = String(row[pageCol] || '').trim(); }
            });
            if (maxPage && maxRate >= 0) {
              newExitData[getJourneyFromFile(name)] = {
                page: maxPage,
                exitRate: Math.round(maxRate * 10) / 10
              };
            }
            pageCount++;
          }
        }

        // ── Overview Avg. Completion = mean of all raw segment values ────────
        if (allCompletionValues.length > 0) {
          setZipAvgCompletion(Math.round(
            allCompletionValues.reduce((s, v) => s + v, 0) / allCompletionValues.length
          ));
        }

        // ── Build journey data from _complete rows ──────────────────────────
        let processedJourneys: any[] | null = null;
        if (completeRows.length > 0) {
          const journeyMap: any = {};
          completeRows.forEach(row => {
            const j = row.journey_name;
            if (!journeyMap[j]) journeyMap[j] = { name: j, Mass: [], Premier: [], Jade: [] };
            journeyMap[j][row.segment].push({
              nps:        row.nps_score  !== undefined ? (parseFloat(row.nps_score)  || 0) : null,
              completion: row.completion !== undefined ? (parseFloat(row.completion) || 0) : null,
              dropOff:    row.drop_off   !== undefined ? (parseFloat(row.drop_off)   || 0) : null,
            });
          });

          // Average that returns null when ALL values in group are null (field absent)
          const calcAvg = (arr: any[], key: string): number | null => {
            const valid = arr.filter(x => x[key] != null);
            return valid.length === 0 ? null
              : Math.round(valid.reduce((s: number, x: any) => s + x[key], 0) / valid.length);
          };

          processedJourneys = Object.values(journeyMap).map((j: any) => {
            const allData = [...j.Mass, ...j.Premier, ...j.Jade];
            const overall = {
              nps:        calcAvg(allData, 'nps'),
              completion: calcAvg(allData, 'completion'),
              dropOff:    calcAvg(allData, 'dropOff'),
            };
            return {
              name: j.name, overall,
              segments: {
                Mass:    { nps: calcAvg(j.Mass,    'nps'), completion: calcAvg(j.Mass,    'completion'), dropOff: calcAvg(j.Mass,    'dropOff') },
                Premier: { nps: calcAvg(j.Premier, 'nps'), completion: calcAvg(j.Premier, 'completion'), dropOff: calcAvg(j.Premier, 'dropOff') },
                Jade:    { nps: calcAvg(j.Jade,    'nps'), completion: calcAvg(j.Jade,    'completion'), dropOff: calcAvg(j.Jade,    'dropOff') },
              },
              prevNps:        overall.nps        != null ? overall.nps        - 2 : null,
              prevCompletion: overall.completion != null ? overall.completion - 2 : null,
              prevDropOff:    overall.dropOff    != null ? overall.dropOff    + 2 : null,
            };
          });

          setPrevKPIs({ nps: overallNPS, completion: avgCompletion, riskPoints: finalActiveRiskPoints });
          setJourneyData(processedJourneys);
        }

        // ── Match page_level keys to actual journey names ───────────────────
        let matchedExitData: typeof newExitData = {};
        if (Object.keys(newExitData).length > 0) {
          const knownNames = processedJourneys
            ? processedJourneys.map((j: any) => j.name)
            : journeyData.map((j: any) => j.name);
          const norm = (s: string) => s.toLowerCase().replace(/[\s_-]+/g, '');
          Object.entries(newExitData).forEach(([fileKey, info]) => {
            const hit = knownNames.find(n => norm(n) === norm(fileKey));
            matchedExitData[hit || fileKey] = info;
          });
          setPageExitData(prev => ({ ...prev, ...matchedExitData }));
        }

        // ── Status message ──────────────────────────────────────────────────
        const parts: string[] = [];
        if (completeCount > 0) parts.push(`${completeCount} complete file(s)`);
        if (pageCount > 0) parts.push(`${pageCount} page-level file(s)`);
        if (skippedCount > 0) parts.push(`${skippedCount} skipped`);

        if (completeCount === 0 && pageCount === 0) {
          setUploadStatus('❌ No _complete or _page_level files found in ZIP');
        } else {
          // ── Persist to localStorage ───────────────────────────────────────
          const newAvgComp = allCompletionValues.length > 0
            ? Math.round(allCompletionValues.reduce((s, v) => s + v, 0) / allCompletionValues.length)
            : null;
          const savePayload: Parameters<typeof saveToStorage>[0] = {};
          if (processedJourneys)                    savePayload.journeyData      = processedJourneys;
          if (Object.keys(matchedExitData).length)  savePayload.pageExitData     = { ...pageExitData, ...matchedExitData };
          if (newAvgComp !== null)                  savePayload.zipAvgCompletion = newAvgComp;
          if (Object.keys(savePayload).length)      saveToStorage(savePayload);

          setUploadStatus(`✅ Processed ${file.name}: ${parts.join(', ')}`);
        }
        setTimeout(() => setUploadStatus(''), 5000);
        setMenuOpen(false);
      } catch (error: any) {
        setUploadStatus(`❌ Error processing ZIP: ${error.message}`);
        setTimeout(() => setUploadStatus(''), 5000);
      }
    };
    input.click();
  };

  // ── Export normalized ZIP ─────────────────────────────────────────────────
  const exportNormalized = async (state: MappingDialogState) => {
    const QUANT_HEADERS = ['user_id', 'journey_name', 'segment', 'nps_score', 'completion', 'drop_off'];
    const QUAL_HEADERS  = ['journey_name', 'feedback_type', 'feedback_text'];
    const quantRows: any[] = [];
    const qualRows:  any[] = [];

    state.files.forEach((file, i) => {
      const type    = state.fileTypes[i];
      const mapping = state.mappings[i] || {};
      if (type === 'skip') return;
      const remapped = file.rows.map((row: any) => {
        const out: any = {};
        Object.entries(mapping).forEach(([stdKey, actualKey]) => { if (actualKey) out[stdKey] = row[actualKey]; });
        return out;
      });
      if (type === 'quant') quantRows.push(...remapped);
      else if (type === 'qual') qualRows.push(...remapped);
    });

    if (quantRows.length === 0 && qualRows.length === 0) {
      setUploadStatus('❌ No data to export — all files were skipped');
      setTimeout(() => setUploadStatus(''), 5000);
      setMappingState(null);
      return;
    }

    const zip = new JSZip();
    if (quantRows.length > 0) {
      const normalized = quantRows.map(r => Object.fromEntries(QUANT_HEADERS.map(h => [h, r[h] ?? ''])));
      zip.file('quantitative_normalized.csv', Papa.unparse(normalized, { columns: QUANT_HEADERS }));
    }
    if (qualRows.length > 0) {
      const normalized = qualRows.map(r => Object.fromEntries(QUAL_HEADERS.map(h => [h, r[h] ?? ''])));
      zip.file('qualitative_normalized.csv', Papa.unparse(normalized, { columns: QUAL_HEADERS }));
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `normalized_${state.zipFileName}`;
    a.click();
    URL.revokeObjectURL(url);

    setMappingState(null);
    const fileCount = (quantRows.length > 0 ? 1 : 0) + (qualRows.length > 0 ? 1 : 0);
    setUploadStatus(`✅ Exported normalized_${state.zipFileName} (${fileCount} CSV file${fileCount > 1 ? 's' : ''})`);
    setTimeout(() => setUploadStatus(''), 5000);
  };

  const handleNormalizeZipUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip';
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      setUploadStatus('Reading ZIP...');
      try {
        const zip = await JSZip.loadAsync(file);
        const csvFiles: { name: string; content: string }[] = [];
        const promises: Promise<void>[] = [];
        zip.forEach((relativePath, zipEntry) => {
          if (!zipEntry.dir && relativePath.toLowerCase().endsWith('.csv')) {
            const p = zipEntry.async('string').then(content => { csvFiles.push({ name: relativePath, content }); });
            promises.push(p);
          }
        });
        await Promise.all(promises);

        if (csvFiles.length === 0) {
          setUploadStatus('❌ No CSV files found in ZIP');
          setTimeout(() => setUploadStatus(''), 5000);
          return;
        }

        const QUANT_COLS = ['user_id', 'journey_name', 'segment', 'nps_score', 'completion', 'drop_off'];
        const QUAL_COLS  = ['journey_name', 'feedback_type', 'feedback_text'];
        const allFiles: CsvFileInfo[] = [];
        const fileTypes: ('quant' | 'qual' | 'skip')[] = [];
        const mappings: { [field: string]: string }[] = [];

        for (const { name, content } of csvFiles) {
          const result = Papa.parse(content, { header: true, skipEmptyLines: true });
          if (result.data.length === 0) continue;
          const headers = Object.keys(result.data[0] as object);

          let detectedType: 'quant' | 'qual' | 'skip';
          let mapping: { [field: string]: string };
          if (QUANT_COLS.every(col => headers.includes(col))) {
            detectedType = 'quant';
            mapping = Object.fromEntries(QUANT_COLS.map(c => [c, c]));
          } else if (QUAL_COLS.every(col => headers.includes(col))) {
            detectedType = 'qual';
            mapping = Object.fromEntries(QUAL_COLS.map(c => [c, c]));
          } else {
            detectedType = guessFileType(headers);
            mapping = autoSuggestMapping(headers, detectedType);
          }
          allFiles.push({ name, headers, rows: result.data as any[] });
          fileTypes.push(detectedType);
          mappings.push(mapping);
        }

        setUploadStatus('');
        setMappingState({
          files: allFiles, currentIndex: 0, fileTypes, mappings,
          autoQuantRows: [], autoQualRows: [],
          zipFileName: file.name, totalCsvCount: csvFiles.length,
          normalizeMode: true
        });
        setMenuOpen(false);
      } catch (error: any) {
        setUploadStatus(`❌ Error reading ZIP: ${error.message}`);
        setTimeout(() => setUploadStatus(''), 5000);
      }
    };
    input.click();
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: COLORS.bgDark,
      color: COLORS.textPrimary,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '20px'
    }}>
      {/* ── Column Mapping Dialog ── */}
      {mappingState && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '660px', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>

            {/* Title */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                {mappingState.normalizeMode ? '🔧 Normalize & Export' : 'Column Mapping'} — File {mappingState.currentIndex + 1} of {mappingState.files.length}
                {!mappingState.normalizeMode && mappingState.autoQuantRows.length + mappingState.autoQualRows.length > 0 &&
                  <span style={{ marginLeft: '8px', color: COLORS.success }}>({mappingState.totalCsvCount - mappingState.files.length} auto-matched)</span>
                }
              </div>
              <div style={{ fontSize: '17px', fontWeight: 600, color: COLORS.textPrimary, wordBreak: 'break-all' }}>
                {mappingState.files[mappingState.currentIndex].name}
              </div>
              <div style={{ fontSize: '12px', color: COLORS.textSecondary, marginTop: '4px' }}>
                {mappingState.files[mappingState.currentIndex].headers.length} columns detected · {mappingState.files[mappingState.currentIndex].rows.length} rows
              </div>
            </div>

            {/* File Type Selector */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>File Type</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['quant', 'qual', 'skip'] as const).map(t => {
                  const isActive = mappingState.fileTypes[mappingState.currentIndex] === t;
                  return (
                    <button key={t}
                      onClick={() => {
                        const newTypes    = [...mappingState.fileTypes];
                        const newMappings = [...mappingState.mappings];
                        newTypes[mappingState.currentIndex]    = t;
                        newMappings[mappingState.currentIndex] = autoSuggestMapping(mappingState.files[mappingState.currentIndex].headers, t);
                        setMappingState({ ...mappingState, fileTypes: newTypes, mappings: newMappings });
                      }}
                      style={{ padding: '7px 16px', borderRadius: '6px', border: `1px solid ${isActive ? COLORS.primary : COLORS.border}`, backgroundColor: isActive ? COLORS.primary + '25' : 'transparent', color: isActive ? COLORS.primary : COLORS.textSecondary, cursor: 'pointer', fontSize: '13px', fontWeight: isActive ? 600 : 400 }}
                    >
                      {t === 'quant' ? '📊 Quantitative' : t === 'qual' ? '💬 Qualitative' : '⏭ Skip'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Column Mapping Fields */}
            {mappingState.fileTypes[mappingState.currentIndex] !== 'skip' && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Map Columns</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {(mappingState.fileTypes[mappingState.currentIndex] === 'quant' ? QUANT_FIELDS : QUAL_FIELDS).map(field => {
                    const mapped = (mappingState.mappings[mappingState.currentIndex] || {})[field.key] || '';
                    return (
                      <div key={field.key}>
                        <div style={{ fontSize: '12px', color: field.required ? COLORS.textPrimary : COLORS.textSecondary, marginBottom: '5px' }}>
                          {field.label}{field.required && <span style={{ color: COLORS.danger }}> *</span>}
                        </div>
                        <select
                          value={mapped}
                          onChange={e => {
                            const newMappings = mappingState.mappings.map((m, i) =>
                              i === mappingState.currentIndex ? { ...m, [field.key]: e.target.value } : m
                            );
                            setMappingState({ ...mappingState, mappings: newMappings });
                          }}
                          style={{ width: '100%', padding: '7px 10px', backgroundColor: COLORS.bgDark, border: `1px solid ${mapped ? COLORS.primary + '80' : COLORS.border}`, borderRadius: '6px', color: mapped ? COLORS.textPrimary : COLORS.textSecondary, fontSize: '13px', outline: 'none' }}
                        >
                          <option value="">(not mapped)</option>
                          {mappingState.files[mappingState.currentIndex].headers.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Data Preview */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Data Preview</div>
              <div style={{ overflowX: 'auto', borderRadius: '6px', border: `1px solid ${COLORS.border}` }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: COLORS.bgDark }}>
                      {mappingState.files[mappingState.currentIndex].headers.map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: COLORS.textSecondary, borderBottom: `1px solid ${COLORS.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mappingState.files[mappingState.currentIndex].rows.slice(0, 3).map((row: any, ri: number) => (
                      <tr key={ri}>
                        {mappingState.files[mappingState.currentIndex].headers.map(h => (
                          <td key={h} style={{ padding: '7px 12px', color: COLORS.textPrimary, borderTop: `1px solid ${COLORS.border}33`, whiteSpace: 'nowrap', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {String(row[h] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => setMappingState(null)}
                style={{ padding: '8px 18px', borderRadius: '6px', border: `1px solid ${COLORS.border}`, backgroundColor: 'transparent', color: COLORS.textSecondary, cursor: 'pointer', fontSize: '13px' }}
              >
                Cancel
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                {mappingState.currentIndex > 0 && (
                  <button
                    onClick={() => setMappingState({ ...mappingState, currentIndex: mappingState.currentIndex - 1 })}
                    style={{ padding: '8px 18px', borderRadius: '6px', border: `1px solid ${COLORS.border}`, backgroundColor: 'transparent', color: COLORS.textSecondary, cursor: 'pointer', fontSize: '13px' }}
                  >
                    ← Back
                  </button>
                )}
                {mappingState.currentIndex < mappingState.files.length - 1 ? (
                  <button
                    onClick={() => setMappingState({ ...mappingState, currentIndex: mappingState.currentIndex + 1 })}
                    style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', backgroundColor: COLORS.primary, color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={() => mappingState.normalizeMode ? exportNormalized(mappingState) : processWithMappings(mappingState)}
                    style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', backgroundColor: mappingState.normalizeMode ? COLORS.warning : COLORS.success, color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                  >
                    {mappingState.normalizeMode ? '⬇ Export Normalized ZIP' : '✓ Confirm & Import'}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Header with Hamburger Menu */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '30px',
        position: 'relative'
      }}>
        {/* Hamburger Menu — hover to open, leave to close */}
        <div
          style={{ position: 'relative', marginRight: '20px' }}
          onMouseEnter={() => {
            if (menuCloseTimer.current) { clearTimeout(menuCloseTimer.current); menuCloseTimer.current = null; }
            setMenuOpen(true);
          }}
          onMouseLeave={() => {
            menuCloseTimer.current = setTimeout(() => setMenuOpen(false), 5000);
          }}
        >
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{
              background: 'none',
              border: 'none',
              color: COLORS.textPrimary,
              fontSize: '28px',
              cursor: 'pointer',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '5px'
            }}
          >
            <div style={{ width: '25px', height: '3px', backgroundColor: COLORS.textPrimary }}></div>
            <div style={{ width: '25px', height: '3px', backgroundColor: COLORS.textPrimary }}></div>
            <div style={{ width: '25px', height: '3px', backgroundColor: COLORS.textPrimary }}></div>
          </button>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div style={{
            position: 'absolute',
            top: '48px',
            left: '0',
            backgroundColor: COLORS.bgCard,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '8px',
            padding: '10px',
            zIndex: 1000,
            minWidth: '250px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
          }}>
            <div
              onClick={handleQuantitativeUpload}
              style={{
                padding: '12px',
                cursor: 'pointer',
                borderRadius: '6px',
                marginBottom: '5px',
                backgroundColor: 'transparent',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.border}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              📊 Upload Quantitative Data
            </div>
            <div
              onClick={handleQualitativeUpload}
              style={{
                padding: '12px',
                cursor: 'pointer',
                borderRadius: '6px',
                marginBottom: '5px',
                backgroundColor: 'transparent',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.border}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              💬 Upload Qualitative Data
            </div>
            <div style={{ height: '1px', backgroundColor: COLORS.border, margin: '4px 0' }} />
            <div
              onClick={handleZipUpload}
              style={{
                padding: '12px',
                cursor: 'pointer',
                borderRadius: '6px',
                backgroundColor: 'transparent',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.border}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              🗜️ Upload ZIP (auto-detect CSVs)
            </div>
            <div
              onClick={handleNormalizeZipUpload}
              style={{
                padding: '12px',
                cursor: 'pointer',
                borderRadius: '6px',
                marginTop: '4px',
                backgroundColor: 'transparent',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.border}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              🔧 Normalize ZIP → Export CSV
            </div>
            <div style={{ height: '1px', backgroundColor: COLORS.border, margin: '8px 0' }} />
            {!isDemoMode ? (
              <div
                onClick={enterDemoMode}
                style={{
                  padding: '12px',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  backgroundColor: COLORS.primary + '20',
                  border: `1px solid ${COLORS.primary}`,
                  color: COLORS.primary,
                  fontWeight: 'bold',
                  fontSize: '13px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.primary + '40'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = COLORS.primary + '20'}
              >
                🎮 Load Demo Data
              </div>
            ) : (
              <div
                onClick={exitDemoMode}
                style={{
                  padding: '12px',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  backgroundColor: COLORS.warning + '20',
                  border: `1px solid ${COLORS.warning}`,
                  color: COLORS.warning,
                  fontWeight: 'bold',
                  fontSize: '13px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.warning + '40'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = COLORS.warning + '20'}
              >
                ✕ Exit Demo Mode
              </div>
            )}
          </div>
        )}
        </div>{/* end hover wrapper */}

        <h1 style={{ margin: 0, fontSize: '24px' }}>User Research Monitoring Dashboard</h1>
        {isDemoMode && (
          <span style={{
            marginLeft: '12px',
            padding: '4px 10px',
            backgroundColor: COLORS.primary + '30',
            border: `1px solid ${COLORS.primary}`,
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
            color: COLORS.primary,
            flexShrink: 0
          }}>DEMO</span>
        )}

        {/* Last upload timestamp */}
        {localStorage.getItem('lastUploadTime') && (
          <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '11px', color: COLORS.textSecondary }}>
              Last upload: {localStorage.getItem('lastUploadTime')}
            </div>
            <div style={{ fontSize: '11px', color: COLORS.warning, marginTop: '2px' }}>
              ⚠ Data is stored locally only — not synced to cloud
            </div>
          </div>
        )}
      </div>

      {/* Upload Status Message */}
      {uploadStatus && (
        <div style={{
          padding: '12px 20px',
          marginBottom: '20px',
          backgroundColor: uploadStatus.startsWith('✅') ? COLORS.success + '20' : COLORS.danger + '20',
          border: `1px solid ${uploadStatus.startsWith('✅') ? COLORS.success : COLORS.danger}`,
          borderRadius: '8px',
          color: COLORS.textPrimary,
          fontSize: '14px'
        }}>
          {uploadStatus}
        </div>
      )}

      {/* Tab Navigation with Segment Filter */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        borderBottom: `2px solid ${COLORS.border}`,
        paddingBottom: '10px'
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          {['Overview', 'Top Tracked Journeys', 'Qualitative Findings', 'Risk Alerts'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 20px',
                backgroundColor: activeTab === tab ? COLORS.primary : 'transparent',
                color: COLORS.textPrimary,
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab ? 'bold' : 'normal'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Segment Filter - Global */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: COLORS.textSecondary, fontWeight: 'bold' }}>SEGMENT:</span>
          {(['All', 'Mass', 'Premier', 'Jade'] as const).map(segment => (
            <button
              key={segment}
              onClick={() => setSegmentFilter(segment)}
              style={{
                padding: '8px 20px',
                backgroundColor: segmentFilter === segment ? COLORS.primary : COLORS.bgCard,
                color: COLORS.textPrimary,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: segmentFilter === segment ? 'bold' : 'normal'
              }}
            >
              {segment}
            </button>
          ))}
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'Overview' && (
        <div>
          {/* KPI Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{
              backgroundColor: COLORS.bgCard,
              padding: '20px',
              borderRadius: '8px',
              border: `1px solid ${COLORS.border}`
            }}>
              <div style={{ fontSize: '12px', color: COLORS.textSecondary, marginBottom: '10px' }}>
                OVERALL NPS
              </div>
              <div style={{ fontSize: '34px', fontWeight: 'bold', color: segmentFilter === 'All' ? getNPSColor(overallNPS) : COLORS.textSecondary, display: 'flex', alignItems: 'center', gap: '10px' }}>
                {segmentFilter === 'All' ? overallNPS : '--'}
                {segmentFilter === 'All' && (
                  <span style={{
                    fontSize: '20px',
                    color: getTrendColor(overallNPS, prevKPIs.nps, true)
                  }}>
                    {getTrendIndicator(overallNPS, prevKPIs.nps)}
                  </span>
                )}
              </div>
            </div>

            <div style={{
              backgroundColor: COLORS.bgCard,
              padding: '20px',
              borderRadius: '8px',
              border: `1px solid ${COLORS.border}`
            }}>
              <div style={{ fontSize: '12px', color: COLORS.textSecondary, marginBottom: '10px' }}>
                AVG COMPLETION RATE
              </div>
              <div style={{ fontSize: '34px', fontWeight: 'bold', color: COLORS.success, display: 'flex', alignItems: 'center', gap: '10px' }}>
                {avgCompletion}%
                <span style={{
                  fontSize: '20px',
                  color: getTrendColor(avgCompletion, prevKPIs.completion, true)
                }}>
                  {getTrendIndicator(avgCompletion, prevKPIs.completion)}
                </span>
              </div>
            </div>

            <div style={{
              backgroundColor: COLORS.bgCard,
              padding: '20px',
              borderRadius: '8px',
              border: `1px solid ${COLORS.border}`
            }}>
              <div style={{ fontSize: '12px', color: COLORS.textSecondary, marginBottom: '10px' }}>
                ACTIVE RISK POINTS
              </div>
              <div style={{ fontSize: '34px', fontWeight: 'bold', color: COLORS.danger, display: 'flex', alignItems: 'center', gap: '10px' }}>
                {finalActiveRiskPoints}
                <span style={{
                  fontSize: '20px',
                  color: getTrendColor(finalActiveRiskPoints, prevKPIs.riskPoints, false)
                }}>
                  {getTrendIndicator(finalActiveRiskPoints, prevKPIs.riskPoints)}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: COLORS.textSecondary, marginTop: '8px' }}>
                <span style={{ color: COLORS.danger, fontWeight: 'bold' }}>{highRiskCount} High</span>
                {' / '}
                <span style={{ color: COLORS.warning, fontWeight: 'bold' }}>{mediumRiskCount} Medium</span>
              </div>
            </div>
          </div>

          {/* NPS Trend Chart */}
          <div style={{
            backgroundColor: COLORS.bgCard,
            padding: '20px',
            borderRadius: '8px',
            border: `1px solid ${COLORS.border}`,
            marginBottom: '30px'
          }}>
            <h3 style={{ marginTop: 0, fontSize: '16px' }}>NPS Trend (Last 6 Months)</h3>
            {segmentFilter !== 'All' && (
              <div style={{
                padding: '10px',
                marginBottom: '10px',
                backgroundColor: COLORS.warning + '20',
                border: `1px solid ${COLORS.warning}`,
                borderRadius: '6px',
                fontSize: '13px',
                color: COLORS.textSecondary
              }}>
                ℹ️ NPS by segment is not applicable
              </div>
            )}
            {segmentFilter === 'All' && (() => {
              const npsValues = activeNpsTrend.map(d => d.nps);
              const npsAvg = Math.round(npsValues.reduce((a, b) => a + b, 0) / npsValues.length);
              const npsMinVal = Math.min(...npsValues);
              const npsMaxVal = Math.max(...npsValues);
              const yPad = 5;
              const yMin = npsMinVal - yPad;
              const yMax = npsMaxVal + yPad;
              const avgPct = ((yMax - npsAvg) / (yMax - yMin) * 100).toFixed(1);

              return (
                <>
                  {/* Legend */}
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '11px', color: COLORS.textSecondary }}>
                    <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: COLORS.success, marginRight: 4 }} />High</span>
                    <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: COLORS.danger, marginRight: 4 }} />Low</span>
                    <span><span style={{ display: 'inline-block', width: 18, height: 2, backgroundColor: COLORS.textSecondary, marginRight: 4, verticalAlign: 'middle', borderTop: '2px dashed' }} />Avg {npsAvg}</span>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={activeNpsTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="npsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22c55e" stopOpacity={0.5} />
                          <stop offset={`${avgPct}%`} stopColor="#22c55e" stopOpacity={0.06} />
                          <stop offset={`${avgPct}%`} stopColor="#6366f1" stopOpacity={0.06} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0.5} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                      <XAxis dataKey="month" stroke={COLORS.textSecondary} tick={{ fontSize: 12 }} />
                      <YAxis stroke={COLORS.textSecondary} domain={[yMin, yMax]} tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: '6px' }} />
                      <ReferenceLine
                        y={npsAvg}
                        stroke={COLORS.textSecondary}
                        strokeDasharray="5 5"
                        strokeOpacity={0.8}
                        label={{ value: `Avg: ${npsAvg}`, fill: COLORS.textSecondary, fontSize: 12, fontWeight: 'bold', position: 'right' }}
                      />
                      <Area type="monotone" dataKey="nps" fill="url(#npsAreaGrad)" stroke="none" isAnimationActive={false} />
                      <Line
                        type="monotone"
                        dataKey="nps"
                        stroke={COLORS.primary}
                        strokeWidth={2.5}
                        dot={(props: any) => {
                          const { cx, cy, value, index } = props;
                          if (value === npsMaxVal) return (
                            <g key={`dot-${index}`}>
                              <circle cx={cx} cy={cy} r={6} fill={COLORS.success} stroke="#fff" strokeWidth={2} />
                              <text x={cx} y={cy - 12} textAnchor="middle" fill={COLORS.success} fontSize={11} fontWeight="bold">{value}</text>
                            </g>
                          );
                          if (value === npsMinVal) return (
                            <g key={`dot-${index}`}>
                              <circle cx={cx} cy={cy} r={6} fill={COLORS.danger} stroke="#fff" strokeWidth={2} />
                              <text x={cx} y={cy + 18} textAnchor="middle" fill={COLORS.danger} fontSize={11} fontWeight="bold">{value}</text>
                            </g>
                          );
                          return <circle key={`dot-${index}`} cx={cx} cy={cy} r={3} fill={COLORS.primary} />;
                        }}
                        activeDot={{ r: 5 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </>
              );
            })()}
          </div>

          {/* Task Completion Rate by Segment - Table */}
          <div style={{
            backgroundColor: COLORS.bgCard,
            padding: '20px',
            borderRadius: '8px',
            border: `1px solid ${COLORS.border}`,
            marginBottom: '30px'
          }}>
            <h3 style={{ marginTop: 0, fontSize: '16px', marginBottom: '15px' }}>Task Completion Rate by Segment</h3>

            {(() => {
              // Get top 5 journeys
              const top5 = journeyData.slice(0, 5);

              // Null-safe helpers
              const validVals = (seg: 'Mass' | 'Premier' | 'Jade') =>
                top5.map(j => j.segments[seg].completion).filter((v): v is number => v != null);
              const safeAvg = (vals: number[]) => vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : null;
              const safeMax = (vals: number[]) => vals.length ? Math.max(...vals) : null;
              const safeMin = (vals: number[]) => vals.length ? Math.min(...vals) : null;

              // Calculate averages
              const avgMass    = safeAvg(validVals('Mass'));
              const avgPremier = safeAvg(validVals('Premier'));
              const avgJade    = safeAvg(validVals('Jade'));

              // Calculate best performance (highest) with journey names
              const bestMassValue    = safeMax(validVals('Mass'));
              const bestMassJourney  = bestMassValue    != null ? top5.find(j => j.segments.Mass.completion    === bestMassValue)?.name    : undefined;
              const bestPremierValue = safeMax(validVals('Premier'));
              const bestPremierJourney = bestPremierValue != null ? top5.find(j => j.segments.Premier.completion === bestPremierValue)?.name : undefined;
              const bestJadeValue    = safeMax(validVals('Jade'));
              const bestJadeJourney  = bestJadeValue    != null ? top5.find(j => j.segments.Jade.completion    === bestJadeValue)?.name    : undefined;

              // Calculate worst performance (lowest) with journey names
              const worstMassValue   = safeMin(validVals('Mass'));
              const worstMassJourney = worstMassValue   != null ? top5.find(j => j.segments.Mass.completion    === worstMassValue)?.name   : undefined;
              const worstPremierValue = safeMin(validVals('Premier'));
              const worstPremierJourney = worstPremierValue != null ? top5.find(j => j.segments.Premier.completion === worstPremierValue)?.name : undefined;
              const worstJadeValue   = safeMin(validVals('Jade'));
              const worstJadeJourney = worstJadeValue   != null ? top5.find(j => j.segments.Jade.completion    === worstJadeValue)?.name   : undefined;

              return (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${COLORS.border}` }}>
                      <th style={{
                        textAlign: 'left',
                        padding: '12px',
                        fontSize: '12px',
                        color: COLORS.textSecondary,
                        fontWeight: 'bold'
                      }}>
                        JOURNEY
                      </th>
                      {(segmentFilter === 'All' || segmentFilter === 'Mass') && (
                        <th style={{
                          textAlign: 'center',
                          padding: '12px',
                          fontSize: '12px',
                          color: COLORS.primary,
                          fontWeight: 'bold'
                        }}>
                          MASS
                        </th>
                      )}
                      {(segmentFilter === 'All' || segmentFilter === 'Premier') && (
                        <th style={{
                          textAlign: 'center',
                          padding: '12px',
                          fontSize: '12px',
                          color: COLORS.success,
                          fontWeight: 'bold'
                        }}>
                          PREMIER
                        </th>
                      )}
                      {(segmentFilter === 'All' || segmentFilter === 'Jade') && (
                        <th style={{
                          textAlign: 'center',
                          padding: '12px',
                          fontSize: '12px',
                          color: COLORS.warning,
                          fontWeight: 'bold'
                        }}>
                          JADE
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Average Row */}
                    <tr style={{
                      borderTop: `2px solid ${COLORS.border}`,
                      backgroundColor: COLORS.bgDark
                    }}>
                      <td style={{
                        padding: '12px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        color: COLORS.textSecondary
                      }}>
                        AVERAGE
                      </td>
                      {(segmentFilter === 'All' || segmentFilter === 'Mass') && (
                        <td style={{ textAlign: 'center', padding: '12px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            backgroundColor: COLORS.primary + '20',
                            border: `1px solid ${COLORS.primary}`,
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: COLORS.primary
                          }}>
                            {avgMass != null ? `${avgMass}%` : '—'}
                            {avgMass != null && <span style={{ color: COLORS.success }}>▲</span>}
                          </span>
                        </td>
                      )}
                      {(segmentFilter === 'All' || segmentFilter === 'Premier') && (
                        <td style={{ textAlign: 'center', padding: '12px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            backgroundColor: COLORS.success + '20',
                            border: `1px solid ${COLORS.success}`,
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: COLORS.success
                          }}>
                            {avgPremier != null ? `${avgPremier}%` : '—'}
                            {avgPremier != null && <span style={{ color: COLORS.success }}>▲</span>}
                          </span>
                        </td>
                      )}
                      {(segmentFilter === 'All' || segmentFilter === 'Jade') && (
                        <td style={{ textAlign: 'center', padding: '12px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            backgroundColor: COLORS.warning + '20',
                            border: `1px solid ${COLORS.warning}`,
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: COLORS.warning
                          }}>
                            {avgJade != null ? `${avgJade}%` : '—'}
                            {avgJade != null && <span style={{ color: COLORS.success }}>▲</span>}
                          </span>
                        </td>
                      )}
                    </tr>

                    {/* Best Performance Row */}
                    <tr style={{ backgroundColor: COLORS.bgDark }}>
                      <td style={{
                        padding: '12px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        color: COLORS.textSecondary
                      }}>
                        BEST PERFORMANCE
                      </td>
                      {(segmentFilter === 'All' || segmentFilter === 'Mass') && (
                        <td style={{ textAlign: 'center', padding: '12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              backgroundColor: COLORS.success + '20',
                              border: `1px solid ${COLORS.success}`,
                              borderRadius: '20px',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              color: COLORS.success
                            }}>
                              {bestMassValue != null ? `${bestMassValue}%` : '—'}
                            </span>
                            {bestMassJourney && <span style={{
                              padding: '4px 10px',
                              backgroundColor: COLORS.bgCard,
                              border: `1px solid ${COLORS.border}`,
                              borderRadius: '12px',
                              fontSize: '10px',
                              color: COLORS.textSecondary
                            }}>
                              {bestMassJourney}
                            </span>}
                          </div>
                        </td>
                      )}
                      {(segmentFilter === 'All' || segmentFilter === 'Premier') && (
                        <td style={{ textAlign: 'center', padding: '12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              backgroundColor: COLORS.success + '20',
                              border: `1px solid ${COLORS.success}`,
                              borderRadius: '20px',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              color: COLORS.success
                            }}>
                              {bestPremierValue != null ? `${bestPremierValue}%` : '—'}
                            </span>
                            {bestPremierJourney && <span style={{
                              padding: '4px 10px',
                              backgroundColor: COLORS.bgCard,
                              border: `1px solid ${COLORS.border}`,
                              borderRadius: '12px',
                              fontSize: '10px',
                              color: COLORS.textSecondary
                            }}>
                              {bestPremierJourney}
                            </span>}
                          </div>
                        </td>
                      )}
                      {(segmentFilter === 'All' || segmentFilter === 'Jade') && (
                        <td style={{ textAlign: 'center', padding: '12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              backgroundColor: COLORS.success + '20',
                              border: `1px solid ${COLORS.success}`,
                              borderRadius: '20px',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              color: COLORS.success
                            }}>
                              {bestJadeValue != null ? `${bestJadeValue}%` : '—'}
                            </span>
                            {bestJadeJourney && <span style={{
                              padding: '4px 10px',
                              backgroundColor: COLORS.bgCard,
                              border: `1px solid ${COLORS.border}`,
                              borderRadius: '12px',
                              fontSize: '10px',
                              color: COLORS.textSecondary
                            }}>
                              {bestJadeJourney}
                            </span>}
                          </div>
                        </td>
                      )}
                    </tr>

                    {/* Worst Performance Row */}
                    <tr style={{ backgroundColor: COLORS.bgDark }}>
                      <td style={{
                        padding: '12px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        color: COLORS.textSecondary
                      }}>
                        WORST PERFORMANCE
                      </td>
                      {(segmentFilter === 'All' || segmentFilter === 'Mass') && (
                        <td style={{ textAlign: 'center', padding: '12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              backgroundColor: COLORS.danger + '20',
                              border: `1px solid ${COLORS.danger}`,
                              borderRadius: '20px',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              color: COLORS.danger
                            }}>
                              {worstMassValue != null ? `${worstMassValue}%` : '—'}
                            </span>
                            {worstMassJourney && <span style={{
                              padding: '4px 10px',
                              backgroundColor: COLORS.bgCard,
                              border: `1px solid ${COLORS.border}`,
                              borderRadius: '12px',
                              fontSize: '10px',
                              color: COLORS.textSecondary
                            }}>
                              {worstMassJourney}
                            </span>}
                          </div>
                        </td>
                      )}
                      {(segmentFilter === 'All' || segmentFilter === 'Premier') && (
                        <td style={{ textAlign: 'center', padding: '12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              backgroundColor: COLORS.danger + '20',
                              border: `1px solid ${COLORS.danger}`,
                              borderRadius: '20px',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              color: COLORS.danger
                            }}>
                              {worstPremierValue != null ? `${worstPremierValue}%` : '—'}
                            </span>
                            {worstPremierJourney && <span style={{
                              padding: '4px 10px',
                              backgroundColor: COLORS.bgCard,
                              border: `1px solid ${COLORS.border}`,
                              borderRadius: '12px',
                              fontSize: '10px',
                              color: COLORS.textSecondary
                            }}>
                              {worstPremierJourney}
                            </span>}
                          </div>
                        </td>
                      )}
                      {(segmentFilter === 'All' || segmentFilter === 'Jade') && (
                        <td style={{ textAlign: 'center', padding: '12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              backgroundColor: COLORS.danger + '20',
                              border: `1px solid ${COLORS.danger}`,
                              borderRadius: '20px',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              color: COLORS.danger
                            }}>
                              {worstJadeValue != null ? `${worstJadeValue}%` : '—'}
                            </span>
                            {worstJadeJourney && <span style={{
                              padding: '4px 10px',
                              backgroundColor: COLORS.bgCard,
                              border: `1px solid ${COLORS.border}`,
                              borderRadius: '12px',
                              fontSize: '10px',
                              color: COLORS.textSecondary
                            }}>
                              {worstJadeJourney}
                            </span>}
                          </div>
                        </td>
                      )}
                    </tr>
                  </tbody>
                </table>
              );
            })()}
          </div>

          {/* Active Risk Points Section - Moved to end */}
          <div style={{
            backgroundColor: COLORS.bgCard,
            padding: '20px',
            borderRadius: '8px',
            border: `1px solid ${COLORS.border}`
          }}>
            <h3 style={{ marginTop: 0, fontSize: '16px', marginBottom: '15px' }}>
              Active Risk Points (Combined Drop-off & Pain Points)
            </h3>
            {riskAlerts.length === 0 ? (
              <p style={{ color: COLORS.textSecondary }}>No active risk points</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {riskAlerts.map((alert: any) => (
                  <div
                    key={alert.journey}
                    style={{
                      padding: '12px',
                      backgroundColor: COLORS.bgDark,
                      borderRadius: '6px',
                      borderLeft: `4px solid ${alert.risk === 'High' ? COLORS.danger : COLORS.warning}`
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      {alert.journey}
                    </div>
                    <div style={{ fontSize: '12px', color: COLORS.textSecondary, marginBottom: '5px' }}>
                      Drop-off: {alert.dropOff}% ({alert.dropOffRisk} Risk) | Pain Points: {alert.painPointCount} ({alert.painPointRisk} Risk)
                    </div>
                    <div style={{ fontSize: '12px', color: COLORS.textSecondary }}>
                      Combined Risk: <span style={{
                        color: alert.risk === 'High' ? COLORS.danger : alert.risk === 'Medium' ? COLORS.warning : COLORS.success,
                        fontWeight: 'bold'
                      }}>
                        {alert.risk}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOP 10 JOURNEYS TAB */}
      {activeTab === 'Top Tracked Journeys' && (
        <div>
          {/* Sort Controls */}
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ color: COLORS.textSecondary, fontSize: '14px' }}>Sort by:</span>
            {(['nps', 'completion', 'dropOff'] as const).map(sort => (
              <button
                key={sort}
                onClick={() => setSortBy(sort)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: sortBy === sort ? COLORS.primary : COLORS.bgCard,
                  color: COLORS.textPrimary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                {sort === 'nps' ? 'NPS' : sort === 'completion' ? 'Completion' : 'Drop-off'}
              </button>
            ))}
          </div>

          {/* Journeys Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {sortedJourneys.map((journey) => {
              const hasInsights = qualitativeFindings.some((q: any) => q.journey === journey.name);
              const exitInfo = pageExitData[journey.name];
              // OVERALL high risk: max exit page >30% OR overall completion <60%
              const overallForcedHigh = (exitInfo && exitInfo.exitRate > 30) || ((journey.overall.completion ?? 100) < 60);
              const overallRisk = overallForcedHigh ? { label: 'High risk', color: COLORS.danger } : getRiskLevel(journey.overall.completion ?? null);
              const massRisk    = getRiskLevel(journey.segments.Mass.completion    ?? null);
              const premierRisk = getRiskLevel(journey.segments.Premier.completion ?? null);
              const jadeRisk    = getRiskLevel(journey.segments.Jade.completion    ?? null);

              // Helper to render a metric row
              const renderRow = (segment: string, metrics: any, risk: any, segmentColor: string, prevData?: any) => (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '15px',
                  backgroundColor: segment === 'OVERALL' ? 'transparent' : COLORS.bgDark,
                  borderRadius: '8px',
                  gap: '20px'
                }}>
                  {/* Segment Label */}
                  <div style={{ minWidth: '140px' }}>
                    {segment === 'OVERALL' ? (
                      <div>
                        <div style={{ fontSize: '11px', color: COLORS.primary, fontWeight: 'bold' }}>OVERALL</div>
                        <div style={{ fontSize: '12px', color: COLORS.textSecondary, fontStyle: 'italic' }}>All Segments</div>
                      </div>
                    ) : (
                      <div style={{
                        display: 'inline-block',
                        padding: '6px 12px',
                        backgroundColor: segmentColor + '20',
                        border: `1px solid ${segmentColor}`,
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: segmentColor
                      }}>
                        {segment}
                      </div>
                    )}
                  </div>

                  {/* NPS */}
                  <div style={{ flex: '0 0 140px' }}>
                    <div style={{ fontSize: '10px', color: COLORS.textSecondary, marginBottom: '4px' }}>NPS</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '20px', fontWeight: 'bold', color: metrics.nps != null ? getNPSColor(metrics.nps) : COLORS.textSecondary }}>
                        {metrics.nps != null ? metrics.nps : '—'}
                      </span>
                      {prevData && metrics.nps != null && (
                        <span style={{ fontSize: '14px', color: getTrendColor(metrics.nps, prevData.nps, true) }}>
                          {getTrendIndicator(metrics.nps, prevData.nps)}
                        </span>
                      )}
                      {metrics.nps != null && (
                        <div style={{ flex: 1, height: '4px', backgroundColor: COLORS.border, borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(metrics.nps, 100)}%`, height: '100%', backgroundColor: getNPSColor(metrics.nps) }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* COMPLETION */}
                  <div style={{ flex: '0 0 160px' }}>
                    <div style={{ fontSize: '10px', color: COLORS.textSecondary, marginBottom: '4px' }}>COMPLETION</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '20px', fontWeight: 'bold', color: COLORS.textPrimary }}>
                        {metrics.completion != null ? `${metrics.completion}%` : '—'}
                      </span>
                      {prevData && metrics.completion != null && (
                        <span style={{ fontSize: '14px', color: getTrendColor(metrics.completion, prevData.completion, true) }}>
                          {getTrendIndicator(metrics.completion, prevData.completion)}
                        </span>
                      )}
                      {metrics.completion != null && (
                        <div style={{ flex: 1, height: '4px', backgroundColor: COLORS.border, borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${metrics.completion}%`, height: '100%', backgroundColor: COLORS.success }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* MAX EXIT PAGE / DROP-OFF */}
                  <div style={{ flex: '1 1 160px', minWidth: '120px' }}>
                    {(() => {
                      const exitInfo = pageExitData[journey.name];
                      if (exitInfo) {
                        // Exit data available: OVERALL shows page + rate, segments show --
                        if (segment === 'OVERALL') {
                          return (
                            <>
                              <div style={{ fontSize: '10px', color: COLORS.textSecondary, marginBottom: '4px' }}>MAX EXIT PAGE</div>
                              <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{exitInfo.page}</div>
                              <span style={{ fontSize: '20px', fontWeight: 'bold', color: exitInfo.exitRate >= 30 ? COLORS.danger : COLORS.textPrimary }}>{exitInfo.exitRate}%</span>
                            </>
                          );
                        }
                        return (
                          <>
                            <div style={{ fontSize: '10px', color: COLORS.textSecondary, marginBottom: '4px' }}>MAX EXIT PAGE</div>
                            <span style={{ fontSize: '20px', fontWeight: 'bold', color: COLORS.textSecondary }}>—</span>
                          </>
                        );
                      }
                      return (
                        <>
                          <div style={{ fontSize: '10px', color: COLORS.textSecondary, marginBottom: '4px' }}>DROP-OFF</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '20px', fontWeight: 'bold', color: (metrics.dropOff ?? 0) >= 30 ? COLORS.danger : COLORS.textPrimary }}>
                              {metrics.dropOff != null ? `${metrics.dropOff}%` : '—'}
                            </span>
                            {prevData && metrics.dropOff != null && (
                              <span style={{ fontSize: '14px', color: getTrendColor(metrics.dropOff, prevData.dropOff, false) }}>
                                {getTrendIndicator(metrics.dropOff, prevData.dropOff)}
                              </span>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Risk Tag — only shown when data is available */}
                  {risk && <div style={{ marginLeft: 'auto' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      backgroundColor: risk.color + '20',
                      border: `1px solid ${risk.color}`,
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: risk.color
                    }}>
                      <span>⚠</span>
                      {risk.label}
                    </div>
                  </div>}
                </div>
              );

              return (
                <div
                  key={journey.name}
                  style={{
                    backgroundColor: COLORS.bgCard,
                    borderRadius: '8px',
                    border: `1px solid ${COLORS.border}`,
                    padding: '20px'
                  }}
                >
                  {/* Journey Name and Insights Button */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    paddingBottom: '15px',
                    borderBottom: `1px solid ${COLORS.border}`
                  }}>
                    <h3 style={{ margin: 0, fontSize: '20px' }}>{journey.name}</h3>
                    {hasInsights && (
                      <button
                        onClick={() => navigateToInsights(journey.name)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: COLORS.primary,
                          color: COLORS.textPrimary,
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        💡 Insights
                      </button>
                    )}
                  </div>

                  {/* 4 Rows: Overall, Mass, Premier, Jade - Filtered by segment */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {renderRow('OVERALL', journey.overall, overallRisk, COLORS.primary, { nps: journey.prevNps, completion: journey.prevCompletion, dropOff: journey.prevDropOff })}
                    {(segmentFilter === 'All' || segmentFilter === 'Mass') && renderRow('Mass', journey.segments.Mass, massRisk, COLORS.primary)}
                    {(segmentFilter === 'All' || segmentFilter === 'Premier') && renderRow('Premier', journey.segments.Premier, premierRisk, COLORS.success)}
                    {(segmentFilter === 'All' || segmentFilter === 'Jade') && renderRow('Jade', journey.segments.Jade, jadeRisk, COLORS.warning)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RISK ALERTS TAB */}
      {activeTab === 'Risk Alerts' && (
        <div>
          <div style={{
            backgroundColor: COLORS.bgCard,
            padding: '20px',
            borderRadius: '8px',
            border: `1px solid ${COLORS.border}`,
            marginBottom: '20px'
          }}>
            <h3 style={{ marginTop: 0, fontSize: '18px', marginBottom: '10px' }}>
              Risk Classification Criteria
            </h3>
            <div style={{ fontSize: '13px', color: COLORS.textSecondary, lineHeight: '1.8' }}>
              <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>Drop-off Rate Risk (= 100% − Completion):</div>
              <div>🔴 <span style={{ color: COLORS.danger, fontWeight: 'bold' }}>High:</span> Drop-off ≥ 45% (Completion ≤ 55%)</div>
              <div>🟡 <span style={{ color: COLORS.warning, fontWeight: 'bold' }}>Medium:</span> Drop-off 30–44% (Completion 56–70%)</div>
              <div style={{ marginBottom: '10px' }}>🟢 <span style={{ color: COLORS.success, fontWeight: 'bold' }}>Low:</span> Drop-off &lt; 30% (Completion &gt; 70%)</div>

              <div style={{ marginBottom: '10px', fontWeight: 'bold', marginTop: '15px' }}>Pain Points Risk:</div>
              <div>🔴 <span style={{ color: COLORS.danger, fontWeight: 'bold' }}>High:</span> &gt; 15 pain points</div>
              <div>🟡 <span style={{ color: COLORS.warning, fontWeight: 'bold' }}>Medium:</span> 10-15 pain points</div>
              <div>🟢 <span style={{ color: COLORS.success, fontWeight: 'bold' }}>Low:</span> &lt; 10 pain points</div>

              <div style={{ marginTop: '15px', fontSize: '12px', fontStyle: 'italic' }}>
                Combined risk uses both metrics with priority logic (High+High=High, High+Medium=High, High+Low=Medium, Medium+Medium=Medium, Medium+Low=Low, Low+Low=Low)
              </div>
            </div>
          </div>

          {riskAlerts.length === 0 ? (
            <div style={{
              backgroundColor: COLORS.bgCard,
              padding: '40px',
              borderRadius: '8px',
              border: `1px solid ${COLORS.border}`,
              textAlign: 'center',
              color: COLORS.textSecondary
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>✅</div>
              <div style={{ fontSize: '16px' }}>No active risk alerts - all journeys performing well!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {riskAlerts.map((alert: any) => {
                const journeyFeedback = qualitativeFindings.find((q: any) => q.journey === alert.journey);
                const painPoints = journeyFeedback
                  ? journeyFeedback.issues.filter((issue: any) => issue.type === 'Pain Point')
                  : [];

                return (
                  <div
                    key={alert.journey}
                    style={{
                      backgroundColor: COLORS.bgCard,
                      padding: '20px',
                      borderRadius: '8px',
                      border: `1px solid ${COLORS.border}`,
                      borderLeft: `5px solid ${alert.risk === 'High' ? COLORS.danger : alert.risk === 'Medium' ? COLORS.warning : COLORS.success}`
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px'
                    }}>
                      <h4 style={{ margin: 0, fontSize: '18px' }}>{alert.journey}</h4>
                      <div style={{
                        padding: '6px 12px',
                        backgroundColor: alert.risk === 'High' ? COLORS.danger : alert.risk === 'Medium' ? COLORS.warning : COLORS.success,
                        color: COLORS.textPrimary,
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {alert.risk} RISK
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '15px',
                      marginBottom: '12px'
                    }}>
                      <div>
                        <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginBottom: '5px' }}>
                          DROP-OFF RATE
                        </div>
                        <div style={{
                          fontSize: '28px',
                          fontWeight: 'bold',
                          color: alert.dropOffRisk === 'High' ? COLORS.danger : alert.dropOffRisk === 'Medium' ? COLORS.warning : COLORS.success
                        }}>
                          {alert.dropOff}%
                        </div>
                        <div style={{ fontSize: '11px', color: COLORS.textSecondary }}>
                          ({alert.dropOffRisk} Risk)
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginBottom: '5px' }}>
                          PAIN POINTS
                        </div>
                        <div style={{
                          fontSize: '28px',
                          fontWeight: 'bold',
                          color: alert.painPointRisk === 'High' ? COLORS.danger : alert.painPointRisk === 'Medium' ? COLORS.warning : COLORS.success
                        }}>
                          {alert.painPointCount}
                        </div>
                        <div style={{ fontSize: '11px', color: COLORS.textSecondary }}>
                          ({alert.painPointRisk} Risk)
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginBottom: '5px' }}>
                          RECOMMENDED ACTION
                        </div>
                        <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                          {alert.action}
                        </div>
                      </div>
                    </div>

                    {/* Qualitative Insights */}
                    {painPoints.length > 0 && (
                      <div style={{
                        marginTop: '15px',
                        padding: '12px',
                        backgroundColor: COLORS.bgDark,
                        borderRadius: '6px',
                        borderTop: `2px solid ${COLORS.border}`
                      }}>
                        <div style={{
                          fontSize: '11px',
                          color: COLORS.textSecondary,
                          fontWeight: 'bold',
                          marginBottom: '10px',
                          textTransform: 'uppercase'
                        }}>
                          💬 Qualitative Insights (Pain Points)
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {painPoints.map((painPoint: any, idx: number) => (
                            <div key={idx} style={{
                              fontSize: '13px',
                              lineHeight: '1.5',
                              paddingLeft: '10px',
                              borderLeft: `2px solid ${COLORS.danger}`
                            }}>
                              ⚠️ {painPoint.text}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* QUALITATIVE FINDINGS TAB */}
      {activeTab === 'Qualitative Findings' && (
        <div ref={qualitativeSectionRef}>
          {qualitativeFindings.map((item: any) => (
            <div
              key={item.journey}
              style={{
                backgroundColor: COLORS.bgCard,
                padding: '20px',
                borderRadius: '8px',
                border: `1px solid ${COLORS.border}`,
                marginBottom: '20px'
              }}
            >
              <h3 style={{ marginTop: 0, fontSize: '18px', marginBottom: '15px' }}>
                {item.journey}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {item.issues.map((issue: any, idx: number) => {
                  let badgeColor = COLORS.danger;
                  let badgeIcon = '⚠️';
                  if (issue.type === 'Insight') {
                    badgeColor = COLORS.primary;
                    badgeIcon = '💡';
                  } else if (issue.type === 'Opportunity') {
                    badgeColor = COLORS.success;
                    badgeIcon = '🎯';
                  }

                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '12px',
                        backgroundColor: COLORS.bgDark,
                        borderRadius: '6px',
                        borderLeft: `3px solid ${badgeColor}`,
                        display: 'flex',
                        gap: '12px'
                      }}
                    >
                      <div style={{ fontSize: '20px' }}>{badgeIcon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '11px',
                          fontWeight: 'bold',
                          color: badgeColor,
                          marginBottom: '5px',
                          textTransform: 'uppercase'
                        }}>
                          {issue.type}
                        </div>
                        <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                          {issue.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
