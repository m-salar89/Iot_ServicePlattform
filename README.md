# IoT Service Plattform

Einfache React/Vite-WebApp, bereit für das Hosting in **AWS Amplify**.
Das Backend (Lambda, S3, DynamoDB, Auth) kommt in einem späteren Schritt.

## Lokal starten

Voraussetzung: Node.js 20 oder neuer.

```bash
npm install
npm run dev
```

Die App läuft danach unter `http://localhost:5173`.

## Auf AWS Amplify deployen

1. Dieses Repository nach GitHub pushen (Remote ist bereits hinterlegt).
2. In der [Amplify Console](https://console.aws.amazon.com/amplify) eine neue App anlegen.
3. GitHub als Quelle wählen und das Repository `Iot_ServicePlattform` mit Branch `main` verbinden.
4. Amplify erkennt `amplify.yml` automatisch:
   - Build: `npm ci` und `npm run build`
   - Ausgabeordner: `dist`
5. **Save and deploy** wählen und die öffentliche URL öffnen.

Für diese erste Version wird nur das Frontend gebaut. Es werden noch keine Backend-Services angelegt.

## Nächste Schritte

Wenn das Frontend steht, kann Amplify Gen 2 ergänzt werden:

```bash
npm create amplify@latest
```

Danach lassen sich schrittweise verbinden:

- **Auth** (Cognito) für Login
- **DynamoDB / Amplify Data** für Geräte- und Messdaten
- **S3 / Storage** für Dateien
- **Lambda** für eigene APIs und IoT-Verarbeitung

## Projektstruktur

```
amplify.yml      Amplify-Hosting-Build
src/App.tsx      Startseite
src/main.tsx     Einstieg
```
