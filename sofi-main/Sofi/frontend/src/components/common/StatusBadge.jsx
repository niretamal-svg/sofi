import React from 'react';
import clsx from 'clsx';

const variantStyles = {
  gratis: 'bg-status-free bg-opacity-10 text-status-free',
  pago: 'bg-status-paid bg-opacity-10 text-status-paid',
  freemium: 'bg-status-freemium bg-opacity-10 text-status-freemium',
  publicado: 'bg-status-free bg-opacity-10 text-status-free',
  publicando: 'bg-sofi-teal bg-opacity-10 text-sofi-teal animate-pulse-slow',
  error: 'bg-red-100 text-red-700',
  pendiente: 'bg-gray-100 text-gray-700',
};

const variantLabels = {
  gratis: 'Gratis',
  pago: 'De pago',
  freemium: 'Freemium',
  publicado: 'Publicado',
  publicando: 'Publicando...',
  error: 'Error',
  pendiente: 'Pendiente',
};

export default function StatusBadge({ variant, label, className }) {
  const style = variantStyles[variant] || variantStyles.pendiente;
  const text = label || variantLabels[variant];

  return (
    <span className={clsx('inline-flex items-center px-3 py-1 rounded-full text-xs font-medium', style, className)}>
      {text}
    </span>
  );
}
