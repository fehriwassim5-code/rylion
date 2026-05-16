import React, { useEffect, useMemo, useState } from 'react';
import './homepage.css';
import {
  buildStatisticsDashboard,
  formatCurrency,
  formatInteger,
  formatPercent
} from './statisticsUtils';

const CHART_COLORS = {
  roi: '#0f766e',
  revenue: '#f97316',
  line: '#14532d',
  point: '#f59e0b',
  pie: ['#0f766e', '#14b8a6', '#f59e0b', '#ea580c']
};

function formatCompactMoney(value) {
  const numeric = Number(value || 0);
  if (numeric >= 1000000) {
    return `${(numeric / 1000000).toFixed(1)}M`;
  }

  if (numeric >= 1000) {
    return `${(numeric / 1000).toFixed(1)}k`;
  }

  return `${Math.round(numeric)}`;
}

function KPIItem({ label, value, caption }) {
  return (
    <article className="stats-kpi-card">
      <span className="stats-kpi-label">{label}</span>
      <strong>{value}</strong>
      <p>{caption}</p>
    </article>
  );
}

function DashboardCard({ title, subtitle, children, className = '' }) {
  return (
    <article className={`stats-card ${className}`.trim()}>
      <div className="stats-card__head">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      {children}
    </article>
  );
}

