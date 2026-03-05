# Loss Control Portal (Supabase + Vercel + Google Drive)

This repo implements a deployable web app for:

- **Surveyor intake form** (creates a “job” when the *first* file is uploaded)
- **Uploads stored in Google Drive** (Supabase stores only metadata + links)
- **Admin report editor** using **Markdown blocks** (paste Markdown tables exactly as-is)
- **Client vessel view** with **no client logins** (access via a per-vessel shared key)

---

## Quick start (local)

### 1) Install
```bash
npm install
```

### 2) Configure env
Copy `.env.example` → `.env.local` and fill values.

### 3) Run
```bash
npm run dev
```

App: `http://localhost:3000`

---

## Supabase setup (VERY detailed)

### 1) Create a Supabase project
1. Go to Supabase and create a new project.
2. Wait for it to finish provisioning.

### 2) Run the SQL schema
1. In Supabase: **Project → SQL Editor**
2. Click **New query**
3. Open `supabase/schema.sql` from this repo and copy/paste the whole file into the SQL editor.
4. Click **Run**.

This creates:
- `profiles` (user roles)
- `jobs` (surveyor submissions / job metadata)
- `job_files` (Drive references, sequential filename tracking)
- `report_blocks` (admin-only Markdown content)
- `report_table_parses` (admin-only parsed JSON cache for tables)
- `vessel_access_keys` (per-vessel shared key for client view)
- RLS policies

### 2.1) If you already had users BEFORE running the schema (backfill profiles)
If you created Supabase Auth users before running `supabase/schema.sql`, those users won’t automatically
have rows in `public.profiles` (because the trigger didn’t exist yet).

Run this once:

```sql
insert into public.profiles (id, email)
select id, email
from auth.users
on conflict (id) do nothing;
```

Then promote your admin user (next step).


### 3) Get your Supabase API keys
In Supabase: **Project Settings → API**

Copy:
- `URL` → set `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → set `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → set `SUPABASE_SERVICE_ROLE_KEY` (**server-only; never expose in the browser**)

### 4) Create users (Surveyors + Admin)
In Supabase: **Authentication → Users → Add user**

Create:
- at least **1 admin user**
- any number of **surveyor users**

Use email + password.

### 5) Promote a user to admin (SQL)
After your admin user exists, you must set their role.

In **SQL Editor**, run:

```sql
-- Replace with the admin's email
update public.profiles
set role = 'admin'
where email = 'admin@yourcompany.com';
```

(You can also do it by user id if you prefer.)

### 6) Confirm RLS behavior
- Surveyors can **create jobs** and **update jobs created within the last 7 days**
- Admins can **edit reports** and **manage vessel access keys**
- Clients do **not** log in, so client pages read data server-side using `SUPABASE_SERVICE_ROLE_KEY`

---

## Google Drive setup (VERY detailed)

Uploads go to this folder by ID:
`14iBNOke8F3YOg4oSzYV6dgJ0cW5BKHqo`

### 1) Create a Google Cloud project
1. Go to Google Cloud Console
2. Create a new project (or use an existing one)

### 2) Enable the Drive API
1. **APIs & Services → Library**
2. Search **Google Drive API**
3. Click **Enable**

### 3) Create a Service Account
1. **APIs & Services → Credentials**
2. Click **Create Credentials → Service account**
3. Name it e.g. `loss-control-portal-uploader`

### 4) Create a JSON key for the service account
1. Click the service account you created
2. Go to **Keys**
3. **Add Key → Create new key → JSON**
4. Download the JSON key file (keep it private)

### 5) Share the Drive folder with the service account
1. Open the Drive folder in your browser
2. Click **Share**
3. Add the service account email (from the JSON, `client_email`) as an **Editor**
4. Save

### 6) Convert the JSON key file to base64
From the repo root:

```bash
node scripts/base64-service-account.mjs path/to/service-account.json
```

Copy the printed base64 string into:
- `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64`

### 7) Set the Drive folder ID
The folder ID is already in `.env.example`:

- `GOOGLE_DRIVE_FOLDER_ID=14iBNOke8F3YOg4oSzYV6dgJ0cW5BKHqo`

---

## Vercel deployment (VERY detailed)

### 1) Push this repo to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

### 2) Import into Vercel
1. Go to Vercel
2. **Add New → Project**
3. Select your GitHub repo
4. Framework should auto-detect **Next.js**
5. Click **Environment Variables** and add:

**Public (safe):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Server-only (critical):**
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64`
- `GOOGLE_DRIVE_FOLDER_ID`
- `APP_BASE_URL` (set to your Vercel URL or custom domain)

6. Click **Deploy**

---

## How the app works (flow)

### Surveyor flow
1. Surveyor logs in: `/auth/login`
2. Creates a job: `/surveyor/new`
   - The job is created only when **Initial Opening Figures** is uploaded.
3. Job code format:
   - `YYYYMMDD-ABC`
   - Example: `20250806-MTC`
4. Files saved to Drive:
   - `20250806-MTC-1.jpg`
   - `20250806-MTC-2.pdf`
   - etc.
5. Surveyor can later update the same job:
   - `/surveyor/recent` → select a job → upload BOL/BDN/other docs

### Admin flow
1. Admin goes to a job report editor:
   - `/admin/jobs/<JOB_CODE>/report`
2. Click **Generate Standard Template** once
3. Paste Markdown tables under the correct headings
4. The app also stores a parsed JSON version of each table in `report_table_parses` to support future analytics.

### Client flow (no login)
1. Admin generates a vessel access key in:
   - `/admin/vessels`
2. Give client a link like:
   - `/v/MTC?k=<LONG_SHARED_KEY>`
3. Client sees vessel history and can open each report.
4. Reports are readable at:
   - `/r/<JOB_CODE>?k=<LONG_SHARED_KEY>`

---

## Notes / practical considerations

### Upload size limits
Vercel serverless functions have request body size limits. If you expect very large PDFs/images, you may need:
- smaller images (compressed)
- or a different upload approach (chunked/resumable uploads)

For typical “survey photo + PDF” sizes, this setup is usually fine.

### Storage usage
Supabase stores only:
- job metadata
- report Markdown blocks
- Drive file IDs/links

Uploads are stored in Google Drive only.

---

## License
Private/internal use by default.
