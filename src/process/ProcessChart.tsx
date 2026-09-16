import type { ProcessView } from './processView'
import { formatElapsed, formatErrorFlags } from './processView'
import './ProcessChart.css'

const WIDTH = 640
const HEIGHT = 260
const PAD = { top: 16, right: 16, bottom: 34, left: 46 }
const TICK_SHARES = [0, 0.25, 0.5, 0.75, 1]

type Props = {
  view: ProcessView
}

export default function ProcessChart({ view }: Props) {
  const points = view.points.filter(
    (point): point is typeof point & { temperature: number } => point.temperature !== null,
  )
  if (points.length === 0) return null

  const plotWidth = WIDTH - PAD.left - PAD.right
  const plotHeight = HEIGHT - PAD.top - PAD.bottom

  const duration = points[points.length - 1].elapsed || 1
  const temperatures = points.map((point) => point.temperature)
  const lowest = Math.min(...temperatures)
  const highest = Math.max(...temperatures)
  const span = highest - lowest || 1
  const yMin = lowest - span * 0.1
  const yMax = highest + span * 0.1

  const toX = (elapsed: number) => PAD.left + (elapsed / duration) * plotWidth
  const toY = (temperature: number) =>
    PAD.top + (1 - (temperature - yMin) / (yMax - yMin)) * plotHeight

  const line = points
    .map((point) => `${toX(point.elapsed).toFixed(1)},${toY(point.temperature).toFixed(1)}`)
    .join(' ')

  return (
    <div className="chart">
      <div className="chart-head">
        <strong className={view.programName ? 'chart-program' : 'chart-program missing'}>
          {view.programName ?? 'Programmname folgt'}
        </strong>
        <span className="chart-device">
          {view.deviceKind ?? 'Gerät'}
          {view.deviceSerial && ` · SN ${view.deviceSerial}`}
        </span>
      </div>

      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Temperaturverlauf des Prozesses">
        {TICK_SHARES.map((share, index) => {
          const temperature = yMin + (yMax - yMin) * share
          return (
            <g key={`y-${index}`}>
              <line
                className="chart-grid"
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={toY(temperature)}
                y2={toY(temperature)}
              />
              <text
                className="chart-tick"
                x={PAD.left - 8}
                y={toY(temperature) + 4}
                textAnchor="end"
              >
                {Math.round(temperature)}
              </text>
            </g>
          )
        })}

        {TICK_SHARES.map((share, index) => (
          <text
            key={`x-${index}`}
            className="chart-tick"
            x={toX(duration * share)}
            y={HEIGHT - PAD.bottom + 20}
            textAnchor="middle"
          >
            {formatElapsed(duration * share)}
          </text>
        ))}

        <polyline className="chart-line" points={line} />

        {view.errors.map((point, index) => (
          <circle
            key={`error-${index}`}
            className="chart-error"
            cx={toX(point.elapsed)}
            cy={toY(point.temperature ?? lowest)}
            r={4.5}
          >
            <title>{`${formatElapsed(point.elapsed)} · ${formatErrorFlags(point)}`}</title>
          </circle>
        ))}
      </svg>

      <div className="chart-legend">
        <span>Ist-Temperatur (CT) in °C</span>
        <span>Dauer {formatElapsed(duration)}</span>
        {view.errors.length > 0 && (
          <span className="chart-legend-error">
            {view.errors.length === 1 ? '1 Fehler' : `${view.errors.length} Fehler`}
          </span>
        )}
        {view.droppedTimestamps > 0 && (
          <span>{view.droppedTimestamps} Messpunkt(e) mit unplausibler Zeit ausgelassen</span>
        )}
      </div>
    </div>
  )
}
