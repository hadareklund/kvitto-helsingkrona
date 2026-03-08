# Projektplan: Digitalisering av Helsingkronas kvittohantering

**Mål:** Flytta kvittohanteringen till en digital plattform för att minska pappersanvändning, effektivisera processen för workers/förmän och möjliggöra inskick utanför kontorstid.

**Tech Stack:**
* **Server:** Linode
* **Reverse Proxy:** Nginx
* **Database & Backend:** PocketBase
* **Frontend:** React (Vite)
* **Styling:** Tailwind CSS

---

## Fas 1: Infrastruktur och domän
- [ ] Logga in hos domänregistraren och lägg till en `A Record` som pekar `kvitto.helsingkrona.se` till Linode-serverns IP-adress.
- [ ] Konfigurera Nginx som reverse proxy för att routa trafik till React-frontend (och PocketBase-backend - redan gjort?).
- [ ] Säkra domänen med ett SSL-certifikat via Certbot (Let's Encrypt) (eller cloudflare om det är olika).

## Fas 2: Databas-setup (PocketBase)
- [ ] **Konfigurera `receipt_users` collection:**
  - [ ] Lägg till `bank_name` (Text).
  - [ ] Lägg till `account_number` (Text).
  - [ ] Lägg till `role` (Select: user, admin).
- [ ] **Skapa `receipts` collection:**
  - [ ] Lägg till `user_id` (Relation -> `users`).
  - [ ] Lägg till `amount` (Number).
  - [ ] Lägg till `slabb` (Text/Select - t.ex. Pub, Sittning).
  - [ ] Lägg till `anledning` (Text).
  - [ ] Lägg till `date_for_slabb` (Date/Time).
  - [ ] Lägg till `receipt_image` (File - begränsa till bilder/PDF:er, sätt maxstorlek).
  - [ ] Lägg till `status` (Select: Pending, Approved, Paid).
  - [ ] Lägg till `receipt_number` för att förhindra duplicering.
- [ ] Sätt upp PocketBase API Rules (t.ex. att users bara kan se sina egna receipts, medan admins kan se alla).

## Fas 3: Frontend-utveckling (React + Tailwind)
- [ ] Initiera React-projektet och installera Tailwind CSS.
- [ ] Sätt upp PocketBase JavaScript SDK för hantering av autentisering.
- [ ] **Bygg views/pages:**
  - [ ] Login & Registration-sida.
  - [ ] Huvuddashboard (för workers att se tidigare inskick och status).
  - [ ] "Submit Receipt"-formulär (hanterar textfält och uppladdning av kvittobild).
  - [ ] Admin Dashboard (för Erik/dig att se user-profiler, bankuppgifter och kvittohistorik).

## Fas 4: Integrationer och notiser
- [ ] Sätt upp en email notification trigger (via en PocketBase-hook eller en React API route med en tjänst som Resend).
- [ ] Säkerställ att email skickar notis till admin när ett nytt kvitto skickas in.

## Fas 5: Testning och lansering
- [ ] Testa mobilupplevelsen (avgörande för workers som fotar kvitton i farten).
- [ ] Testa admin-flödet för godkännande.
- [ ] Gör en soft launch till några förmän för att samla feedback.
- [ ] Full launch till nationen!