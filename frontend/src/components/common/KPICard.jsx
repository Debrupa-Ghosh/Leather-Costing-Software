import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const colorMap = {
  accent: { bg: 'rgba(211,84,0,0.12)', color: 'var(--accent)' },
  success: { bg: 'rgba(107,142,35,0.12)', color: 'var(--success)' },
  danger: { bg: 'rgba(169,50,38,0.12)', color: 'var(--danger)' },
  info: { bg: 'rgba(41,128,185,0.12)', color: '#2980B9' },
  purple: { bg: 'rgba(142,68,173,0.12)', color: '#8E44AD' },
  teal: { bg: 'rgba(26,188,156,0.12)', color: '#1ABC9C' },
};

export default function KPICard({ icon: Icon, label, value, change, changeType = 'positive', color = 'accent', prefix = '', suffix = '', index = 0 }) {
  const c = colorMap[color] || colorMap.accent;

  return (
    <motion.div
      className="kpi-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <div className="kpi-icon" style={{ background: c.bg }}>
        <Icon size={22} color={c.color} />
      </div>
      <div className="kpi-content">
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </div>
        {change !== undefined && (
          <div className={`kpi-change ${changeType}`}>
            {changeType === 'positive' ? <TrendingUp size={12} /> :
             changeType === 'negative' ? <TrendingDown size={12} /> :
             <Minus size={12} />}
            <span>{change}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
