import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AppLayout from '../../components/layout/AppLayout';
import KPICard from '../../components/common/KPICard';
import {
  DollarSign, TrendingUp, Package, Factory, ShoppingCart,
  AlertTriangle, Users, Truck, Brain, Clock
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';

const COLORS = ['#D35400', '#6B8E23', '#2980B9', '#A93226', '#8E44AD', '#1ABC9C'];

const CustomTooltip = ({ active, payload, label, symbol, convert }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '10px', padding: '12px 16px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: '13px'
      }}>
        <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
            <span style={{ color: 'var(--text-secondary)' }}>{p.name}:</span>
            <strong>{symbol}{convert(p.value)?.toLocaleString()}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { formatCurrency, symbol, convert } = useCurrency();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [productionData, setProductionData] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [summaryRes, revenueRes, productionRes, insightsRes] = await Promise.allSettled([
        api.get('/dashboard/summary'),
        api.get('/dashboard/charts/revenue'),
        api.get('/dashboard/charts/production-status'),
        api.get('/ai/insights'),
      ]);

      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value.data.data);
      if (revenueRes.status === 'fulfilled') setRevenueData(revenueRes.value.data.data);
      if (productionRes.status === 'fulfilled') setProductionData(productionRes.value.data.data);
      if (insightsRes.status === 'fulfilled') setInsights(insightsRes.value.data.data.insights || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const insightColors = {
    success: { bg: 'rgba(107,142,35,0.1)', border: 'rgba(107,142,35,0.2)', icon: '#6B8E23' },
    warning: { bg: 'rgba(243,156,18,0.1)', border: 'rgba(243,156,18,0.2)', icon: '#D68910' },
    danger: { bg: 'rgba(169,50,38,0.1)', border: 'rgba(169,50,38,0.2)', icon: '#A93226' },
    info: { bg: 'rgba(41,128,185,0.1)', border: 'rgba(41,128,185,0.2)', icon: '#2980B9' },
  };

  const handleInsightClick = (action) => {
    if (!action) return;
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('production')) navigate('/production');
    else if (lowerAction.includes('stock') || lowerAction.includes('inventory')) navigate('/inventory');
    else if (lowerAction.includes('supplier')) navigate('/suppliers');
    else navigate('/ai-insights');
  };

  return (
    <AppLayout title="Dashboard">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, var(--sidebar) 0%, #5D4037 100%)',
          borderRadius: '16px', padding: '28px 32px',
          marginBottom: '24px', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
          overflow: 'hidden', position: 'relative',
          boxShadow: '0 8px 24px rgba(62,39,35,0.25)'
        }}
      >
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(211,84,0,0.15)' }} />
        <div style={{ position: 'absolute', bottom: -60, right: 100, width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', color: '#fff', marginBottom: '6px' }}>
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.full_name?.split(' ')[0]} 👋
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
            Welcome to LeatherPro AI ERP — {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ textAlign: 'right', position: 'relative', zIndex: 1 }}>
          <img src="/src/assets/logo.png" alt="LeatherPro Logo" style={{ width: '48px', height: '48px', borderRadius: '12px', marginBottom: '6px', objectFit: 'cover', display: 'inline-block' }} />
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: 1 }}>AI Powered ERP</div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KPICard
          icon={DollarSign} label="Monthly Revenue" color="accent"
          value={summary?.revenue?.current_month ? formatCurrency(summary.revenue.current_month, { compact: true }) : '--'}
          change={summary?.revenue?.growth_percentage ? `${summary.revenue.growth_percentage > 0 ? '+' : ''}${summary.revenue.growth_percentage.toFixed(1)}%` : null}
          changeType={summary?.revenue?.growth_percentage >= 0 ? 'positive' : 'negative'}
          index={0}
        />
        <KPICard
          icon={TrendingUp} label="Est. Profit" color="success"
          value={summary?.profit?.estimated ? formatCurrency(summary.profit.estimated, { compact: true }) : '--'}
          change={summary?.profit?.margin_percentage ? `${summary.profit.margin_percentage.toFixed(1)}% margin` : null}
          changeType="positive"
          index={1}
        />
        <KPICard
          icon={Factory} label="Active Production" color="info"
          value={summary?.production?.in_progress ?? '--'}
          change={`${summary?.production?.pending ?? 0} pending orders`}
          changeType="neutral"
          index={2}
        />
        <KPICard
          icon={Package} label="Inventory Items" color="purple"
          value={summary?.inventory?.total_materials ?? '--'}
          change={summary?.inventory?.low_stock_alerts > 0 ? `⚠️ ${summary.inventory.low_stock_alerts} low stock` : 'All stocked'}
          changeType={summary?.inventory?.low_stock_alerts > 0 ? 'negative' : 'positive'}
          index={3}
        />
        <KPICard
          icon={ShoppingCart} label="Pending Orders" color="teal"
          value={summary?.orders?.pending ?? '--'}
          change={`${summary?.orders?.total_customers ?? 0} total customers`}
          changeType="neutral"
          index={4}
        />
        <KPICard
          icon={Truck} label="Total Suppliers" color="accent"
          value={summary?.orders?.total_suppliers ?? '--'}
          change="AI Insights"
          changeType="positive"
          index={5}
        />
      </div>

      {/* Charts Row */}
      <div className="charts-grid" style={{ marginBottom: '24px' }}>
        {/* Revenue Chart */}
        <div className="chart-card" style={{ gridColumn: 'span 2' }}>
          <div className="chart-title">Revenue & Profit Trend</div>
          <div className="chart-subtitle">Monthly financial performance over last 12 months</div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D35400" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#D35400" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6B8E23" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6B8E23" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(229,211,197,0.5)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${symbol}${(convert(v)/1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip symbol={symbol} convert={convert} />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ paddingBottom: '20px' }}
              />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#D35400" strokeWidth={2} fill="url(#revGrad)" />
              <Area type="monotone" dataKey="profit" name="Profit" stroke="#6B8E23" strokeWidth={2} fill="url(#profGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Production Status */}
        <div className="chart-card">
          <div className="chart-title">Production Status</div>
          <div className="chart-subtitle">Current order distribution</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={productionData.filter(d => d.count > 0)}
                cx="50%" cy="50%"
                innerRadius={65} outerRadius={95}
                paddingAngle={3}
                dataKey="count"
                nameKey="status"
              >
                {productionData.filter(d => d.count > 0).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, name]} />
              <Legend
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span style={{ color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'capitalize', marginLeft: '4px' }}>
                    {value.replace('_', ' ')}
                  </span>
                )}
                wrapperStyle={{ paddingTop: '20px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Insights + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px' }}>
        {/* AI Insights */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: 36, height: 36, background: 'rgba(211,84,0,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={18} color="var(--accent)" />
            </div>
            <div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '17px' }}>AI Insights</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Smart recommendations for your business</p>
            </div>
          </div>

          {insights.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '13px' }}>
              Loading AI insights...
            </div>
          ) : insights.map((insight, i) => {
            const c = insightColors[insight.type] || insightColors.info;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{
                  display: 'flex', gap: '14px', padding: '14px',
                  borderRadius: '12px', marginBottom: '10px',
                  background: c.bg, border: `1px solid ${c.border}`,
                  cursor: 'pointer', transition: 'transform 0.2s'
                }}
                whileHover={{ x: 4 }}
                onClick={() => handleInsightClick(insight.action)}
              >
                <div style={{ width: 36, height: 36, borderRadius: '10px', background: `${c.icon}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Brain size={16} color={c.icon} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '13.5px', marginBottom: '3px' }}>{insight.title}</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{insight.message}</div>
                  {insight.action && (
                    <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>
                      → {insight.action}
                    </div>
                  )}
                </div>
                <div style={{
                  fontSize: '10px', padding: '3px 8px', borderRadius: '20px',
                  background: `${c.icon}15`, color: c.icon, fontWeight: 700,
                  alignSelf: 'flex-start', whiteSpace: 'nowrap', textTransform: 'capitalize'
                }}>
                  {insight.priority}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="card">
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '17px', marginBottom: '20px' }}>Quick Stats</h3>

          {[
            { label: 'Completed Orders', value: summary?.production?.completed ?? 0, color: 'var(--success)', pct: Math.min((summary?.production?.completed ?? 0) * 5, 100) },
            { label: 'On-time Delivery', value: `${summary?.quick_stats?.on_time_delivery ?? 82}%`, color: '#2980B9', pct: summary?.quick_stats?.on_time_delivery ?? 82 },
            { label: 'Quality Pass Rate', value: `${summary?.quick_stats?.quality_pass_rate ?? 94}%`, color: 'var(--accent)', pct: summary?.quick_stats?.quality_pass_rate ?? 94 },
            { label: 'Inventory Turnover', value: `${summary?.quick_stats?.inventory_turnover ?? 4.2}x`, color: '#8E44AD', pct: Math.min(((summary?.quick_stats?.inventory_turnover ?? 4.2) / 6.5) * 100, 100) },
          ].map((stat, i) => (
            <div key={i} style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>{stat.label}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: stat.color }}>{stat.value}</span>
              </div>
              <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.pct}%` }}
                  transition={{ duration: 0.8, delay: i * 0.15 }}
                  style={{ height: '100%', background: stat.color, borderRadius: '3px' }}
                />
              </div>
            </div>
          ))}

          <div style={{
            marginTop: '24px', padding: '16px', borderRadius: '12px',
            background: 'rgba(211,84,0,0.06)', border: '1px solid rgba(211,84,0,0.15)',
            display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Clock size={20} color="var(--accent)" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Last Updated</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date().toLocaleTimeString()}</div>
              </div>
            </div>
            <button
               onClick={loadDashboardData}
               disabled={loading}
               style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
