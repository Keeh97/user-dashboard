import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import {
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
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
    name: 'Onboarding',
    overall: { nps: 72, completion: 88, dropOff: 12 },
    segments: {
      Mass: { nps: 68, completion: 86, dropOff: 14 },
      Premier: { nps: 79, completion: 92, dropOff: 8 },
      Jade: { nps: 85, completion: 95, dropOff: 5 }
    },
    prevNps: 68,
    prevCompletion: 85,
    prevDropOff: 15
  },
  {
    name: 'Fund Transfer',
    overall: { nps: 65, completion: 92, dropOff: 8 },
    segments: {
      Mass: { nps: 61, completion: 90, dropOff: 10 },
      Premier: { nps: 72, completion: 95, dropOff: 5 },
      Jade: { nps: 80, completion: 97, dropOff: 3 }
    },
    prevNps: 63,
    prevCompletion: 90,
    prevDropOff: 10
  },
  {
    name: 'Bill Payment',
    overall: { nps: 58, completion: 85, dropOff: 15 },
    segments: {
      Mass: { nps: 55, completion: 83, dropOff: 17 },
      Premier: { nps: 64, completion: 89, dropOff: 11 },
      Jade: { nps: 70, completion: 92, dropOff: 8 }
    },
    prevNps: 60,
    prevCompletion: 87,
    prevDropOff: 13
  },
  {
    name: 'Loan Application',
    overall: { nps: 42, completion: 65, dropOff: 35 },
    segments: {
      Mass: { nps: 38, completion: 61, dropOff: 39 },
      Premier: { nps: 49, completion: 72, dropOff: 28 },
      Jade: { nps: 55, completion: 80, dropOff: 20 }
    },
    prevNps: 45,
    prevCompletion: 68,
    prevDropOff: 32
  },
  {
    name: 'Card Management',
    overall: { nps: 51, completion: 78, dropOff: 22 },
    segments: {
      Mass: { nps: 48, completion: 75, dropOff: 25 },
      Premier: { nps: 56, completion: 83, dropOff: 17 },
      Jade: { nps: 62, completion: 88, dropOff: 12 }
    },
    prevNps: 49,
    prevCompletion: 76,
    prevDropOff: 24
  },
  {
    name: 'Investment Portfolio',
    overall: { nps: 67, completion: 71, dropOff: 29 },
    segments: {
      Mass: { nps: 62, completion: 68, dropOff: 32 },
      Premier: { nps: 74, completion: 76, dropOff: 24 },
      Jade: { nps: 82, completion: 85, dropOff: 15 }
    },
    prevNps: 70,
    prevCompletion: 73,
    prevDropOff: 27
  },
  {
    name: 'Account Opening',
    overall: { nps: 33, completion: 58, dropOff: 42 },
    segments: {
      Mass: { nps: 28, completion: 54, dropOff: 46 },
      Premier: { nps: 41, completion: 65, dropOff: 35 },
      Jade: { nps: 50, completion: 72, dropOff: 28 }
    },
    prevNps: 35,
    prevCompletion: 60,
    prevDropOff: 40
  },
  {
    name: 'Statement Download',
    overall: { nps: 48, completion: 81, dropOff: 19 },
    segments: {
      Mass: { nps: 44, completion: 79, dropOff: 21 },
      Premier: { nps: 54, completion: 85, dropOff: 15 },
      Jade: { nps: 62, completion: 90, dropOff: 10 }
    },
    prevNps: 50,
    prevCompletion: 82,
    prevDropOff: 18
  },
  {
    name: 'Insurance Purchase',
    overall: { nps: 29, completion: 52, dropOff: 48 },
    segments: {
      Mass: { nps: 24, completion: 48, dropOff: 52 },
      Premier: { nps: 37, completion: 59, dropOff: 41 },
      Jade: { nps: 45, completion: 68, dropOff: 32 }
    },
    prevNps: 31,
    prevCompletion: 55,
    prevDropOff: 45
  },
  {
    name: 'Customer Support',
    overall: { nps: 55, completion: 73, dropOff: 27 },
    segments: {
      Mass: { nps: 52, completion: 70, dropOff: 30 },
      Premier: { nps: 60, completion: 78, dropOff: 22 },
      Jade: { nps: 68, completion: 85, dropOff: 15 }
    },
    prevNps: 53,
    prevCompletion: 71,
    prevDropOff: 29
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

function App() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'nps' | 'completion' | 'dropOff'>('nps');
  const [journeyData, setJourneyData] = useState(top10Journeys);
  const [qualitativeFindings, setQualitativeFindings] = useState(qualitativeData);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [prevKPIs, setPrevKPIs] = useState({ nps: 48, completion: 71, riskPoints: 5 });
  const [segmentFilter, setSegmentFilter] = useState<'All' | 'Mass' | 'Premier' | 'Jade'>('All');
  const qualitativeSectionRef = useRef<HTMLDivElement>(null);

  // Calculate metrics based on segment filter
  const overallNPS = Math.round(
    segmentFilter === 'All'
      ? journeyData.reduce((sum: number, j: any) => sum + j.overall.nps, 0) / journeyData.length
      : journeyData.reduce((sum: number, j: any) => sum + j.segments[segmentFilter].nps, 0) / journeyData.length
  );
  const avgCompletion = Math.round(
    segmentFilter === 'All'
      ? journeyData.reduce((sum: number, j: any) => sum + j.overall.completion, 0) / journeyData.length
      : journeyData.reduce((sum: number, j: any) => sum + j.segments[segmentFilter].completion, 0) / journeyData.length
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

      // Get individual risk levels based on segment filter
      const dropOff = segmentFilter === 'All' ? j.overall.dropOff : j.segments[segmentFilter].dropOff;
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

  // Risk level helper based on drop-off rate
  const getRiskLevel = (dropOff: number) => {
    if (dropOff > 30) return { label: 'High risk', color: COLORS.danger };
    if (dropOff >= 15) return { label: 'Medium risk', color: COLORS.warning };
    if (dropOff >= 10) return { label: 'Low risk', color: '#fbbf24' }; // Lighter yellow
    return { label: 'Normal', color: COLORS.success };
  };

  // Navigate to Qualitative Findings
  const navigateToInsights = (journeyName: string) => {
    setActiveTab('Qualitative Findings');
    setTimeout(() => {
      qualitativeSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
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

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: COLORS.bgDark,
      color: COLORS.textPrimary,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '20px'
    }}>
      {/* Header with Hamburger Menu */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '30px',
        position: 'relative'
      }}>
        {/* Hamburger Menu */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            background: 'none',
            border: 'none',
            color: COLORS.textPrimary,
            fontSize: '28px',
            cursor: 'pointer',
            padding: '10px',
            marginRight: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px'
          }}
        >
          <div style={{ width: '25px', height: '3px', backgroundColor: COLORS.textPrimary }}></div>
          <div style={{ width: '25px', height: '3px', backgroundColor: COLORS.textPrimary }}></div>
          <div style={{ width: '25px', height: '3px', backgroundColor: COLORS.textPrimary }}></div>
        </button>

        <h1 style={{ margin: 0, fontSize: '24px' }}>User Research Monitoring Dashboard</h1>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div style={{
            position: 'absolute',
            top: '60px',
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
                backgroundColor: 'transparent',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.border}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              💬 Upload Qualitative Data
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
            {segmentFilter === 'All' && (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={npsTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                  <XAxis dataKey="month" stroke={COLORS.textSecondary} />
                  <YAxis stroke={COLORS.textSecondary} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: COLORS.bgCard,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '6px'
                    }}
                  />
                  <Line type="monotone" dataKey="nps" stroke={COLORS.primary} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
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

              // Calculate averages
              const avgMass = Math.round(top5.reduce((sum, j) => sum + j.segments.Mass.completion, 0) / top5.length);
              const avgPremier = Math.round(top5.reduce((sum, j) => sum + j.segments.Premier.completion, 0) / top5.length);
              const avgJade = Math.round(top5.reduce((sum, j) => sum + j.segments.Jade.completion, 0) / top5.length);

              // Calculate best performance (highest) with journey names
              const bestMassValue = Math.max(...top5.map(j => j.segments.Mass.completion));
              const bestMassJourney = top5.find(j => j.segments.Mass.completion === bestMassValue)?.name;

              const bestPremierValue = Math.max(...top5.map(j => j.segments.Premier.completion));
              const bestPremierJourney = top5.find(j => j.segments.Premier.completion === bestPremierValue)?.name;

              const bestJadeValue = Math.max(...top5.map(j => j.segments.Jade.completion));
              const bestJadeJourney = top5.find(j => j.segments.Jade.completion === bestJadeValue)?.name;

              // Calculate worst performance (lowest) with journey names
              const worstMassValue = Math.min(...top5.map(j => j.segments.Mass.completion));
              const worstMassJourney = top5.find(j => j.segments.Mass.completion === worstMassValue)?.name;

              const worstPremierValue = Math.min(...top5.map(j => j.segments.Premier.completion));
              const worstPremierJourney = top5.find(j => j.segments.Premier.completion === worstPremierValue)?.name;

              const worstJadeValue = Math.min(...top5.map(j => j.segments.Jade.completion));
              const worstJadeJourney = top5.find(j => j.segments.Jade.completion === worstJadeValue)?.name;

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
                            {avgMass}%
                            <span style={{ color: COLORS.success }}>▲</span>
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
                            {avgPremier}%
                            <span style={{ color: COLORS.success }}>▲</span>
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
                            {avgJade}%
                            <span style={{ color: COLORS.success }}>▲</span>
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
                              {bestMassValue}%
                              <span>▲</span>
                            </span>
                            <span style={{
                              padding: '4px 10px',
                              backgroundColor: COLORS.bgCard,
                              border: `1px solid ${COLORS.border}`,
                              borderRadius: '12px',
                              fontSize: '10px',
                              color: COLORS.textSecondary
                            }}>
                              {bestMassJourney}
                            </span>
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
                              {bestPremierValue}%
                              <span>▲</span>
                            </span>
                            <span style={{
                              padding: '4px 10px',
                              backgroundColor: COLORS.bgCard,
                              border: `1px solid ${COLORS.border}`,
                              borderRadius: '12px',
                              fontSize: '10px',
                              color: COLORS.textSecondary
                            }}>
                              {bestPremierJourney}
                            </span>
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
                              {bestJadeValue}%
                              <span>▲</span>
                            </span>
                            <span style={{
                              padding: '4px 10px',
                              backgroundColor: COLORS.bgCard,
                              border: `1px solid ${COLORS.border}`,
                              borderRadius: '12px',
                              fontSize: '10px',
                              color: COLORS.textSecondary
                            }}>
                              {bestJadeJourney}
                            </span>
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
                              {worstMassValue}%
                              <span>▼</span>
                            </span>
                            <span style={{
                              padding: '4px 10px',
                              backgroundColor: COLORS.bgCard,
                              border: `1px solid ${COLORS.border}`,
                              borderRadius: '12px',
                              fontSize: '10px',
                              color: COLORS.textSecondary
                            }}>
                              {worstMassJourney}
                            </span>
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
                              {worstPremierValue}%
                              <span>▼</span>
                            </span>
                            <span style={{
                              padding: '4px 10px',
                              backgroundColor: COLORS.bgCard,
                              border: `1px solid ${COLORS.border}`,
                              borderRadius: '12px',
                              fontSize: '10px',
                              color: COLORS.textSecondary
                            }}>
                              {worstPremierJourney}
                            </span>
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
                              {worstJadeValue}%
                              <span>▼</span>
                            </span>
                            <span style={{
                              padding: '4px 10px',
                              backgroundColor: COLORS.bgCard,
                              border: `1px solid ${COLORS.border}`,
                              borderRadius: '12px',
                              fontSize: '10px',
                              color: COLORS.textSecondary
                            }}>
                              {worstJadeJourney}
                            </span>
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
              const overallRisk = getRiskLevel(journey.overall.dropOff);
              const massRisk = getRiskLevel(journey.segments.Mass.dropOff);
              const premierRisk = getRiskLevel(journey.segments.Premier.dropOff);
              const jadeRisk = getRiskLevel(journey.segments.Jade.dropOff);

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
                      <span style={{ fontSize: '20px', fontWeight: 'bold', color: getNPSColor(metrics.nps) }}>
                        {metrics.nps}
                      </span>
                      {prevData && (
                        <span style={{ fontSize: '14px', color: getTrendColor(metrics.nps, prevData.nps, true) }}>
                          {getTrendIndicator(metrics.nps, prevData.nps)}
                        </span>
                      )}
                      <div style={{
                        flex: 1,
                        height: '4px',
                        backgroundColor: COLORS.border,
                        borderRadius: '2px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${Math.min(metrics.nps, 100)}%`,
                          height: '100%',
                          backgroundColor: getNPSColor(metrics.nps)
                        }} />
                      </div>
                    </div>
                  </div>

                  {/* COMPLETION */}
                  <div style={{ flex: '0 0 160px' }}>
                    <div style={{ fontSize: '10px', color: COLORS.textSecondary, marginBottom: '4px' }}>COMPLETION</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '20px', fontWeight: 'bold', color: COLORS.textPrimary }}>
                        {metrics.completion}%
                      </span>
                      {prevData && (
                        <span style={{ fontSize: '14px', color: getTrendColor(metrics.completion, prevData.completion, true) }}>
                          {getTrendIndicator(metrics.completion, prevData.completion)}
                        </span>
                      )}
                      <div style={{
                        flex: 1,
                        height: '4px',
                        backgroundColor: COLORS.border,
                        borderRadius: '2px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${metrics.completion}%`,
                          height: '100%',
                          backgroundColor: COLORS.success
                        }} />
                      </div>
                    </div>
                  </div>

                  {/* DROP-OFF */}
                  <div style={{ flex: '0 0 120px' }}>
                    <div style={{ fontSize: '10px', color: COLORS.textSecondary, marginBottom: '4px' }}>DROP-OFF</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '20px', fontWeight: 'bold', color: metrics.dropOff >= 30 ? COLORS.danger : COLORS.textPrimary }}>
                        {metrics.dropOff}%
                      </span>
                      {prevData && (
                        <span style={{ fontSize: '14px', color: getTrendColor(metrics.dropOff, prevData.dropOff, false) }}>
                          {getTrendIndicator(metrics.dropOff, prevData.dropOff)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Risk Tag */}
                  <div style={{ marginLeft: 'auto' }}>
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
                      <span>{risk.label === 'Normal' ? '✓' : '⚠'}</span>
                      {risk.label}
                    </div>
                  </div>
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
              <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>Drop-off Rate Risk:</div>
              <div>🔴 <span style={{ color: COLORS.danger, fontWeight: 'bold' }}>High:</span> Drop-off ≥ 45%</div>
              <div>🟡 <span style={{ color: COLORS.warning, fontWeight: 'bold' }}>Medium:</span> Drop-off 30-44%</div>
              <div style={{ marginBottom: '10px' }}>🟢 <span style={{ color: COLORS.success, fontWeight: 'bold' }}>Low:</span> Drop-off &lt; 30%</div>

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
