import { useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { ProcessView } from './processView'
import { formatElapsed, formatErrorFlags } from './processView'
import './ProcessChart.css'

const WIDTH = 640
const HEIGHT = 260
const PAD = { top: 16, right: 16, bottom: 34, left: 46 }
const PLOT_WIDTH = WIDTH - PAD.left - PAD.right
const PLOT_HEIGHT = HEIGHT - PAD.top - PAD.bottom
const TICK_SHARES = [0, 0.25, 0.5, 0.75, 1]
const MIN_WINDOW_SHARE = 0.02
const ZOOM_IN = 0.82
const ZOOM_OUT = 1.22

type Props = {
  view: ProcessView
}

// Sichtbarer Abschnitt der Zeitachse in Sekunden seit Prozessstart.
type TimeWindow = {
  start: number
  end: number
}

function clampWindow(start: number, end: number, duration: number): TimeWindow {
  const minSpan = Math.min(duration, Math.max(1, duration * MIN_WINDOW_SHARE))
  const span = Math.min(duration, Math.max(minSpan, end - start))
  const maxStart = Math.max(0, duration - span)
  const nextStart = Math.min(Math.max(0, start), maxStart)
  return { start: nextStart, end: nextStart + span }
}

function zoomWindow(
  current: TimeWindow,
  focus: number,
  factor: number,
  duration: number,
): TimeWindow {
  const span = current.end - current.start || duration
  const share = (focus - current.start) / span
  const nextSpan = span * factor
  const nextStart = focus - share * nextSpan
  return clampWindow(nextStart, nextStart + nextSpan, duration)
}

// Das SVG skaliert ueber die viewBox, deshalb muss eine Pixelposition erst
// auf das Koordinatensystem mit der Breite WIDTH umgerechnet werden.
function toSvgX(svg: SVGSVGElement, clientX: number): number {
  const rect = svg.getBoundingClientRect()
  return ((clientX - rect.left) / rect.width) * WIDTH
}

export default function ProcessChart({ view }: Props) {
  const clipId = useId()
  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragRef = useRef<{ pointerId: number; lastX: number } | null>(null)
  const [panning, setPanning] = useState(false)

  const points = view.points.filter(
    (point): point is typeof point & { temperature: number } => point.temperature !== null,
  )
  const duration = points.length > 0 ? points[points.length - 1].elapsed || 1 : 1

  const [timeWindow, setTimeWindow] = useState<TimeWindow>({ start: 0, end: duration })
  const windowRef = useRef(timeWindow)
  windowRef.current = timeWindow

  // React haengt onWheel passiv an, damit laesst sich das Scrollen der Seite
  // nicht unterdruecken. Deshalb ein eigener Listener am SVG.
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    function handleWheel(event: WheelEvent) {
      event.preventDefault()
      const current = windowRef.current
      const span = current.end - current.start || duration
      const focus = current.start + ((toSvgX(svg!, event.clientX) - PAD.left) / PLOT_WIDTH) * span
      setTimeWindow(zoomWindow(current, focus, event.deltaY < 0 ? ZOOM_IN : ZOOM_OUT, duration))
    }

    svg.addEventListener('wheel', handleWheel, { passive: false })
    return () => svg.removeEventListener('wheel', handleWheel)
  }, [duration])

  if (points.length === 0) return null

  const temperatures = points.map((point) => point.temperature)
  const lowest = Math.min(...temperatures)
  const highest = Math.max(...temperatures)
  const spread = highest - lowest || 1
  const yMin = lowest - spread * 0.1
  const yMax = highest + spread * 0.1

  const windowSpan = timeWindow.end - timeWindow.start || 1
  const zoomed = timeWindow.start > 0 || timeWindow.end < duration

  const toX = (elapsed: number) =>
    PAD.left + ((elapsed - timeWindow.start) / windowSpan) * PLOT_WIDTH
  const toY = (temperature: number) =>
    PAD.top + (1 - (temperature - yMin) / (yMax - yMin)) * PLOT_HEIGHT

  const line = points
    .map((point) => `${toX(point.elapsed).toFixed(1)},${toY(point.temperature).toFixed(1)}`)
    .join(' ')

  function startPan(event: ReactPointerEvent<SVGSVGElement>) {
    if (event.button !== 0) return
    dragRef.current = { pointerId: event.pointerId, lastX: event.clientX }
    event.currentTarget.setPointerCapture(event.pointerId)
    setPanning(true)
  }

  function movePan(event: ReactPointerEvent<SVGSVGElement>) {
    const drag = dragRef.current
    const svg = svgRef.current
    if (!drag || !svg || drag.pointerId !== event.pointerId) return

    const deltaSvgX = toSvgX(svg, event.clientX) - toSvgX(svg, drag.lastX)
    const deltaElapsed = -(deltaSvgX / PLOT_WIDTH) * windowSpan
    drag.lastX = event.clientX
    setTimeWindow((current) =>
      clampWindow(current.start + deltaElapsed, current.end + deltaElapsed, duration),
    )
  }

  function endPan(event: ReactPointerEvent<SVGSVGElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return
    dragRef.current = null
    setPanning(false)
  }

  function zoomFromCenter(factor: number) {
    setTimeWindow((current) =>
      zoomWindow(current, (current.start + current.end) / 2, factor, duration),
    )
  }

  return (
    <div className="chart">
      <div className="chart-head">
        <strong className={view.programName ? 'chart-program' : 'chart-program missing'}>
          {view.programName ?? 'Programmname folgt'}
        </strong>
        <span className="chart-device">
          {view.deviceKind ?? 'Gerät'}
          {view.deviceTypeId !== null && ` (${view.deviceTypeId})`}
          {view.deviceSerial && ` · SN ${view.deviceSerial}`}
        </span>
      </div>

      <div className="chart-tools">
        <span className="chart-tools-hint">Mausrad zoomt, Ziehen verschiebt die Zeitachse</span>
        <div className="chart-tools-actions">
          <button type="button" className="chart-tool-btn" onClick={() => zoomFromCenter(ZOOM_IN)}>
            Zoom +
          </button>
          <button
            type="button"
            className="chart-tool-btn"
            disabled={!zoomed}
            onClick={() => zoomFromCenter(ZOOM_OUT)}
          >
            Zoom -
          </button>
          <button
            type="button"
            className="chart-tool-btn"
            disabled={!zoomed}
            onClick={() => setTimeWindow({ start: 0, end: duration })}
          >
            Gesamte Dauer
          </button>
        </div>
      </div>

      <svg
        ref={svgRef}
        className={panning ? 'chart-plot is-panning' : 'chart-plot'}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Temperaturverlauf des Prozesses, zoombar mit dem Mausrad und verschiebbar durch Ziehen"
        onPointerDown={startPan}
        onPointerMove={movePan}
        onPointerUp={endPan}
        onPointerCancel={endPan}
      >
        <clipPath id={clipId}>
          <rect x={PAD.left} y={PAD.top} width={PLOT_WIDTH} height={PLOT_HEIGHT} />
        </clipPath>

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
            x={toX(timeWindow.start + windowSpan * share)}
            y={HEIGHT - PAD.bottom + 20}
            textAnchor="middle"
          >
            {formatElapsed(timeWindow.start + windowSpan * share)}
          </text>
        ))}

        <g clipPath={`url(#${clipId})`}>
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
        </g>
      </svg>

      {view.program && view.program.params.length > 0 && (
        <div className="chart-prog">
          {view.program.params.map((param) => (
            <div key={param.slot} className="chart-prog-item">
              <span>{param.label}</span>
              <strong>{param.display}</strong>
            </div>
          ))}
        </div>
      )}

      <div className="chart-legend">
        <span>Ist-Temperatur (CT) in °C</span>
        {zoomed && (
          <span>
            Sichtbar {formatElapsed(timeWindow.start)} bis {formatElapsed(timeWindow.end)}
          </span>
        )}
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
