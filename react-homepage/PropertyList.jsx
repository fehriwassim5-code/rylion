import React from 'react';
import { formatPercent } from './dashboardUtils';
import PropertyCard from './PropertyCard';

export default function PropertyList({ sections, selectedPropertyId, onSelectProperty }) {
  return (
    <section className="bi-property-sections">
      {sections.map((section) => (
        <article key={section.residence} className="bi-section-card">
          <div className="bi-section-card__header">
            <div>
              <p className="bi-section-kicker">{section.residence.toLowerCase().includes('villa') ? 'Villa' : 'Residence'}</p>
              <h3>{section.residence}</h3>
            </div>
          </div>

          <div className="bi-type-stack">
            {section.typeGroups.map((typeGroup) => (
              <div key={`${section.residence}-${typeGroup.type}`} className="bi-type-group">
                <div className="bi-type-group__head">
                  <h4>{typeGroup.type}</h4>
                </div>

                <div className="bi-category-stack">
                  {typeGroup.categories.map((categoryGroup) => (
                    <section key={`${typeGroup.type}-${categoryGroup.category}`} className="bi-category-group">
                      <div className="bi-category-group__head">
                        <div>
                          <p className="bi-section-kicker">Category</p>
                          <h5>{categoryGroup.category}</h5>
                        </div>
                        <div className="bi-category-group__summary">
                          <strong>{formatPercent(categoryGroup.items[0]?.ROI || 0)}</strong>
                          <span>Top ROI</span>
                        </div>
                      </div>

                      <div className="bi-property-grid">
                        {categoryGroup.items.map((property) => (
                          <PropertyCard
                            key={property.id}
                            property={property}
                            isActive={selectedPropertyId === property.id}
                            onSelect={onSelectProperty}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}
