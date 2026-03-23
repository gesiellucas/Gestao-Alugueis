'use client';
import React from 'react';

interface GaugeSegment {
  label: string;
  value: number;
  color: string;
}

interface GaugeChartProps {
  segments: GaugeSegment[];
  total: number;
}

const GaugeChart: React.FC<GaugeChartProps> = ({ segments, total }) => {
  const cx = 120;
  const cy = 120;
  const r = 90;
  const strokeWidth = 20;
  // Semicircle: from 180° to 360° (π to 2π)
  const startAngle = Math.PI;
  const totalAngle = Math.PI; // 180 degrees
  const circumference = r * totalAngle;

  // Build arcs
  let accumulated = 0;
  const arcs = segments.map((seg) => {
    const fraction = total > 0 ? seg.value / total : 0;
    const offset = accumulated;
    accumulated += fraction;
    return { ...seg, fraction, offset };
  });

  // Largest segment percentage for center display
  const largest = segments.length > 0
    ? segments.reduce((max, s) => (s.value > max.value ? s : max), segments[0])
    : null;
  const largestPct = largest && total > 0 ? Math.round((largest.value / total) * 100) : 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 240, height: 140 }}>
        <svg width="240" height="140" viewBox="0 0 240 140">
          {/* Background track */}
          <path
            d={describeArc(cx, cy, r, startAngle, startAngle + totalAngle)}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Colored segments */}
          {arcs.map((arc, i) => {
            if (arc.fraction === 0) return null;
            const aStart = startAngle + arc.offset * totalAngle;
            const aEnd = startAngle + (arc.offset + arc.fraction) * totalAngle;
            const dashLength = arc.fraction * circumference;
            const gapLength = circumference - dashLength;
            const dashOffset = arc.offset * circumference;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={arc.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dashLength} ${gapLength}`}
                strokeDashoffset={-dashOffset}
                strokeLinecap="butt"
                style={{
                  transform: 'rotate(180deg)',
                  transformOrigin: `${cx}px ${cy}px`,
                }}
              />
            );
          })}
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className="text-3xl font-extrabold text-slate-800">{largestPct}%</span>
          <span className="text-xs font-semibold text-slate-400 mt-0.5">{largest?.label ?? 'Sem dados'}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-4">
        {segments.map((seg, i) => {
          const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
          return (
            <div key={i} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-xs font-bold text-slate-600">
                {seg.label} <span className="text-slate-400 font-semibold">({seg.value} — {pct}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

export default GaugeChart;
