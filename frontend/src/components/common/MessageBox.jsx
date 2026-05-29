import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

const config = {
  danger: {
    className: 'bg-red-50 text-red-800 border-red-200/80',
    icon: AlertCircle,
  },
  success: {
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    icon: CheckCircle2,
  },
  warning: {
    className: 'bg-amber-50 text-amber-800 border-amber-200/80',
    icon: AlertTriangle,
  },
  info: {
    className: 'bg-brand-50 text-brand-800 border-brand-200/80',
    icon: Info,
  },
};

export default function MessageBox(props) {
  const variant = props.variant || 'info';
  const { className, icon: Icon } = config[variant] || config.info;

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border p-4 text-sm font-medium ${className}`}
      role="alert"
    >
      <Icon size={20} className="mt-0.5 shrink-0 opacity-80" />
      <div className="flex-1 leading-relaxed">{props.children}</div>
    </div>
  );
}
