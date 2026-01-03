
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
        <div className={`${color} w-10 h-10 rounded-xl flex items-center justify-center text-white`}>
          <i className={`fas ${icon}`}></i>
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        {subtitle && <span className="text-xs text-gray-400 mt-1">{subtitle}</span>}
      </div>
    </div>
  );
};

export default StatCard;
