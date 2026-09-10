import './App.css'

const upcoming = [
  {
    service: 'AWS Lambda',
    title: 'Backend-Funktionen',
    text: 'Später kommen API-Aufrufe und Geschäftslogik als serverless Functions dazu.',
  },
  {
    service: 'Amazon S3',
    title: 'Dateien und Assets',
    text: 'Gerätedaten, Bilder und Exporte lassen sich danach direkt im Object Storage ablegen.',
  },
  {
    service: 'Amazon DynamoDB',
    title: 'Geräte- und Messdaten',
    text: 'Persistente Tabellen für Geräte, Benutzer und Telemetrie folgen im nächsten Schritt.',
  },
]

export default function App() {
  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <svg className="mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="#0b1c24" />
            <path d="M8 20.5c2.4-2.2 5.2-3.3 8-3.3s5.6 1.1 8 3.3" stroke="#2ec4b6" strokeWidth="2" strokeLinecap="round" />
            <path d="M11 16.2c1.6-1.5 3.3-2.2 5-2.2s3.4.7 5 2.2" stroke="#2ec4b6" strokeWidth="2" strokeLinecap="round" />
            <circle cx="16" cy="11.2" r="1.8" fill="#e8a317" />
          </svg>
          <div>
            <h1>IoT Service Plattform</h1>
            <p>Erste Version auf AWS Amplify Hosting</p>
          </div>
        </div>
        <div className="pill">
          <span className="dot" />
          System online
        </div>
      </header>

      <main>
        <section className="hero">
          <p className="kicker">WebApp · Amplify Hosting</p>
          <h2>Einfach starten. Später in AWS wachsen.</h2>
          <p className="hero-lead">
            Diese Seite ist die erste, bewusst schlanke Version der Plattform.
            Sie lässt sich direkt mit AWS Amplify aus dem Git-Repository deployen.
            Lambda, S3 und DynamoDB kommen als Nächstes dazu.
          </p>
        </section>

        <section className="grid" aria-label="Geplante AWS-Services">
          {upcoming.map((item) => (
            <article className="card" key={item.service}>
              <span>{item.service}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </section>
      </main>

      <footer className="footer">IoT Service Plattform · Frontend-first, bereit für Amplify</footer>
    </div>
  )
}
