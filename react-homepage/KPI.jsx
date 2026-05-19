import React from 'react';
import { formatCurrency, formatPercent } from './dashboardUtils';

function KPIItem({ label, value, copy }) {
  return (
    <article className="bi-kpi-card">
      <span className="bi-kpi-label">{label}</span>
      <strong>{value}</strong>
      <p>{copy}</p>
    </article>
  );
}

export default function KPI({ kpis }) {
  return (
    <section className="bi-kpi-grid">
      <KPIItem
        label="Total properties"
        value={kpis.totalProperties}
        copy="Nombre total de biens analyses sur tout le portefeuille."
      />
      <KPIItem
        label="Average ROI"
        value={formatPercent(kpis.averageROI)}
        copy="ROI moyen calcule sur l'ensemble des biens enrichis."
      />
      <KPIItem
        label="Best property"
        value={kpis.bestProperty?.detailTitle || 'N/A'}
        copy={`${formatPercent(kpis.bestProperty?.ROI || 0)} de ROI, meilleur bien du portefeuille.`}
      />
      <KPIItem
        label="Average price"
        value={formatCurrency(kpis.averagePrice)}
        copy={`Revenu ete moyen ${formatCurrency(kpis.averageSummer)} et annuel ${formatCurrency(kpis.averageAnnual)}.`}
      />
    </section>
  );
}
