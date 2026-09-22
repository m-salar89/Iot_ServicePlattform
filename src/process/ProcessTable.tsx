import type { MouseEvent } from 'react'
import type { ProcessView } from './processView'
import { SENSOR_KEYS, formatErrorFlags, formatSensorValue, formatTimestamp } from './processView'
import './ProcessTable.css'

type Props = {
  view: ProcessView
  onDownload: () => void
}

export default function ProcessTable({ view, onDownload }: Props) {
  function download(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    onDownload()
  }

  return (
    <details className="process-table" open>
      <summary>
        <span>Prozessdaten anzeigen</span>
        <button type="button" className="process-download" onClick={download}>
          Als Excel herunterladen
        </button>
      </summary>
      <div className="process-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Zeit</th>
              {SENSOR_KEYS.map((key) => (
                <th key={key}>{key}</th>
              ))}
              <th>Error</th>
              <th>errorFlags</th>
            </tr>
          </thead>
          <tbody>
            {view.points.map((point, index) => {
              const flags = formatErrorFlags(point)
              return (
                <tr key={`${point.t}-${index}`} className={point.error ? 'has-error' : undefined}>
                  <td>{formatTimestamp(point.t)}</td>
                  {SENSOR_KEYS.map((key) => (
                    <td key={key}>{formatSensorValue(point.sensors[key])}</td>
                  ))}
                  <td>{point.error ? 'Ja' : 'Nein'}</td>
                  <td className={flags ? 'error-flags' : undefined}>{flags || '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </details>
  )
}