function RecommendationCard({ recommendation }) {
  return (
    <article className="stats-recommendation-card">
      <span className="stats-kpi-label">Executive summary</span>
      <h2>{recommendation.title}</h2>
      <p>{recommendation.summary}</p>
      <div className="stats-recommendation-points">
        {recommendation.bullets.map((bullet) => (
          <div key={bullet} className="stats-recommendation-point">
            <strong>{bullet}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}

function Legend({ items }) {
  return (
    <div className="stats-chart-legend">
      {items.map((item) => (
        <div key={item.label} className="stats-chart-legend__item">
          <span className="stats-chart-legend__swatch" style={{ backgroundColor: item.color }} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function MetricBarChart({ data }) {
  const width = 720;
  const height = 320;
  const margin = { top: 28, right: 22, bottom: 56, left: 22 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const groupWidth = data.length ? innerWidth / data.length : innerWidth;
  const gap = 14;
  const barWidth = Math.max(24, (groupWidth - gap * 3) / 2);
  const maxROI = Math.max(...data.map((item) => item.averageROI || 0), 0.01);
  const maxRevenue = Math.max(...data.map((item) => item.averageAnnualRevenue || 0), 1);

  return (
    <div className="stats-chart">
      <Legend
        items={[
          { label: 'Average ROI', color: CHART_COLORS.roi },
          { label: 'Average annual revenue', color: CHART_COLORS.revenue }
        ]}
      />
      <svg viewBox={`0 0 ${width} ${height}`} className="stats-chart-svg" role="img" aria-label="Bar chart">
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              x1="0"
              x2={innerWidth}
              y1={innerHeight * ratio}
              y2={innerHeight * ratio}
              stroke="rgba(15, 23, 42, 0.08)"
              strokeDasharray="4 6"
            />
          ))}

          {data.map((row, index) => {
            const groupX = index * groupWidth;
            const roiHeight = ((row.averageROI || 0) / maxROI) * (innerHeight - 18);
            const revenueHeight = ((row.averageAnnualRevenue || 0) / maxRevenue) * (innerHeight - 18);

            return (
              <g key={row.label}>
                <rect
                  x={groupX + gap}
                  y={innerHeight - roiHeight}
                  width={barWidth}
                  height={roiHeight}
                  rx="14"
                  fill={CHART_COLORS.roi}
                />
                <rect
                  x={groupX + gap * 2 + barWidth}
                  y={innerHeight - revenueHeight}
                  width={barWidth}
                  height={revenueHeight}
                  rx="14"
                  fill={CHART_COLORS.revenue}
                />
                <text x={groupX + gap + (barWidth / 2)} y={Math.max(innerHeight - roiHeight - 8, 12)} textAnchor="middle" className="stats-chart-value">
                  {formatPercent(row.averageROI)}
                </text>
                <text x={groupX + gap * 2 + barWidth + (barWidth / 2)} y={Math.max(innerHeight - revenueHeight - 8, 12)} textAnchor="middle" className="stats-chart-value">
                  {formatCompactMoney(row.averageAnnualRevenue)}
                </text>
                <text x={groupX + (groupWidth / 2)} y={innerHeight + 30} textAnchor="middle" className="stats-axis-label">
                  {row.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

function LineChart({ data }) {
  const width = 720;
  const height = 320;
  const margin = { top: 24, right: 24, bottom: 48, left: 70 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const minValue = Math.min(...data.map((item) => item.value), 0);
  const range = Math.max(maxValue - minValue, 1);

  const points = data.map((item, index) => {
    const x = margin.left + ((innerWidth / Math.max(data.length - 1, 1)) * index);
    const y = margin.top + innerHeight - (((item.value - minValue) / range) * innerHeight);
    return { ...item, x, y };
  });

  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

  return (
    <div className="stats-chart">
      <svg viewBox={`0 0 ${width} ${height}`} className="stats-chart-svg" role="img" aria-label="Line chart">
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1={margin.left}
            x2={width - margin.right}
            y1={margin.top + innerHeight * ratio}
            y2={margin.top + innerHeight * ratio}
            stroke="rgba(15, 23, 42, 0.08)"
            strokeDasharray="4 6"
          />
        ))}

        <path d={path} fill="none" stroke={CHART_COLORS.line} strokeWidth="4" strokeLinecap="round" />

        {points.map((point) => (
          <g key={point.year}>
            <circle cx={point.x} cy={point.y} r="6" fill={CHART_COLORS.point} stroke="#fff" strokeWidth="3" />
            <text x={point.x} y={height - 18} textAnchor="middle" className="stats-axis-label">
              {point.year}
            </text>
            <text x={point.x} y={point.y - 12} textAnchor="middle" className="stats-chart-value">
              {formatCompactMoney(point.value)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

function describeSlice(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

function PieChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const center = 140;
  const radius = 108;
  let currentAngle = 0;

  return (
    <div className="stats-pie-layout">
      <svg viewBox="0 0 280 280" className="stats-pie-svg" role="img" aria-label="Pie chart">
        {data.map((item, index) => {
          const angle = total ? (item.value / total) * 360 : 0;
          const path = describeSlice(center, center, radius, currentAngle, currentAngle + angle);
          const slice = (
            <path
              key={item.label}
              d={path}
              fill={CHART_COLORS.pie[index % CHART_COLORS.pie.length]}
              stroke="#fff"
              strokeWidth="3"
            />
          );
          currentAngle += angle;
          return slice;
        })}
        <circle cx={center} cy={center} r="56" fill="#fffcf7" />
        <text x={center} y={center - 2} textAnchor="middle" className="stats-pie-total-label">Portfolio</text>
        <text x={center} y={center + 24} textAnchor="middle" className="stats-pie-total-value">{formatInteger(total)}</text>
      </svg>

      <div className="stats-pie-legend">
        {data.map((item, index) => (
          <div key={item.label} className="stats-pie-legend__item">
            <span className="stats-chart-legend__swatch" style={{ backgroundColor: CHART_COLORS.pie[index % CHART_COLORS.pie.length] }} />
            <div>
              <strong>{item.label}</strong>
              <span>{formatInteger(item.value)} properties</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightsList({ insights }) {
  return (
    <section className="stats-insights-grid">
      {insights.map((insight) => (
        <article key={insight} className="stats-insight-card">
          <span className="stats-kpi-label">Simple conclusion</span>
          <p>{insight}</p>
        </article>
      ))}
    </section>
  );
}

function PropertyTable({ rows }) {
  return (
    <div className="stats-table-shell">
      <table className="stats-table">
        <thead>
          <tr>
            <th>Name / ID</th>
            <th>Type</th>
            <th>ROI</th>
            <th>Annual revenue</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((property) => (
            <tr key={property.id}>
              <td>
                <strong>{property.name}</strong>
                <span>{property.id}</span>
              </td>
              <td>{property.investmentType}</td>
              <td>{formatPercent(property.roi)}</td>
              <td>{formatCurrency(property.annualRevenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function StatistiquesPage() {
  const [rawProperties, setRawProperties] = useState([]);
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
        const properties = Array.isArray(payload)
          ? payload
          : (Array.isArray(payload.data) ? payload.data : payload.properties);

        if (active) {
          setRawProperties(Array.isArray(properties) ? properties : []);
          setError('');
        }
      } catch (loadError) {
        if (active) {
          setError('Unable to load statistics data from /api/properties.');
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

  const dashboard = useMemo(() => buildStatisticsDashboard(rawProperties), [rawProperties]);

  return (
    <main className="stats-page">
      <section className="stats-shell">
        <div className="stats-hero">
          <div>
            <p className="stats-eyebrow">Statistiques</p>
            <h1>Easy-to-read investment dashboard for all properties</h1>
            <p className="stats-copy">
              This page aggregates the full portfolio and helps users quickly understand which property type brings the best ROI and revenue potential.
            </p>
          </div>
          {!loading && !error && dashboard ? <RecommendationCard recommendation={dashboard.recommendation} /> : null}
        </div>

        {loading ? <div className="stats-state">Loading statistics dashboard...</div> : null}
        {!loading && error ? <div className="stats-state stats-state--error">{error}</div> : null}

        {!loading && !error && dashboard ? (
          <>
            <section className="stats-kpi-grid stats-kpi-grid--four">
              <KPIItem
                label="Total properties"
                value={formatInteger(dashboard.kpis.totalProperties)}
                caption="Every villa and apartment unit included in the portfolio analysis."
              />
              <KPIItem
                label="Average ROI"
                value={formatPercent(dashboard.kpis.averageROI)}
                caption="Average yearly return across all analyzed properties."
              />
              <KPIItem
                label="Average revenue"
                value={formatCurrency(dashboard.kpis.averageRevenue)}
                caption="Average annual rental revenue generated by one property."
              />
              <KPIItem
                label="Best property type"
                value={dashboard.kpis.bestInvestmentType?.label || 'N/A'}
                caption={dashboard.kpis.bestInvestmentType ? `${formatPercent(dashboard.kpis.bestInvestmentType.averageROI)} average ROI` : 'No ranking available.'}
              />
            </section>

            <section className="stats-mini-summary-grid">
              <article className="stats-mini-summary-card">
                <span className="stats-kpi-label">Portfolio revenue</span>
                <strong>{formatCurrency(dashboard.totals.annualRevenue)}</strong>
                <p>Total estimated annual revenue across all properties.</p>
              </article>
              <article className="stats-mini-summary-card">
                <span className="stats-kpi-label">Best property</span>
                <strong>{dashboard.kpis.bestPropertyROI?.name || 'N/A'}</strong>
                <p>{dashboard.kpis.bestPropertyROI ? `${formatPercent(dashboard.kpis.bestPropertyROI.roi)} ROI` : 'No top property available.'}</p>
              </article>
            </section>

            <section className="stats-chart-grid">
              <DashboardCard title="Villas vs Apartments" subtitle="Compare the two big investment families at a glance.">
                <MetricBarChart data={dashboard.charts.villasVsApartments} />
              </DashboardCard>

              <DashboardCard title="S+1 vs S+2 vs S+3 vs Villas" subtitle="See which specific property type wins on ROI and revenue.">
                <MetricBarChart data={dashboard.charts.investmentTypes} />
              </DashboardCard>

              <DashboardCard title="Property distribution" subtitle="Understand how the portfolio is split by investment type.">
                <PieChart data={dashboard.charts.typeDistribution} />
              </DashboardCard>

              <DashboardCard title="Pool vs No pool" subtitle="Measure how much a pool changes investment performance.">
                <MetricBarChart data={dashboard.charts.poolImpact} />
              </DashboardCard>

              <DashboardCard title="5-year price projection" subtitle="A simple projection using a 5% annual growth assumption." className="stats-card--wide">
                <LineChart data={dashboard.charts.priceProjection} />
              </DashboardCard>
            </section>

            <DashboardCard title="Automatic insights" subtitle="Short conclusions generated from all properties, without single-property drilldown.">
              <InsightsList insights={dashboard.insights} />
            </DashboardCard>

            <DashboardCard title="Top 5 properties by ROI" subtitle="The best five opportunities ranked by return on investment.">
              <PropertyTable rows={dashboard.topInvestments} />
            </DashboardCard>
          </>
        ) : null}
      </section>
    </main>
  );
}
