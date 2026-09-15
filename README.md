# IoT Service Plattform

Einfache React/Vite-WebApp, bereit für das Hosting in **AWS Amplify**.
Registrierung und Login laufen über **Amazon Cognito**. Neue Konten bleiben unbestätigt, bis ein Admin sie freigibt.

## Lokal starten

Voraussetzung: Node.js 20 oder neuer.

```bash
npm install
npm run dev
```

Die App läuft danach unter `http://localhost:5173`.


## Cognito anbinden

1. `.env.example` nach `.env` kopieren.
2. Werte aus der Cognito-Konsole eintragen:
   - `VITE_STAFF_USER_POOL_ID` (Mitarbeiter-Pool, nicht der Kunden-Pool)
   - `VITE_STAFF_COGNITO_CLIENT_ID`

   Der Kunden-Pool (`CUSTOMER_USER_POOL_ID`) wird vom Frontend nicht gebraucht,
   er gehoert in die Konfiguration der Lambda `zl_sp_get_processes`.
3. App-Client: Public Client, **kein** Secret, Auth-Flow `ALLOW_USER_SRP_AUTH`.
4. `npm run dev`

Registrierung legt ein unbestätigtes Konto an. Login funktioniert erst nach der Admin-Freigabe (Link in der Admin-Mail).

Für Amplify Hosting dieselben Variablen unter **Environment variables** setzen (Build-Zeit, Prefix `VITE_`).

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

- **DynamoDB / Amplify Data** für Geräte- und Messdaten
- **S3 / Storage** für Dateien
- **Lambda** für eigene APIs und IoT-Verarbeitung

## Projektstruktur

```
amplify.yml      Amplify-Hosting-Build
src/App.tsx      Startseite
src/main.tsx     Einstieg
```
