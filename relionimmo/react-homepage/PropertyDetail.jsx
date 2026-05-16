import React from 'react';
import { formatCurrency, formatPercent } from './dashboardUtils';

function ProjectionList({ projection }) {
  return (
    <div className="bi-detail-projection">
      {projection.map((item) => (
        <div key={item.year} className="bi-detail-projection__item">
          <span>Annee {item.year}</span>
          <strong>{formatCurrency(item.value)}</strong>
        </div>
      ))}
    </div>
  );
}

export default function PropertyDetail({ property }) {
  if (!property) {
    return (
      <aside className="bi-detail-panel">
        <p className="bi-section-kicker">Property Detail</p>
        <h3>Selectionnez un bien</h3>
        <p className="bi-muted-copy">
          Cliquez sur une carte pour voir le detail de performance, la projection et la comparaison avec la moyenne.
        </p>
      </aside>
    );
  }

  const comparisonPositive = property.comparisonWithAverage >= 0;

  return (
    <aside className="bi-detail-panel">
      <p className="bi-section-kicker">Property Detail</p>
      <h3>{property.detailTitle}</h3>
      <p className="bi-muted-copy">
        {[property.residence, property.category, property.city].filter(Boolean).join(' • ')}
      </p>

      <div className="bi-detail-grid">
        <article className="bi-detail-metric">
          <span>ROI</span>
          <strong>{formatPercent(property.ROI)}</strong>
        </article>
        <article className="bi-detail-metric">
          <span>Price</span>
          <strong>{formatCurrency(property.prix)}</strong>
        </article>
        <article className="bi-detail-metric">
          <span>Revenu ete</span>
          <strong>{formatCurrency(property.revenu_ete)}</strong>
        </article>
        <article className="bi-detail-metric">
          <span>Revenu annuel</span>
          <strong>{formatCurrency(property.revenu_annuel)}</strong>
        </article>
      </div>

      <div className="bi-detail-comparison">
        <span>Comparison with average</span>
        <strong className={comparisonPositive ? 'is-positive' : 'is-negative'}>
          {(comparisonPositive ? '+' : '') + formatPercent(property.comparisonWithAverage)}
        </strong>
      </div>

      <div className="bi-detail-block">
        <div className="bi-detail-block__head">
          <h4>Projection 5 years</h4>
          <span>5% annual growth</span>
        </div>
        <ProjectionList projection={property.projection5y} />
      </div>

      <div className="bi-detail-footer">
        <span>Base nightly price</span>
        <strong>{formatCurrency(property.price_per_night)}</strong>
      </div>
    </aside>
  );
}
