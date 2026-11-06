# Connecting RailConnect to Supabase using VS Code

This step-by-step guide explains how to connect the RailConnect backend to a hosted **Supabase (PostgreSQL)** database using Visual Studio Code.

---

## 1. How the Backend Connects

The backend (`server/db.ts`) is pre-configured with **dual-engine support**:
- **With `DATABASE_URL` set**: Connects directly to **Supabase PostgreSQL** via connection pooling (`pg.Pool`).
- **Without `DATABASE_URL`**: Gracefully falls back to the local SQLite relational database.

---

## 2. Step-by-Step Setup Instructions

### Step 1: Create a Project on Supabase
1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Click **"New Project"**.
3. Choose an organization, enter a project name (e.g. `railconnect-db`), and set a strong database password (save this password).
4. Select your preferred region (e.g. `South Asia (Mumbai)` or closest region).
5. Click **"Create new project"** and wait ~1 minute for provisioning.

---

### Step 2: Copy the PostgreSQL Connection String
1. In your Supabase Project Dashboard, go to **Project Settings** (gear icon in the sidebar) → **Database**.
2. Scroll down to the **"Connection string"** section.
3. Select the **"URI"** tab.
4. Choose **"Transaction Pooler"** (Port `6543` - recommended for serverless/Node.js) or **"Direct"** (Port `5432`):
   ```text
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with the actual database password you chose in Step 1.

---

### Step 3: Configure `.env` in VS Code
1. Open the project folder in VS Code.
2. In the root directory, create or edit the `.env` file:
   ```env
   # Supabase PostgreSQL Connection String
   DATABASE_URL="postgresql://postgres.abcdefghijklmno:YourPasswordHere@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"
   ```

---

### Step 4: Run the Database Migration Script

You need to create the 10 relational tables, views, indexes, and initial stations/trains on Supabase. Choose **Option A** or **Option B**:

#### Option A: Via Supabase SQL Editor (Fastest & Simplest)
1. In your Supabase Dashboard, click **"SQL Editor"** in the left sidebar.
2. Click **"New Query"**.
3. Open the file `database/supabase_schema.sql` from this repository in VS Code, copy all contents (`Ctrl + A`, `Ctrl + C`).
4. Paste the SQL code into the Supabase SQL Editor.
5. Click **"Run"** (`Ctrl + Enter`).
6. All 10 tables (`User`, `Station`, `Train`, `Train_Stop`, `Booking`, `Passenger`, `Booking_Passenger`, `Payment`, `Seat_Inventory`, `Fare`) and views (`Booking_Details`, `Train_Route_Details`, `Passenger_Booking_Details`) will be created and seeded.

#### Option B: Via VS Code Terminal (psql)
If you have `psql` (PostgreSQL client) installed on your machine, open the integrated terminal in VS Code (`Ctrl + ~`) and run:
```bash
psql "postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres" -f database/supabase_schema.sql
```

---

### Step 5: Start the Full-Stack Application in VS Code

In your VS Code integrated terminal:
```bash
# 1. Install dependencies (if not already installed)
npm install

# 2. Start the dev server
npm run dev
```

You will see:
```text
Connecting to Supabase PostgreSQL database...
Successfully connected to Supabase PostgreSQL! Server time: 2026-11-05T...
RailConnect backend server running at http://0.0.0.0:3000
```

Open `http://localhost:3000` in your browser. All train searches, bookings, passenger records, and admin changes will now persist directly into your cloud **Supabase PostgreSQL** database!

---

## 3. Recommended VS Code Extensions for Supabase

To view, query, and manage your Supabase database directly inside VS Code:

1. **Database Client (by cweijan)**:
   - Install from VS Code Marketplace.
   - Click the Database icon in VS Code activity bar → `+` → Select **PostgreSQL**.
   - Paste your Supabase host, port (`6543` or `5432`), user (`postgres`), password, and database (`postgres`).
   - View tables, edit records inline, and run queries without leaving VS Code.

2. **SQLTools + SQLTools PostgreSQL/Cockroach Driver**:
   - Popular open-source SQL explorer inside VS Code.

---

## 4. Verification & Testing

Once connected:
1. Book a ticket in RailConnect (`http://localhost:3000`).
2. Go to your Supabase Dashboard → **Table Editor** → click on the `Booking` or `Seat_Inventory` table.
3. You will immediately see the newly inserted reservation record, PNR, and passenger allocation in Supabase!
