import React from 'react';
import { formatCurrency, formatPercent } from './dashboardUtils';

const FALLBACK_IMAGE = '/assets/img/real-estate/property-exterior-3.webp';

export default function PropertyCard({ property, isActive, onSelect }) {
  return (
    <button
      type="button"
      className={`bi-property-card${isActive ? ' is-active' : ''}`}
      onClick={() => onSelect(property)}
    >
      <div className="bi-property-card__media">
        <img src={property.thumbnail || FALLBACK_IMAGE} alt={property.detailTitle} />
      </div>
      <div className="bi-property-card__body">
        <div className="bi-property-card__top">
          <div>
            <p className="bi-property-card__eyebrow">{property.type}</p>
            <h4>{property.detailTitle}</h4>
          </div>
          <strong>{formatPercent(property.ROI)}</strong>
        </div>

        <div className="bi-property-card__meta">
          <span>{property.category}</span>
          <span>{[property.address, property.city, property.zone].filter(Boolean).join(', ') || property.residence}</span>
        </div>

        <div className="bi-property-card__metrics">
          <div>
            <span>Prix</span>
            <strong>{formatCurrency(property.prix)}</strong>
          </div>
          <div>
            <span>Revenu ete</span>
            <strong>{formatCurrency(property.revenu_ete)}</strong>
          </div>
          <div>
            <span>Revenu annuel</span>
            <strong>{formatCurrency(property.revenu_annuel)}</strong>
          </div>
          <div>
            <span>ROI</span>
            <strong>{formatPercent(property.ROI)}</strong>
          </div>
        </div>
      </div>
    </button>
  );
}
