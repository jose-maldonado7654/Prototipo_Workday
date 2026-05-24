import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const MetricCard = ({ title, value, icon: Icon, trend, trendValue }) => {
  const isUp = trend === 'up';
  
  return (
    <div className="bg-surface-800 rounded-xl border border-white/10 p-6 hover:border-primary-500/40 hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-primary-600/10 rounded-xl">
          <Icon className="w-6 h-6 text-primary-400" />
        </div>
        {trendValue && (
          <div className={`flex items-center gap-1 text-sm font-medium ${isUp ? 'text-accent-400' : 'text-red-400'}`}>
            {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <h3 className="text-text-tertiary text-sm font-body mb-1">{title}</h3>
      <p className="text-text-primary text-3xl font-display font-bold">{value}</p>
    </div>
  );
};

export default MetricCard;