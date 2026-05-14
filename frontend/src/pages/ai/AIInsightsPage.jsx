import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AppLayout from '../../components/layout/AppLayout';
import { Brain, TrendingUp, BarChart3, AlertTriangle, CheckCircle, Info, Clock, Zap, Target } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useCurrency } from '../../contexts/CurrencyContext';

export default function AIInsightsPage() {
  const navigate = useNavigate();
  const { formatCurrency, convert, symbol, isINR, rate } = useCurrency();
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [costForm, setCostForm] = useState({
    leather_cost: 150, accessories_cost: 40, labor_cost: 60,
    machine_cost: 20, electricity_cost: 10, overhead_cost: 30,
    packaging_cost: 15, transportation_cost: 25
  });
  const [costPrediction, setCostPrediction] = useState(null);
  const [demandForecast, setDemandForecast] = useState([]);
  const [productionAnalytics, setProductionAnalytics] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [predicting, setPredicting] = useState(false);
  const [prevIsINR, setPrevIsINR] = useState(false);

  useEffect(() => {
    if (isINR !== prevIsINR) {
      const factor = isINR ? 83.50 : (1 / 83.50);
      setCostForm(prev => {
        const next = {};
        for (const k in prev) {
          next[k] = parseFloat((prev[k] * factor).toFixed(2));
        }
        return next;
      });
      setPrevIsINR(isINR);
    }
  }, [isINR, prevIsINR]);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [insightsRes, demandRes, prodRes, revenueRes] = await Promise.allSettled([
        api.get('/ai/insights'),
        api.post('/ai/predict/demand/1', null, { params: { months_ahead: 6 } }),
        api.get('/ai/analytics/production-analytics'),
        api.get('/ai/analytics/revenue-trend', { params: { months: 12 } }),
      ]);
      if (insightsRes.status === 'fulfilled') setInsights(insightsRes.value.data.data.insights || []);
      if (demandRes.status === 'fulfilled') setDemandForecast(demandRes.value.data.data.forecasts || []);
      if (prodRes.status === 'fulfilled') setProductionAnalytics(prodRes.value.data.data || []);
      if (revenueRes.status === 'fulfilled') setRevenueTrend(revenueRes.value.data.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  const predictCost = async () => {
    setPredicting(true);
    try {
      const payload = {};
      for (const k in costForm) {
        payload[k] = isINR ? parseFloat((costForm[k] / rate).toFixed(2)) : costForm[k];
      }
      const res = await api.post('/ai/predict/cost', payload);
      setCostPrediction(res.data.data);
      toast.success('Cost prediction generated!');
    } catch { toast.error('Prediction failed'); }
    finally { setPredicting(false); }
  };

  const insightConfig = {
    success: { bg: 'rgba(107,142,35,0.08)', border: 'rgba(107,142,35,0.2)', iconBg: 'rgba(107,142,35,0.15)', color: '#6B8E23', Icon: CheckCircle },
    warning: { bg: 'rgba(243,156,18,0.08)', border: 'rgba(243,156,18,0.2)', iconBg: 'rgba(243,156,18,0.15)', color: '#D68910', Icon: AlertTriangle },
    danger: { bg: 'rgba(169,50,38,0.08)', border: 'rgba(169,50,38,0.2)', iconBg: 'rgba(169,50,38,0.15)', color: '#A93226', Icon: AlertTriangle },
    info: { bg: 'rgba(41,128,185,0.08)', border: 'rgba(41,128,185,0.2)', iconBg: 'rgba(41,128,185,0.15)', color: '#2980B9', Icon: Info },
  };

  const handleInsightClick = (action) => {
    if (!action) return;
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('production')) navigate('/production');
    else if (lowerAction.includes('stock') || lowerAction.includes('inventory') || lowerAction.includes('capacity')) navigate('/inventory');
    else if (lowerAction.includes('supplier')) navigate('/suppliers');
    else navigate('/dashboard');
  };

  const CustomDemandTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#fff', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ fontWeight: 700, marginBottom: '8px', fontSize: '13px' }}>{label}</div>
          {payload.map((entry, index) => (
            <div key={index} style={{ color: entry.dataKey === 'upper_bound' ? '#D35400' : entry.color, fontSize: '12px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color }} />
              <span style={{ fontWeight: 600 }}>{entry.name}:</span>
              <span>{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <AppLayout title="AI Insights">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          borderRadius: '16px', padding: '28px 32px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '20px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)', position: 'relative', overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', top: -30, right: -30, width: 200, height: 200, borderRadius: '50%', background: 'rgba(211,84,0,0.1)' }} />
        <div style={{ width: 60, height: 60, background: 'rgba(211,84,0,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Brain size={28} color="var(--accent)" />
        </div>
        <div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', color: '#fff', marginBottom: '6px' }}>AI Intelligence Center</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
            Machine learning powered insights, predictions, and recommendations for your leather manufacturing business
          </p>
        </div>
      </motion.div>

      {/* AI Insights Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        {insights.map((insight, i) => {
          const cfg = insightConfig[insight.type] || insightConfig.info;
          const { Icon } = cfg;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              style={{
                padding: '18px', borderRadius: '14px', background: cfg.bg,
                border: `1px solid ${cfg.border}`, cursor: 'pointer'
              }}
              whileHover={{ scale: 1.01 }}
              onClick={() => handleInsightClick(insight.action)}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: 38, height: 38, borderRadius: '10px', background: cfg.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color={cfg.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{insight.title}</div>
                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: cfg.color, background: cfg.iconBg, padding: '2px 8px', borderRadius: '20px' }}>
                      {insight.priority}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '8px' }}>{insight.message}</div>
                  {insight.action && (
                    <div style={{ fontSize: '12px', color: cfg.color, fontWeight: 600 }}>→ {insight.action}</div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Demand Forecast */}
        <div className="chart-card">
          <div className="chart-title">📈 Demand Forecast</div>
          <div className="chart-subtitle">AI predicted demand for next 6 months</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={demandForecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(229,211,197,0.5)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomDemandTooltip />} />
              <Bar dataKey="predicted_demand" name="Predicted" fill="var(--accent)" radius={[4,4,0,0]} />
              <Bar dataKey="upper_bound" name="Upper Bound" fill="rgba(211,84,0,0.2)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Department Performance */}
        <div className="chart-card">
          <div className="chart-title">🏭 Department Performance</div>
          <div className="chart-subtitle">Efficiency & wastage by production department</div>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={productionAnalytics}>
              <PolarGrid stroke="rgba(229,211,197,0.5)" />
              <PolarAngleAxis dataKey="department" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar name="Efficiency" dataKey="efficiency" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.15} />
              <Radar name="Orders" dataKey="orders_processed" stroke="var(--success)" fill="var(--success)" fillOpacity={0.1} />
              <Legend
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '12px', marginLeft: '4px' }}>{value}</span>}
                wrapperStyle={{ paddingTop: '10px' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Cost Predictor */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: 40, height: 40, background: 'rgba(211,84,0,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Target size={20} color="var(--accent)" />
          </div>
          <div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px' }}>AI Cost Predictor</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Enter cost components to get AI-powered price prediction</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
          {Object.entries(costForm).map(([key, value]) => (
            <div className="form-group" key={key} style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '12px' }}>
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} ({symbol})
              </label>
              <input
                className="form-control"
                type="number"
                min="0"
                step="0.01"
                value={value}
                onChange={e => setCostForm({ ...costForm, [key]: parseFloat(e.target.value) || 0 })}
              />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <button className="btn btn-primary" onClick={predictCost} disabled={predicting}>
            {predicting ? '⟳ Predicting...' : '🤖 Predict Cost'}
          </button>

          {costPrediction && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', flex: 1
              }}
            >
              <div style={{ padding: '14px', background: 'rgba(211,84,0,0.06)', borderRadius: '12px', border: '1px solid rgba(211,84,0,0.15)', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Predicted Cost</div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', fontWeight: 700, color: 'var(--accent)' }}>
                  {formatCurrency(costPrediction.predicted_cost)}
                </div>
              </div>
              <div style={{ padding: '14px', background: 'rgba(107,142,35,0.06)', borderRadius: '12px', border: '1px solid rgba(107,142,35,0.15)', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Confidence</div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', fontWeight: 700, color: 'var(--success)' }}>
                  {(costPrediction.confidence_score * 100).toFixed(0)}%
                </div>
              </div>
              <div style={{ padding: '14px', background: 'rgba(41,128,185,0.06)', borderRadius: '12px', border: '1px solid rgba(41,128,185,0.15)', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Model</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#2980B9' }}>
                  {costPrediction.model_version}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Revenue Trend */}
      <div className="chart-card">
        <div className="chart-title">💹 Revenue vs Actual Trend</div>
        <div className="chart-subtitle">12-month revenue performance with AI projection overlay</div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={revenueTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(229,211,197,0.5)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${symbol}${(convert(v)/1000).toFixed(0)}K`} />
            <Tooltip formatter={(v) => [formatCurrency(v), '']} />
            <Legend />
            <Line type="monotone" dataKey="revenue" name="Revenue" stroke="var(--accent)" strokeWidth={2.5} dot={{ fill: 'var(--accent)', r: 3 }} />
            <Line type="monotone" dataKey="profit" name="Profit" stroke="var(--success)" strokeWidth={2} dot={false} strokeDasharray="5 3" />
            <Line type="monotone" dataKey="cost" name="Cost" stroke="#2980B9" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </AppLayout>
  );
}
