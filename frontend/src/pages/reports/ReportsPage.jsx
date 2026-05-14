import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import { motion } from 'framer-motion';
import { 
  DollarSign, TrendingUp, Package, BarChart3, Activity, AlertTriangle, 
  CheckCircle, ArrowUpRight, ArrowDownRight, Download, Filter, Printer, Share2, 
  Brain, Zap, Calendar
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
  ComposedChart
} from 'recharts';
import toast from 'react-hot-toast';
import { useCurrency } from '../../contexts/CurrencyContext';

// --- Dummy Data ---

// A minimal valid PDF encoded in Base64 so the browser doesn't throw a parsing error
const BLANK_PDF_BASE64 = 'JVBERi0xLjQNCiUgQSBtaW5pbWFsIHZhbGlkIFBERg0KMSAwIG9iag0KPDwvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFI+Pg0KZW5kb2JqDQoyIDAgb2JqDQo8PC9UeXBlIC9QYWdlcyAvS2lkcyBbMyAwIFJdIC9Db3VudCAxPj4NCmVuZG9iag0KMyAwIG9iag0KPDwvVHlwZSAvUGFnZSAvUGFyZW50IDIgMCBSIC9NZWRpYUJveCBbMCAwIDYxMiA3OTJdIC9SZXNvdXJjZXMgPDwgL0ZvbnQgPDwgL0YxIDQgMCBSID4+ID4+IC9Db250ZW50cyA1IDAgUj4+DQplbmRvYmoNCjQgMCBvYmoNCjw8L1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhPj4NCmVuZG9iag0KNSAwIG9iag0KPDwvTGVuZ3RoIDY5Pj4NCnN0cmVhbQ0KQlQNCi9GMSAyNCBUZg0KMTAwIDcwMCBUZA0KKExlYXRoZXJQcm8gUmVwb3J0IC0gRHVtbXkgUERGKSBUag0KRVQNCmVuZHN0cmVhbQ0KZW5kb2JqDQp4cmVmDQowIDYNCjAwMDAwMDAwMDAgNjU1MzUgZiANCjAwMDAwMDAwNDYgMDAwMDAgbiANCjAwMDAwMDAwOTkgMDAwMDAgbiANCjAwMDAwMDAxNTYgMDAwMDAgbiANCjAwMDAwMDAyOTUgMDAwMDAgbiANCjAwMDAwMDAzODMgMDAwMDAgbiANCnRyYWlsZXINCjw8L1NpemUgNiAvUm9vdCAxIDAgUj4+DQpzdGFydHhyZWYNCjUwNg0KJSVFT0YNCg==';

const base64ToBlob = (base64, type = 'application/pdf') => {
  const binStr = window.atob(base64);
  const len = binStr.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    arr[i] = binStr.charCodeAt(i);
  }
  return new Blob([arr], { type: type });
};

const COLORS = ['#D35400', '#2C3E50', '#27AE60', '#F39C12', '#8E44AD'];

