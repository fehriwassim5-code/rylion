import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { COLORS, formatCurrency } from './dashboardUtils';

function useContainerWidth(ref) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) {
      return undefined;
    }

    const update = () => {
      setWidth(ref.current ? ref.current.getBoundingClientRect().width : 0);
    };

    update();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setWidth(entry.contentRect.width);
      }
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}

function ensureTooltip(container) {
  const root = d3.select(container);
  let tooltip = root.select('.bi-chart-tooltip');

  if (tooltip.empty()) {
    tooltip = root.append('div').attr('class', 'bi-chart-tooltip');
  }

  return tooltip;
}

function showTooltip(tooltip, event, html) {
  tooltip
    .style('opacity', 1)
    .html(html)
    .style('left', `${event.offsetX + 18}px`)
    .style('top', `${event.offsetY + 18}px`);
}

function hideTooltip(tooltip) {
  tooltip.style('opacity', 0);
}

function drawBarChart(node, data, width) {
  if (!node || !width || !data.length) {
    return;
  }

  // Grouped bars compare seasonal revenue against annual revenue by category.
  const height = 360;
  const margin = { top: 20, right: 20, bottom: 56, left: 72 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const root = d3.select(node);
  root.selectAll('*').remove();
  const tooltip = ensureTooltip(node);

  const svg = root.append('svg').attr('viewBox', `0 0 ${width} ${height}`).attr('class', 'bi-chart-svg');
  const chart = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
  const series = ['revenu_ete', 'revenu_annuel'];

  const x0 = d3.scaleBand().domain(data.map((item) => item.label)).range([0, innerWidth]).padding(0.24);
  const x1 = d3.scaleBand().domain(series).range([0, x0.bandwidth()]).padding(0.14);
  const y = d3.scaleLinear()
    .domain([0, d3.max(data, (item) => Math.max(item.revenu_ete, item.revenu_annuel)) || 0])
    .nice()
    .range([innerHeight, 0]);

  chart.append('g')
    .call(d3.axisLeft(y).ticks(5).tickFormat((value) => d3.format('.2s')(value)))
    .call((g) => g.selectAll('.domain').remove())
    .call((g) => g.selectAll('.tick line').clone().attr('x2', innerWidth).attr('stroke', COLORS.grid))
    .call((g) => g.selectAll('text').attr('fill', COLORS.text));

  chart.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x0))
    .call((g) => g.selectAll('.domain').attr('stroke', COLORS.grid))
    .call((g) => g.selectAll('text').attr('fill', COLORS.text).attr('font-size', 12));

  const fills = {
    revenu_ete: COLORS.summer,
    revenu_annuel: COLORS.annual
  };

  chart.selectAll('.bi-bar-group')
    .data(data)
    .join('g')
    .attr('class', 'bi-bar-group')
    .attr('transform', (item) => `translate(${x0(item.label)},0)`)
    .selectAll('rect')
    .data((item) => series.map((key) => ({ key, label: item.label, value: item[key] })))
    .join('rect')
    .attr('x', (item) => x1(item.key))
    .attr('y', innerHeight)
    .attr('width', x1.bandwidth())
    .attr('height', 0)
    .attr('rx', 14)
    .attr('fill', (item) => fills[item.key])
    .on('mousemove', function onMove(event, item) {
      d3.select(this).attr('opacity', 0.88);
      showTooltip(
        tooltip,
        event,
        `<strong>${item.label}</strong><br>${item.key === 'revenu_ete' ? 'Revenu ete' : 'Revenu annuel'}: ${formatCurrency(item.value)}`
      );
    })
    .on('mouseleave', function onLeave() {
      d3.select(this).attr('opacity', 1);
      hideTooltip(tooltip);
    })
    .transition()
    .duration(900)
    .ease(d3.easeCubicOut)
    .attr('y', (item) => y(item.value))
    .attr('height', (item) => innerHeight - y(item.value));
}

function drawPieChart(node, data, width) {
  if (!node || !width || !data.length) {
    return;
  }

  const height = 360;
  const radius = Math.min(width, height) / 2 - 22;
  const root = d3.select(node);
  root.selectAll('*').remove();
  const tooltip = ensureTooltip(node);

  const svg = root.append('svg').attr('viewBox', `0 0 ${width} ${height}`).attr('class', 'bi-chart-svg');
  const chart = svg.append('g').attr('transform', `translate(${width / 2},${height / 2})`);
  const pie = d3.pie().value((item) => item.value).sort(null);
  const arc = d3.arc().innerRadius(radius * 0.58).outerRadius(radius);
  const hoverArc = d3.arc().innerRadius(radius * 0.58).outerRadius(radius + 8);
  const color = d3.scaleOrdinal().domain(data.map((item) => item.label)).range([COLORS.villa, COLORS.apartment]);

  chart.selectAll('path')
    .data(pie(data))
    .join('path')
    .attr('fill', (item) => color(item.data.label))
    .attr('stroke', '#fff')
    .attr('stroke-width', 3)
    .on('mousemove', function onMove(event, item) {
      d3.select(this).transition().duration(160).attr('d', hoverArc(item));
      showTooltip(tooltip, event, `<strong>${item.data.label}</strong><br>${item.data.value} biens`);
    })
    .on('mouseleave', function onLeave(event, item) {
      d3.select(this).transition().duration(160).attr('d', arc(item));
      hideTooltip(tooltip);
    })
    .transition()
    .duration(900)
    .attrTween('d', (item) => {
      const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, item);
      return (time) => arc(interpolate(time));
    });

  chart.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '-0.15em')
    .attr('fill', COLORS.text)
    .attr('font-size', 13)
    .text('Portfolio');

  chart.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '1.25em')
    .attr('fill', COLORS.text)
    .attr('font-size', 24)
    .attr('font-weight', 800)
    .text(d3.sum(data, (item) => item.value));
}

