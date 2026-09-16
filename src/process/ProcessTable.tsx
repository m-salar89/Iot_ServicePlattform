import type { ProcessView } from './processView'
import { SENSOR_KEYS, formatErrorFlags, formatSensorValue } from './processView'
import './ProcessTable.css'

type Props = {
  view: ProcessView
}

export default function ProcessTable({ view }: Props) {
  return (
    <details className="process-table" open>
      <summary>Prozessdaten anzeigen</summary>
      <div className="process-table-wrap">
        <table>
          <thead>
            <tr>
              <th>ts</th>
              {SENSOR_KEYS.map((key) => (
                <th key={key}>{key}</th>
              ))}
              <th>errorFlags</th>
            </tr>
          </thead>
          <tbody>
            {view.points.map((point, index) => {
              const flags = formatErrorFlags(point)
              return (
                <tr key={`${point.t}-${index}`} className={point.error ? 'has-error' : undefined}>
                  <td>{point.t}</td>
                  {SENSOR_KEYS.map((key) => (
                    <td key={key}>{formatSensorValue(point.sensors[key])}</td>
                  ))}
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
