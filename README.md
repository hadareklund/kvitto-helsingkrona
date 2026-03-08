# Project Plan: Helsingkrona Kvitto Digitalization

**Goal:** Move receipt handling to a digital platform to reduce paper, streamline the process for workers/förmän, and allow submissions outside of office hours.

**Tech Stack:**
* **Server:** Linode
* **Reverse Proxy:** Nginx
* **Database & Backend:** PocketBase
* **Frontend:** React (Next.js or Vite)
* **Styling:** Tailwind CSS

---

## Phase 1: Infrastructure & Domain 🌐
- [ ] Log into the domain registrar and add an `A Record` pointing `kvitto.helsingkrona.se` to the Linode server's IP address.
- [ ] Install Nginx on the Linode server.
- [ ] Configure Nginx as a reverse proxy to route traffic to the React frontend and the PocketBase backend.
- [ ] Secure the domain with an SSL certificate using Certbot (Let's Encrypt).

## Phase 2: Database Setup (PocketBase) 🗄️
- [ ] Install and start PocketBase on the Linode server.
- [ ] **Configure `users` collection:**
  - [ ] Add `bank_name` (Text).
  - [ ] Add `account_number` (Text).
  - [ ] Add `role` (Select: user, admin).
- [ ] **Create `receipts` collection:**
  - [ ] Add `user_id` (Relation -> `users`).
  - [ ] Add `amount` (Number).
  - [ ] Add `slabb` (Text/Select - e.g., Pub, Sittning).
  - [ ] Add `anledning` (Text).
  - [ ] Add `date_for_slabb` (Date/Time).
  - [ ] Add `receipt_image` (File - restrict to images/PDFs, set max size).
  - [ ] Add `status` (Select: Pending, Approved, Paid).
- [ ] Set up PocketBase API Rules (e.g., users can only view their own receipts; admins can view all).

## Phase 3: Frontend Development (React + Tailwind) 💻
- [ ] Initialize the React project and install Tailwind CSS.
- [ ] Set up the PocketBase JavaScript SDK to handle authentication.
- [ ] **Build Views/Pages:**
  - [ ] Login & Registration page.
  - [ ] Main Dashboard (for workers to see their past submissions and statuses).
  - [ ] "Submit Receipt" Form (handles text inputs and the image file upload).
  - [ ] Admin Dashboard (for Erik/you to view user profiles, bank details, and receipt history).

## Phase 4: Integrations & Notifications 📧
- [ ] Set up an email notification trigger. (Using a PocketBase hook or a React API route with a service like Resend).
- [ ] Ensure the email alerts the admin when a new receipt is submitted.

## Phase 5: Testing & Launch 🚀
- [ ] Test the mobile experience (crucial for workers taking photos of receipts on the fly).
- [ ] Test the admin approval workflow.
- [ ] Soft launch to a few förmän to gather feedback.
- [ ] Full launch to the nation!