const MOCK_DATA_SETS = {
  'This Month': {
    kpiData: [
      { id: 1, title: 'Total Revenue', value: '$420K', change: '+5.2%', trend: 'up', icon: DollarSign, color: '#27AE60' },
      { id: 2, title: 'Monthly Profit', value: '$85K', change: '+3.1%', trend: 'up', icon: TrendingUp, color: '#2980B9' },
      { id: 3, title: 'Total Orders', value: '210', change: '+1.5%', trend: 'up', icon: Package, color: '#8E44AD' },
      { id: 4, title: 'Inventory Value', value: '$810K', change: '-1.2%', trend: 'down', icon: BarChart3, color: '#D35400' },
      { id: 5, title: 'Production Eff.', value: '96%', change: '+2.0%', trend: 'up', icon: Activity, color: '#16A085' },
      { id: 6, title: 'Wastage Rate', value: '2.8%', change: '-0.4%', trend: 'down', icon: AlertTriangle, color: '#C0392B' },
    ],
    salesTrendData: [
      { month: 'Week 1', revenue: 95000, profit: 18000 },
      { month: 'Week 2', revenue: 110000, profit: 22000 },
      { month: 'Week 3', revenue: 105000, profit: 20000 },
      { month: 'Week 4', revenue: 110000, profit: 25000 },
    ],
    revenueDistributionData: [
      { name: 'Full Grain Leather', value: 50 },
      { name: 'Top Grain Leather', value: 25 },
      { name: 'Genuine Leather', value: 15 },
      { name: 'Suede', value: 10 },
    ],
    productionData: [
      { day: 'Mon', target: 120, actual: 125 },
      { day: 'Tue', target: 120, actual: 118 },
      { day: 'Wed', target: 120, actual: 130 },
      { day: 'Thu', target: 120, actual: 122 },
      { day: 'Fri', target: 120, actual: 120 },
      { day: 'Sat', target: 80, actual: 85 },
      { day: 'Sun', target: 0, actual: 0 },
    ],
    financialData: [
      { category: 'Raw Materials', amount: 85000 },
      { category: 'Labor', amount: 42000 },
      { category: 'Machinery', amount: 15000 },
      { category: 'Utilities', amount: 8000 },
      { category: 'Logistics', amount: 12000 },
    ],
    machineUtilizationData: [
      { day: 'Mon', usage: 88 },
      { day: 'Tue', usage: 94 },
      { day: 'Wed', usage: 91 },
      { day: 'Thu', usage: 96 },
      { day: 'Fri', usage: 85 },
      { day: 'Sat', usage: 65 },
      { day: 'Sun', usage: 0 },
    ],
    cashFlowData: [
      { month: 'Wk 1', inflow: 45000, outflow: 30000 },
      { month: 'Wk 2', inflow: 52000, outflow: 32000 },
      { month: 'Wk 3', inflow: 48000, outflow: 29000 },
      { month: 'Wk 4', inflow: 55000, outflow: 35000 },
    ],
    defectDistributionData: [
      { name: 'Scratches', value: 40 },
      { name: 'Color Variation', value: 20 },
      { name: 'Thickness Issue', value: 25 },
      { name: 'Tear/Hole', value: 10 },
      { name: 'Other', value: 5 },
    ],
    qualityTrendData: [
      { week: 'Day 1', passRate: 96.5 },
      { week: 'Day 2', passRate: 97.1 },
      { week: 'Day 3', passRate: 95.8 },
      { week: 'Day 4', passRate: 98.0 },
      { week: 'Day 5', passRate: 98.4 },
    ],
    aiInsights: [
      { id: 1, type: 'success', title: 'SHORT TERM SURGE', message: 'Recent batch efficiency peaked at 96%. Keep active settings unchanged.', confidence: 94 },
      { id: 2, type: 'info', title: 'RESOURCE ADJUSTMENT', message: 'Logistics costs down 4% this week due to optimized local delivery staging.', confidence: 85 },
    ]
  },
  'Last 3 Months': {
    kpiData: [
      { id: 1, title: 'Total Revenue', value: '$1.1M', change: '+8.4%', trend: 'up', icon: DollarSign, color: '#27AE60' },
      { id: 2, title: 'Monthly Profit', value: '$210K', change: '+5.0%', trend: 'up', icon: TrendingUp, color: '#2980B9' },
      { id: 3, title: 'Total Orders', value: '580', change: '-1.0%', trend: 'down', icon: Package, color: '#8E44AD' },
      { id: 4, title: 'Inventory Value', value: '$830K', change: '+2.4%', trend: 'up', icon: BarChart3, color: '#D35400' },
      { id: 5, title: 'Production Eff.', value: '93%', change: '+0.8%', trend: 'up', icon: Activity, color: '#16A085' },
      { id: 6, title: 'Wastage Rate', value: '3.4%', change: '+0.2%', trend: 'up', icon: AlertTriangle, color: '#C0392B' },
    ],
    salesTrendData: [
      { month: 'Month -3', revenue: 320000, profit: 62000 },
      { month: 'Month -2', revenue: 350000, profit: 70000 },
      { month: 'Last Month', revenue: 430000, profit: 78000 },
    ],
    revenueDistributionData: [
      { name: 'Full Grain Leather', value: 42 },
      { name: 'Top Grain Leather', value: 32 },
      { name: 'Genuine Leather', value: 16 },
      { name: 'Suede', value: 10 },
    ],
    productionData: [
      { day: 'Mon', target: 450, actual: 440 },
      { day: 'Tue', target: 450, actual: 460 },
      { day: 'Wed', target: 450, actual: 455 },
      { day: 'Thu', target: 450, actual: 470 },
      { day: 'Fri', target: 450, actual: 430 },
      { day: 'Sat', target: 250, actual: 260 },
      { day: 'Sun', target: 0, actual: 0 },
    ],
    financialData: [
      { category: 'Raw Materials', amount: 220000 },
      { category: 'Labor', amount: 110000 },
      { category: 'Machinery', amount: 42000 },
      { category: 'Utilities', amount: 21000 },
      { category: 'Logistics', amount: 32000 },
    ],
    machineUtilizationData: [
      { day: 'Mon', usage: 83 },
      { day: 'Tue', usage: 90 },
      { day: 'Wed', usage: 86 },
      { day: 'Thu', usage: 92 },
      { day: 'Fri', usage: 80 },
      { day: 'Sat', usage: 55 },
      { day: 'Sun', usage: 0 },
    ],
    cashFlowData: [
      { month: 'M-3', inflow: 95000, outflow: 65000 },
      { month: 'M-2', inflow: 110000, outflow: 75000 },
      { month: 'M-1', inflow: 125000, outflow: 80000 },
    ],
    defectDistributionData: [
      { name: 'Scratches', value: 32 },
      { name: 'Color Variation', value: 28 },
      { name: 'Thickness Issue', value: 22 },
      { name: 'Tear/Hole', value: 13 },
      { name: 'Other', value: 5 },
    ],
    qualityTrendData: [
      { week: 'Wk 1', passRate: 94.2 },
      { week: 'Wk 4', passRate: 95.1 },
      { week: 'Wk 8', passRate: 96.0 },
      { week: 'Wk 12', passRate: 97.2 },
    ],
    aiInsights: [
      { id: 1, type: 'warning', title: 'SUPPLIER BOTTLENECK', message: 'Tannery shipments experienced moderate fluctuations over the 90-day window.', confidence: 89 },
    ]
  },
  'Last 6 Months': {
    kpiData: [
      { id: 1, title: 'Total Revenue', value: '$2.4M', change: '+12.5%', trend: 'up', icon: DollarSign, color: '#27AE60' },
      { id: 2, title: 'Monthly Profit', value: '$450K', change: '+8.2%', trend: 'up', icon: TrendingUp, color: '#2980B9' },
      { id: 3, title: 'Total Orders', value: '1,248', change: '-2.4%', trend: 'down', icon: Package, color: '#8E44AD' },
      { id: 4, title: 'Inventory Value', value: '$850K', change: '+5.1%', trend: 'up', icon: BarChart3, color: '#D35400' },
      { id: 5, title: 'Production Eff.', value: '94%', change: '+1.2%', trend: 'up', icon: Activity, color: '#16A085' },
      { id: 6, title: 'Wastage Rate', value: '3.2%', change: '-0.5%', trend: 'down', icon: AlertTriangle, color: '#C0392B' },
    ],
    salesTrendData: [
      { month: 'Jan', revenue: 150000, profit: 45000 },
      { month: 'Feb', revenue: 180000, profit: 54000 },
      { month: 'Mar', revenue: 160000, profit: 48000 },
      { month: 'Apr', revenue: 210000, profit: 63000 },
      { month: 'May', revenue: 190000, profit: 57000 },
      { month: 'Jun', revenue: 250000, profit: 75000 },
      { month: 'Jul', revenue: 280000, profit: 84000 },
    ],
    revenueDistributionData: [
      { name: 'Full Grain Leather', value: 45 },
      { name: 'Top Grain Leather', value: 30 },
      { name: 'Genuine Leather', value: 15 },
      { name: 'Suede', value: 10 },
    ],
    productionData: [
      { day: 'Mon', target: 500, actual: 480 },
      { day: 'Tue', target: 500, actual: 520 },
      { day: 'Wed', target: 500, actual: 490 },
      { day: 'Thu', target: 500, actual: 550 },
      { day: 'Fri', target: 500, actual: 470 },
      { day: 'Sat', target: 300, actual: 310 },
      { day: 'Sun', target: 0, actual: 0 },
    ],
    financialData: [
      { category: 'Raw Materials', amount: 450000 },
      { category: 'Labor', amount: 200000 },
      { category: 'Machinery', amount: 80000 },
      { category: 'Utilities', amount: 40000 },
      { category: 'Logistics', amount: 60000 },
    ],
    machineUtilizationData: [
      { day: 'Mon', usage: 85 },
      { day: 'Tue', usage: 92 },
      { day: 'Wed', usage: 88 },
      { day: 'Thu', usage: 95 },
      { day: 'Fri', usage: 82 },
      { day: 'Sat', usage: 60 },
      { day: 'Sun', usage: 0 },
    ],
    cashFlowData: [
      { month: 'Jan', inflow: 180000, outflow: 120000 },
      { month: 'Feb', inflow: 210000, outflow: 140000 },
      { month: 'Mar', inflow: 190000, outflow: 110000 },
      { month: 'Apr', inflow: 250000, outflow: 160000 },
      { month: 'May', inflow: 230000, outflow: 150000 },
      { month: 'Jun', inflow: 290000, outflow: 180000 },
    ],
    defectDistributionData: [
      { name: 'Scratches', value: 35 },
      { name: 'Color Variation', value: 25 },
      { name: 'Thickness Issue', value: 20 },
      { name: 'Tear/Hole', value: 15 },
      { name: 'Other', value: 5 },
    ],
    qualityTrendData: [
      { week: 'Week 1', passRate: 95.2 },
      { week: 'Week 2', passRate: 96.1 },
      { week: 'Week 3', passRate: 94.8 },
      { week: 'Week 4', passRate: 97.5 },
      { week: 'Week 5', passRate: 98.2 },
      { week: 'Week 6', passRate: 98.5 },
    ],
    aiInsights: [
      { id: 1, type: 'success', title: 'OPPORTUNITY', message: 'Demand for Top Grain Leather expected to rise by 15% next month. Consider increasing stock.', confidence: 88 },
      { id: 2, type: 'warning', title: 'WARNING', message: 'Supplier "Global Hides" has a 30% delay rate in the last 14 days. This may impact upcoming orders.', confidence: 92 },
      { id: 3, type: 'info', title: 'OPTIMIZATION', message: 'Reducing production batch size by 10% could decrease machine idle time and save $2,000/week.', confidence: 76 },
    ]
  },
  'This Year': {
    kpiData: [
      { id: 1, title: 'Total Revenue', value: '$5.2M', change: '+18.5%', trend: 'up', icon: DollarSign, color: '#27AE60' },
      { id: 2, title: 'Monthly Profit', value: '$980K', change: '+14.2%', trend: 'up', icon: TrendingUp, color: '#2980B9' },
      { id: 3, title: 'Total Orders', value: '2,890', change: '+5.4%', trend: 'up', icon: Package, color: '#8E44AD' },
      { id: 4, title: 'Inventory Value', value: '$920K', change: '+8.1%', trend: 'up', icon: BarChart3, color: '#D35400' },
      { id: 5, title: 'Production Eff.', value: '95%', change: '+1.5%', trend: 'up', icon: Activity, color: '#16A085' },
      { id: 6, title: 'Wastage Rate', value: '3.0%', change: '-0.7%', trend: 'down', icon: AlertTriangle, color: '#C0392B' },
    ],
    salesTrendData: [
      { month: 'Q1', revenue: 1100000, profit: 210000 },
      { month: 'Q2', revenue: 1350000, profit: 260000 },
      { month: 'Q3', revenue: 1250000, profit: 240000 },
      { month: 'Q4', revenue: 1500000, profit: 270000 },
    ],
    revenueDistributionData: [
      { name: 'Full Grain Leather', value: 48 },
      { name: 'Top Grain Leather', value: 28 },
      { name: 'Genuine Leather', value: 14 },
      { name: 'Suede', value: 10 },
    ],
    productionData: [
      { day: 'Q1 Avg', target: 500, actual: 495 },
      { day: 'Q2 Avg', target: 500, actual: 520 },
      { day: 'Q3 Avg', target: 550, actual: 530 },
      { day: 'Q4 Avg', target: 600, actual: 610 },
    ],
    financialData: [
      { category: 'Raw Materials', amount: 1100000 },
      { category: 'Labor', amount: 550000 },
      { category: 'Machinery', amount: 210000 },
      { category: 'Utilities', amount: 95000 },
      { category: 'Logistics', amount: 145000 },
    ],
    machineUtilizationData: [
      { day: 'Q1', usage: 86 },
      { day: 'Q2', usage: 91 },
      { day: 'Q3', usage: 89 },
      { day: 'Q4', usage: 95 },
    ],
    cashFlowData: [
      { month: 'Q1', inflow: 500000, outflow: 350000 },
      { month: 'Q2', inflow: 650000, outflow: 420000 },
      { month: 'Q3', inflow: 580000, outflow: 390000 },
      { month: 'Q4', inflow: 720000, outflow: 450000 },
    ],
    defectDistributionData: [
      { name: 'Scratches', value: 36 },
      { name: 'Color Variation', value: 24 },
      { name: 'Thickness Issue', value: 18 },
      { name: 'Tear/Hole', value: 16 },
      { name: 'Other', value: 6 },
    ],
    qualityTrendData: [
      { week: 'Q1', passRate: 95.8 },
      { week: 'Q2', passRate: 96.7 },
      { week: 'Q3', passRate: 97.1 },
      { week: 'Q4', passRate: 98.2 },
    ],
    aiInsights: [
      { id: 1, type: 'success', title: 'ANNUAL MILESTONE', message: 'Annual production waste lowered by 0.7% overall compared to pre-AI projections.', confidence: 96 },
    ]
  }
};

