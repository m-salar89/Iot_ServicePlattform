import * as XLSX from 'xlsx'
import type { ProcessEntry } from '../api/processes'
import { formatProcessDateTime } from '../filter/formatProcessDateTime'
import { SENSOR_KEYS, formatErrorFlags, formatTimestamp, type ProcessView } from './processView'

function sheetName(name: string): string {
  return name.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31)
}

function fileName(process: ProcessEntry, view: ProcessView): string {
  const serial = (view.deviceSerial || 'Geraet').replace(/[^\w.-]+/g, '_')
  const id = process.id.replace(/[^\w.-]+/g, '_')
  return `${serial}_${id}.xlsx`
}

export function downloadProcessExcel(process: ProcessEntry, view: ProcessView): void {
  const info: (string | number)[][] = [
    ['Feld', 'Wert'],
    ['Prozess-ID', process.id],
    ['Zeitpunkt', formatProcessDateTime(process) ?? ''],
    ['Seriennummer', view.deviceSerial ?? ''],
    ['Gerätetyp', view.deviceKind ?? ''],
    ['Programm', view.programName ?? ''],
    ['E-Mail', process.email ?? ''],
    ['User-ID', process.userId ?? ''],
    ['Messpunkte', view.points.length],
  ]

  const measurements: (string | number | null)[][] = [
    ['Zeit', 'Sekunden seit Start', ...SENSOR_KEYS, 'Error', 'errorFlags'],
    ...view.points.map((point) => [
      formatTimestamp(point.t),
      Math.round(point.elapsed),
      ...SENSOR_KEYS.map((key) => point.sensors[key]),
      point.error ? 'Ja' : 'Nein',
      formatErrorFlags(point),
    ]),
  ]

  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(info), sheetName('Stammdaten'))
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(measurements), sheetName('Messwerte'))

  if (view.program && view.program.params.length > 0) {
    const program: string[][] = [
      ['Parameter', 'Wert'],
      ...view.program.params.map((param) => [param.label, param.display]),
    ]
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(program), sheetName('Programm'))
  }

  XLSX.writeFile(book, fileName(process, view))
}
