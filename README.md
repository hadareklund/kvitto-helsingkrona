# Projektplan: Digitalisering av Helsingkronas kvittohantering

**Mål:** Flytta kvittohanteringen till en digital plattform för att minska pappersanvändning, effektivisera processen för workers/förmän och möjliggöra inskick utanför kontorstid.

**Tech Stack:**
* **Server:** Linode
* **Reverse Proxy:** Nginx
* **Database & Backend:** PocketBase
* **Frontend:** React (Vite)
* **Styling:** Tailwind CSS + daisyUI

---

## Fas 1: Infrastruktur och domän
- [ ] Logga in hos domänregistraren och lägg till en `A Record` som pekar `kvitto.helsingkrona.se` till Linode-serverns IP-adress.
- [ ] Konfigurera Nginx som reverse proxy för att routa trafik till React-frontend (och PocketBase-backend - redan gjort?).
- [ ] Säkra domänen med ett SSL-certifikat via Certbot (Let's Encrypt) (eller cloudflare om det är olika).

## Fas 2: Databas-setup (PocketBase)
- [ ] **Konfigurera `receipt_user` collection:**
  - [ ] Lägg till `bank_name` (Text).
  - [ ] Lägg till `account_number` (Text).
  - [ ] Lägg till `role` (Select: user, admin).
- [ ] **Skapa `receipts` collection:**
  - [ ] Lägg till `user_id` (Relation -> `receipt_user`).
  - [ ] Lägg till `amount` (Number).
  - [ ] Lägg till `slabb` (Text/Select - t.ex. Pub, Sittning).
  - [ ] Lägg till `anledning` (Text).
  - [ ] Lägg till `date_for_slabb` (Date/Time).
  - [ ] Lägg till `receipt_image` (File - begränsa till bilder/PDF:er, sätt maxstorlek).
  - [ ] Lägg till `status` (Select: Pending, Approved, Paid).
  - [ ] Lägg till `receipt_number` för att förhindra duplicering.
- [ ] Sätt upp PocketBase API Rules (t.ex. att users bara kan se sina egna receipts, medan admins kan se alla).

## Fas 3: Frontend-utveckling (React + Tailwind + daisyUI)
- [ ] Initiera React-projektet och installera Tailwind CSS.
- [ ] Sätt upp PocketBase JavaScript SDK för hantering av autentisering.
- [ ] **Bygg views/pages:**
  - [ ] Login & Registration-sida.
  - [ ] Huvuddashboard (för workers att se tidigare inskick och status, klickbar till kvitto-detaljer).
  - [ ] "Submit Receipt"-formulär (hanterar textfält och uppladdning av kvittobild).
  - [ ] Admin Dashboard (för Erik/dig att se user-profiler, bankuppgifter och kvittohistorik).
  - [ ] Kvitto-detaljsida (`/receipt/:receiptId`) med kvitto-bild.
  - [ ] Admin användarprofil (`/admin/users/:userId`) med kopierbara bankuppgifter.

## Fas 4: Integrationer och notiser
- [ ] Sätt upp en email notification trigger (via en PocketBase-hook eller en React API route med en tjänst som Resend).
- [ ] Säkerställ att email skickar notis till admin när ett nytt kvitto skickas in.

## Fas 5: Testning och lansering
- [ ] Testa mobilupplevelsen (avgörande för workers som fotar kvitton i farten).
- [ ] Testa admin-flödet för godkännande.
- [ ] Gör en soft launch till några förmän för att samla feedback.
- [ ] Full launch till nationen!

# Frontend-arkitektur: React + Vite

Detta repository innehåller frontend-kod och deployment-konfiguration för Helsingkrona Kvitto-systemet. PocketBase-backend kör fristående på Linode-servern i `/root/pb/pocketbase`.

## Mappstruktur

```text
kvitto-helsingkrona-frontend/
├── nginx/                    <-- INFRASTRUKTUR
│   └── kvitto.conf           <-- Behåll Nginx-konfigurationen här för versionshantering
│
├── public/                   <-- Statiska assets (favicon, nationslogo)
│
├── src/                      <-- FRONTEND (React + Vite)
│   ├── assets/               <-- Global CSS och lokala bilder
│   │   └── index.css         <-- Där du importerar Tailwind CSS
│   │
│   ├── components/           <-- Återanvändbara UI-delar
│   │   ├── ui/               <-- Grundläggande Tailwind-komponenter (Buttons, Inputs, Cards)
│   │   └── layout/           <-- Navbar, Sidebar, wrappers för sidor
│   │
│   ├── hooks/                <-- Egna React-hooks
│   │   └── useAuth.ts        <-- Hook för att lyssna på PocketBase login-state
│   │
│   ├── lib/                  <-- Utilities och setup
│   │   ├── pocketbase.ts     <-- Initialiserar PocketBase-anslutningen
│   │   └── utils.ts          <-- Hjälpfunktioner (t.ex. formatering av datum eller valuta)
│   │
│   ├── pages/                <-- Sidkomponenter (mappas direkt till URL:er via React Router)
│   │   ├── Home.tsx          <-- Redirect: / -> /login eller /dashboard beroende på auth
│   │   ├── Login.tsx         <-- Login & Registration
│   │   ├── Dashboard.tsx     <-- Worker-vy: tidigare kvitton
│   │   ├── SubmitReceipt.tsx <-- "Slabb"-formulär för kvitto
│   │   ├── Admin.tsx         <-- Admin-vy: alla kvitton och user-profiler
│   │   ├── ReceiptDetail.tsx <-- Detaljvy för enskilt kvitto + bild
│   │   └── AdminUserProfile.tsx <-- Profilvy för en enskild användare
│   │
│   ├── App.tsx               <-- Huvudkomponent (där du sätter upp React Router)
│   └── main.tsx              <-- React DOM-entrypoint
│
├── .env                      <-- Miljovariabler (t.ex. VITE_PB_URL=[https://kvitto.helsingkrona.se](https://kvitto.helsingkrona.se))
├── index.html                <-- Vites HTML-entrypoint
├── package.json              <-- React/Node-dependencies
├── tailwind.config.js        <-- Tailwind CSS-konfiguration
└── vite.config.ts            <-- Vite builder-konfiguration
```

## Viktiga arkitekturnoter

1. **Fristående backend:** Eftersom PocketBase kör direkt från `/root/pb/pocketbase` på Linode-servern trackas den inte i detta frontend-repository. React-appen ansluter via miljövariabeln `VITE_PB_URL`.
2. **Routing:** Vi använder `react-router-dom` i `App.tsx` för att hantera client-side routing.
  - `/` redirectar till `/login` eller `/dashboard` beroende på inloggning.
  - `/receipt/:receiptId` visar kvitto-detaljer och kvitto-bild.
  - `/admin/users/:userId` visar adminprofil med användaruppgifter och kvittohistorik.
3. **Komponentorganisation:** Katalogen `pages/` separerar fulla sidvyer (som Dashboard) från mindre byggblock (som en Button i `components/ui/`).

## Deployment-flöde

1. **Build:** `npm run build` kompilerar mappen `src/` till statiska HTML-, CSS- och JS-filer i mappen `dist/`.
2. **Serve:** Nginx serverar dessa statiska filer när en användare besöker `kvitto.helsingkrona.se`.
3. **Proxy:** Nginx är konfigurerad att vidarebefordra databas-/API-requests direkt till den lokala PocketBase-instansen på servern.