export default function ReportsPage() {
  const location = useLocation();
  const { formatCurrency, symbol, convert, isINR } = useCurrency();
  const [dateRange, setDateRange] = useState('Last 6 Months');
  const [activeTab, setActiveTab] = useState('overview');
  const [alertBanner, setAlertBanner] = useState(null);

  // Handle notification deep-link
  useEffect(() => {
    if (location.state?.fromNotification) {
      setAlertBanner({ title: location.state.alertTitle, message: location.state.alertMessage });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const currentSet = MOCK_DATA_SETS[dateRange] || MOCK_DATA_SETS['Last 6 Months'];
  const {
    kpiData,
    salesTrendData,
    revenueDistributionData,
    productionData,
    financialData,
    machineUtilizationData,
    cashFlowData,
    defectDistributionData,
    qualityTrendData,
    aiInsights
  } = currentSet;

  const handleExport = (type) => {
    if (type === 'Print' || type === 'PDF') {
      // Use native browser print/save-to-pdf functionality to capture the actual charts
      window.print();
      return;
    }
    if (type === 'Share') {
      const shareUrl = `${window.location.origin}${window.location.pathname}?range=${encodeURIComponent(dateRange)}&tab=${activeTab}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast.success('Report link copied to clipboard!');
      }).catch(() => {
        toast.success('Share link generated successfully!');
      });
      return;
    }
    
    toast.success(`Generating ${type} report...`);
  };

  return (
    <AppLayout title="Reports & Analytics">
      {/* Notification Alert Banner */}
      {alertBanner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'linear-gradient(135deg, rgba(41,128,185,0.08) 0%, rgba(142,68,173,0.08) 100%)',
            border: '1px solid rgba(41,128,185,0.25)',
            borderRadius: '12px',
            padding: '14px 20px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Brain size={18} color="#2980B9" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)' }}>{alertBanner.title}</div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{alertBanner.message}</div>
            </div>
          </div>
          <button onClick={() => setAlertBanner(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '16px', padding: '4px' }}>✕</button>
        </motion.div>
      )}
      {/* Header & Controls */}
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div className="page-header-left">
          <h2>Reports & Analytics</h2>
          <p>Comprehensive business intelligence for LeatherPro.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 12px' }}>
            <Calendar size={16} color="var(--text-secondary)" style={{ marginRight: '8px' }} />
            <select 
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13.5px', color: 'var(--text-primary)', cursor: 'pointer' }}
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                toast.success(`Date range filtered to: ${e.target.value}`);
              }}
            >
              <option value="This Month" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>This Month</option>
              <option value="Last 3 Months" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Last 3 Months</option>
              <option value="Last 6 Months" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Last 6 Months</option>
              <option value="This Year" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>This Year</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', background: 'var(--accent)', borderRadius: '10px', overflow: 'hidden' }}>
            <button onClick={() => handleExport('PDF')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: 'none', background: 'transparent', color: '#fff', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
              <Download size={16} /> Export PDF
            </button>
            <button onClick={() => handleExport('Print')} style={{ padding: '8px 12px', border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', borderRight: '1px solid rgba(255,255,255,0.2)' }} title="Print Report">
              <Printer size={16} />
            </button>
            <button onClick={() => handleExport('Share')} style={{ padding: '8px 12px', border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer' }} title="Share Report">
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px', overflowX: 'auto' }}>
        {['overview', 'sales', 'production', 'financial', 'quality'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="btn"
            style={{ 
              background: activeTab === tab ? 'var(--text-primary)' : 'var(--bg-card)', 
              color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
              border: activeTab === tab ? 'none' : '1px solid var(--border)',
              textTransform: 'capitalize',
              boxShadow: activeTab === tab ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {(activeTab === 'overview' || activeTab === 'quality' || activeTab === 'production') && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            background: 'linear-gradient(135deg, #2C3E50 0%, #1A252F 100%)', 
            borderRadius: '16px', 
            padding: '24px', 
            marginBottom: '32px', 
            position: 'relative', 
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
          }}
        >
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.05, pointerEvents: 'none' }}>
            <Brain size={250} color="#fff" />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
            <div style={{ background: 'var(--accent)', padding: '8px', borderRadius: '10px' }}>
              <Zap size={20} color="#fff" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: 'Playfair Display, serif', margin: 0 }}>AI Predictive Insights</h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', position: 'relative', zIndex: 1 }}>
            {aiInsights.map((insight) => (
              <div key={insight.id} className={`insight-card ${insight.type}`} style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', margin: 0, backdropFilter: 'blur(10px)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: insight.type === 'success' ? '#2ecc71' : insight.type === 'warning' ? '#e74c3c' : '#3498db' }}>{insight.title}</span>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>{insight.confidence}% Confidence</span>
                  </div>
                  <p style={{ fontSize: '13.5px', lineHeight: 1.5, margin: 0, color: 'rgba(255,255,255,0.9)' }}>{insight.message}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {(activeTab === 'overview' || activeTab === 'sales' || activeTab === 'financial') && (
        <div className="kpi-grid" style={{ marginBottom: '32px' }}>
          {kpiData.map(item => {
            const Icon = item.icon;
            const isPositive = item.trend === 'up';
            return (
              <div key={item.id} className="kpi-card">
                <div className="kpi-icon" style={{ background: `${item.color}15`, color: item.color }}>
                  <Icon size={24} />
                </div>
                <div className="kpi-content">
                  <div className="kpi-label">{item.title}</div>
                  <div className="kpi-value">
                    {/* Convert dollar values dynamically */}
                    {item.value.startsWith('$') ? formatCurrency(parseFloat(item.value.replace(/[$,KM]/g, '')) * (item.value.includes('M') ? 1000000 : item.value.includes('K') ? 1000 : 1), { compact: true }) : item.value}
                  </div>
                  <div className={`kpi-change ${isPositive ? 'positive' : 'negative'}`}>
                    {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {item.change}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(activeTab === 'overview' || activeTab === 'sales') && (
        <div className="charts-grid" style={{ marginBottom: '32px' }}>
          <div className="chart-card" style={{ gridColumn: 'span 2' }}>
            <div style={{ marginBottom: '24px' }}>
              <h3 className="chart-title">Revenue & Profit Trend</h3>
              <p className="chart-subtitle" style={{ margin: 0 }}>Monthly performance comparison</p>
            </div>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={salesTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D35400" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#D35400" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6E6E6E' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6E6E6E' }} tickFormatter={(val) => `${symbol}${convert(val)/1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    formatter={(value) => [formatCurrency(value), undefined]}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#D35400" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#2C3E50" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <div style={{ marginBottom: '24px' }}>
              <h3 className="chart-title">Revenue by Category</h3>
              <p className="chart-subtitle" style={{ margin: 0 }}>Top selling leather types</p>
            </div>
            <div style={{ height: '240px', width: '100%', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {revenueDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Share']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>100%</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total</span>
              </div>
            </div>
            <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {revenueDistributionData.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {(activeTab === 'overview' || activeTab === 'production' || activeTab === 'financial') && (
        <div className="charts-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '32px' }}>
          {(activeTab === 'overview' || activeTab === 'production') && (
            <>
              <div className="chart-card">
                <div style={{ marginBottom: '24px' }}>
                  <h3 className="chart-title">Production Output</h3>
                  <p className="chart-subtitle" style={{ margin: 0 }}>Daily Target vs Actual units</p>
                </div>
                <div style={{ height: '250px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6E6E6E' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6E6E6E' }} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Bar dataKey="target" name="Target" fill="#D35400" radius={[4, 4, 0, 0]} barSize={12} />
                      <Bar dataKey="actual" name="Actual" fill="#2C3E50" radius={[4, 4, 0, 0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-card">
                <div style={{ marginBottom: '24px' }}>
                  <h3 className="chart-title">Machine Utilization</h3>
                  <p className="chart-subtitle" style={{ margin: 0 }}>Average active machine time (%)</p>
                </div>
                <div style={{ height: '250px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={machineUtilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#27AE60" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#27AE60" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6E6E6E' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6E6E6E' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                        formatter={(value) => [`${value}%`, 'Utilization']}
                      />
                      <Area type="monotone" dataKey="usage" name="Utilization %" stroke="#27AE60" strokeWidth={3} fillOpacity={1} fill="url(#colorUsage)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {(activeTab === 'overview' || activeTab === 'financial') && (
            <>
              <div className="chart-card">
                <div style={{ marginBottom: '24px' }}>
                  <h3 className="chart-title">Cash Flow</h3>
                  <p className="chart-subtitle" style={{ margin: 0 }}>Monthly Inflow vs Outflow</p>
                </div>
                <div style={{ height: '250px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6E6E6E' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6E6E6E' }} tickFormatter={(val) => `${symbol}${convert(val)/1000}k`} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                        formatter={(value) => [formatCurrency(value), undefined]}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Bar dataKey="inflow" name="Inflow" fill="#27AE60" radius={[4, 4, 0, 0]} barSize={12} />
                      <Bar dataKey="outflow" name="Outflow" fill="#E74C3C" radius={[4, 4, 0, 0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-card">
                <div style={{ marginBottom: '24px' }}>
                  <h3 className="chart-title">Operating Expenses</h3>
                  <p className="chart-subtitle" style={{ margin: 0 }}>Cost distribution by category</p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                  {financialData.map((item, index) => {
                    const total = financialData.reduce((acc, curr) => acc + curr.amount, 0);
                    const percentage = Math.round((item.amount / total) * 100);
                    
                    return (
                      <div key={index}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.category}</span>
                          <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--accent)' }}>
                            {formatCurrency(item.amount)} 
                            <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-secondary)', marginLeft: '6px' }}>({percentage}%)</span>
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'var(--bg-primary)', borderRadius: '100px', overflow: 'hidden' }}>
                          <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: `${percentage}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 }}
                            style={{ height: '100%', borderRadius: '100px', backgroundColor: COLORS[index % COLORS.length] }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {(activeTab === 'overview' || activeTab === 'quality') && (
        <div className="charts-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '32px' }}>
          <div className="chart-card">
            <div style={{ marginBottom: '24px' }}>
              <h3 className="chart-title">Quality Pass Rate Trend</h3>
              <p className="chart-subtitle" style={{ margin: 0 }}>Weekly successful inspections</p>
            </div>
            <div style={{ height: '250px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={qualityTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6E6E6E' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6E6E6E' }} domain={['dataMin - 2', 'dataMax + 1']} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    formatter={(value) => [`${value}%`, 'Pass Rate']}
                  />
                  <Line type="monotone" dataKey="passRate" name="Pass Rate %" stroke="#2C3E50" strokeWidth={3} dot={{ r: 5, fill: '#2C3E50', strokeWidth: 2, stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <div style={{ marginBottom: '24px' }}>
              <h3 className="chart-title">Defect Distribution</h3>
              <p className="chart-subtitle" style={{ margin: 0 }}>Most common quality issues</p>
            </div>
            <div style={{ height: '250px', width: '100%', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={defectDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {defectDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Share']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} layout="horizontal" verticalAlign="bottom" align="center" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