function drawLineChart(node, data, width) {
  if (!node || !width || !data.length) {
    return;
  }

  // The line chart visualizes the requested 5-year price projection.
  const height = 360;
  const margin = { top: 18, right: 18, bottom: 52, left: 72 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const root = d3.select(node);
  root.selectAll('*').remove();
  const tooltip = ensureTooltip(node);

  const svg = root.append('svg').attr('viewBox', `0 0 ${width} ${height}`).attr('class', 'bi-chart-svg');
  const chart = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scalePoint().domain(data.map((item) => item.year)).range([0, innerWidth]);
  const y = d3.scaleLinear()
    .domain([0, d3.max(data, (item) => item.value) || 0])
    .nice()
    .range([innerHeight, 0]);

  chart.append('g')
    .call(d3.axisLeft(y).ticks(5).tickFormat((value) => d3.format('.2s')(value)))
    .call((g) => g.selectAll('.domain').remove())
    .call((g) => g.selectAll('.tick line').clone().attr('x2', innerWidth).attr('stroke', COLORS.grid))
    .call((g) => g.selectAll('text').attr('fill', COLORS.text));

  chart.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x))
    .call((g) => g.selectAll('.domain').attr('stroke', COLORS.grid))
    .call((g) => g.selectAll('text').attr('fill', COLORS.text));

  const line = d3.line()
    .x((item) => x(item.year))
    .y((item) => y(item.value))
    .curve(d3.curveMonotoneX);

  chart.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', COLORS.line)
    .attr('stroke-width', 4)
    .attr('stroke-linecap', 'round')
    .attr('stroke-dasharray', function getLength() {
      return `${this.getTotalLength()} ${this.getTotalLength()}`;
    })
    .attr('stroke-dashoffset', function getLength() {
      return this.getTotalLength();
    })
    .attr('d', line)
    .transition()
    .duration(1000)
    .ease(d3.easeCubicOut)
    .attr('stroke-dashoffset', 0);

  chart.selectAll('circle')
    .data(data)
    .join('circle')
    .attr('cx', (item) => x(item.year))
    .attr('cy', (item) => y(item.value))
    .attr('r', 0)
    .attr('fill', '#fff')
    .attr('stroke', COLORS.line)
    .attr('stroke-width', 4)
    .on('mousemove', function onMove(event, item) {
      d3.select(this).attr('fill', COLORS.summer);
      showTooltip(tooltip, event, `<strong>${item.year}</strong><br>Projection: ${formatCurrency(item.value)}`);
    })
    .on('mouseleave', function onLeave() {
      d3.select(this).attr('fill', '#fff');
      hideTooltip(tooltip);
    })
    .transition()
    .delay((_, index) => index * 80)
    .duration(220)
    .attr('r', 7);
}

function ChartCard({ title, copy, chartRef }) {
  return (
    <article className="bi-chart-card">
      <div className="bi-chart-copy">
        <h3>{title}</h3>
        <p>{copy}</p>
      </div>
      <div ref={chartRef} className="bi-chart-stage" />
    </article>
  );
}

export default function Charts({ charts }) {
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const lineChartRef = useRef(null);
  const barWidth = useContainerWidth(barChartRef);
  const pieWidth = useContainerWidth(pieChartRef);
  const lineWidth = useContainerWidth(lineChartRef);

  useEffect(() => {
    drawBarChart(barChartRef.current, charts.barData, barWidth);
  }, [charts.barData, barWidth]);

  useEffect(() => {
    drawPieChart(pieChartRef.current, charts.pieData, pieWidth);
  }, [charts.pieData, pieWidth]);

  useEffect(() => {
    drawLineChart(lineChartRef.current, charts.lineData, lineWidth);
  }, [charts.lineData, lineWidth]);

  return (
    <section className="bi-chart-grid">
      <ChartCard
        title="Revenu ete vs annuel"
        copy="Bar chart groupe par categorie sur l'ensemble du portefeuille."
        chartRef={barChartRef}
      />
      <ChartCard
        title="Distribution villa vs appartement"
        copy="Repartition globale des biens par type."
        chartRef={pieChartRef}
      />
      <article className="bi-chart-card bi-chart-card--wide">
        <div className="bi-chart-copy">
          <h3>Price projection 5 years</h3>
          <p>Projection moyenne des prix avec une croissance de 5% par an.</p>
        </div>
        <div ref={lineChartRef} className="bi-chart-stage" />
      </article>
    </section>
  );
}
