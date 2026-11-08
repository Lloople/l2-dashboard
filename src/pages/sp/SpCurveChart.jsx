/**
 * Gràfic de la corva de SP per nivell i raça.
 * Component Fase 2: selector de raça + gràfic SVG (sense dependències).
 * El càlcul viu a src/services/spCurve.js (capa de dades optimitzada).
 */
import { useEffect, useState } from 'react'
import { computeSpCurve, RACES } from '../../services/spCurve.js'

export default function SpCurveChart() {
  const [race, setRace] = useState('human')
  const [curve, setCurve] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    computeSpCurve(race)
      .then((c) => {
        if (!cancelled) {
          setCurve(c)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      });
    return () => { cancelled = true; }
  }, [race]);

  return (
    <div className="sp-curve-chart">
      <div className="chart-header">
        <h2 className="panel-title">Corva de SP per nivell</h2>
        <select value={race} onChange={(e) => setRace(e.target.value)} className="race-select">
          {RACES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
      </div>

      {loading && <p className="muted">Calculant corva...</p>}
      {error && <p className="error">Error: {error}</p>}
      {!loading && !error && curve && <SpCurveSvg curve={curve} />}
    </div>
  );
}

function SpCurveSvg({ curve }) {
  const W = 800, H = 400
  const PAD = { top: 20, right: 20, bottom: 40, left: 60 }
  const iw = W - PAD.left - PAD.right
  const ih = H - PAD.top - PAD.bottom

  const maxX = Math.max(...curve.map((p) => p.level))
  const maxY = Math.max(...curve.map((p) => p.spCumulative), 1)

  const px = (x) => PAD.left + ((x - 1) / Math.max(1, maxX - 1)) * iw
  const py = (y) => PAD.top + ih - (y / maxY) * ih

  const line = curve.map((p) => `${px(p.level)},${py(p.spCumulative)}`).join(' ')

  const ticksY = 5
  const yTicks = Array.from({ length: ticksY + 1 }, (_, i) => Math.round((maxY / ticksY) * i))
  const stepX = Math.max(1, Math.ceil(curve.length / 10))
  const xTicks = curve.filter((_, i) => i % stepX === 0)
  const stepDot = Math.max(1, Math.ceil(curve.length / 40))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="curve-svg" role="img" aria-label="Corva de SP acumulada per nivell">
      {/* Eix Y */}
      {yTicks.map((t) => (
        <g key={t}>
          <line x1={PAD.left} y1={py(t)} x2={W - PAD.right} y2={py(t)} stroke="#2a2f3d" strokeDasharray="3 3" />
          <text x={PAD.left - 8} y={py(t) + 4} textAnchor="end" className="axis-label">{t.toLocaleString()}</text>
        </g>
      ))}
      {/* Eix X */}
      {xTicks.map((p) => (
        <text key={p.level} x={px(p.level)} y={H - PAD.bottom + 20} textAnchor="middle" className="axis-label">Lv {p.level}</text>
      ))}
      {/* Àrea sota la corba */}
      <polygon points={`${PAD.left},${PAD.top + ih} ${line} ${px(maxX)},${PAD.top + ih}`} fill="rgba(212,160,23,0.15)" />
      {/* Línia */}
      <polyline points={line} fill="none" stroke="var(--accent)" strokeWidth="2" />
      {/* Punts */}
      {curve.filter((_, i) => i % stepDot === 0).map((p) => (
        <circle key={p.level} cx={px(p.level)} cy={py(p.spCumulative)} r="2.5" fill="var(--accent)" />
      ))}
    </svg>
  )
}