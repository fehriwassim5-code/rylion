import React, { useEffect, useMemo, useState } from 'react';
import './homepage.css';
import KPI from './KPI';
import Charts from './Charts';
import PropertyList from './PropertyList';
import PropertyDetail from './PropertyDetail';
import { buildDashboardData } from './dashboardUtils';

export default function Dashboard() {
  const [rawProperties, setRawProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadProperties() {
      try {
        const response = await fetch('/api/properties');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json();
        const nextProperties = Array.isArray(payload)
          ? payload
          : (Array.isArray(payload.data) ? payload.data : payload.properties);

        if (active) {
          setRawProperties(Array.isArray(nextProperties) ? nextProperties : []);
          setError('');
        }
      } catch (fetchError) {
        if (active) {
          setError("Impossible de charger les donnees depuis /api/properties.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProperties();
    return () => {
      active = false;
    };
  }, []);

  const dashboardData = useMemo(() => buildDashboardData(rawProperties), [rawProperties]);

  useEffect(() => {
    if (dashboardData?.selectedProperty) {
      setSelectedProperty((current) => current || dashboardData.selectedProperty);
    }
  }, [dashboardData]);

  return (
    <section className="bi-dashboard-shell">
      <div className="bi-dashboard-header">
        <div>
          <p className="bi-dashboard-eyebrow">Investment BI Dashboard</p>
          <h2>All properties structured by residence, type and category</h2>
          <p className="bi-dashboard-copy">
            Dashboard React + D3 qui charge tous les biens depuis l&apos;API, calcule les revenus et le ROI,
            puis affiche un parcours clair: KPI, charts et sections groupees proprement.
          </p>
        </div>
      </div>

      {loading && <div className="bi-dashboard-state">Chargement du dashboard...</div>}
      {!loading && error && <div className="bi-dashboard-state bi-dashboard-state--error">{error}</div>}

      {!loading && !error && dashboardData && (
        <div className="bi-dashboard-layout">
          <div className="bi-dashboard-main">
            <KPI kpis={dashboardData.kpis} />
            <Charts charts={dashboardData.charts} />
            <PropertyList
              sections={dashboardData.sections}
              selectedPropertyId={selectedProperty?.id}
              onSelectProperty={setSelectedProperty}
            />
          </div>

          <div className="bi-dashboard-side">
            <PropertyDetail property={selectedProperty} />
          </div>
        </div>
      )}
    </section>
  );
}
