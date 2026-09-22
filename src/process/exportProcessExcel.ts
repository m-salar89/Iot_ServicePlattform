import * as XLSX from 'xlsx'
import type { ProcessEntry } from '../api/processes'
import { SENSOR_KEYS, formatErrorFlags, formatTimestamp, type ProcessView } from './processView'

function fileName(process: ProcessEntry, view: ProcessView): string {
  const serial = (view.deviceSerial || 'Geraet').replace(/[^\w.-]+/g, '_')
  const id = process.id.replace(/[^\w.-]+/g, '_')
  return `${serial}_${id}.xlsx`
}

function sensorCell(value: number | null): number | string {
  if (value === null) return '-'
  return value
}

export function downloadProcessExcel(process: ProcessEntry, view: ProcessView): void {
  const rows: (string | number)[][] = [
    ['Zeit', ...SENSOR_KEYS, 'Error', 'errorFlags'],
    ...view.points.map((point) => {
      const flags = formatErrorFlags(point)
      return [
        formatTimestamp(point.t),
        ...SENSOR_KEYS.map((key) => sensorCell(point.sensors[key])),
        point.error ? 'Ja' : 'Nein',
        flags || '-',
      ]
    }),
  ]

  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), 'Sensordaten')
  XLSX.writeFile(book, fileName(process, view))
}
