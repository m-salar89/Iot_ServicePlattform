import { type FormEvent, useState } from 'react'
import './DataFilter.css'

export type DataFilterValues = {
  email: string
  serialNumber: string
}

type Props = {
  onApply: (values: DataFilterValues) => void
}

export default function DataFilter({ onApply }: Props) {
  const [email, setEmail] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const next = {
      email: email.trim(),
      serialNumber: serialNumber.trim(),
    }

    if (!next.email && !next.serialNumber) {
      setError('Bitte eine E-Mail-Adresse oder eine Geräte-Seriennummer eingeben.')
      return
    }

    setError('')
    onApply(next)
  }

  return (
    <section className="filter-panel">
      <h2>Daten suchen</h2>
      <p className="filter-lead">
        Gib eine E-Mail-Adresse oder eine Geräte-Seriennummer ein. Eines der beiden
        Felder reicht.
      </p>

      <form className="filter-form" onSubmit={handleSubmit}>
        <label>
          E-Mail-Adresse
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="name@firma.de"
          />
        </label>

        <label>
          Geräte-Seriennummer
          <input
            value={serialNumber}
            onChange={(event) => setSerialNumber(event.target.value)}
            autoComplete="off"
            placeholder="z. B. ZB-123456"
          />
        </label>

        {error && <p className="filter-error">{error}</p>}

        <button type="submit" className="btn primary">
          Anwenden
        </button>
      </form>
    </section>
  )
}
