# Admin Dashboard Backend + Frontend Guide

## 1. Setup the "Robot" (Service Account)
1. Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Click **+ CREATE CREDENTIALS** > **Service account**.
3. Name it `analytics-admin`. Click **Create and Continue**.
4. In "Grant this service account access to project", select **Owner** or **Editor** (simplest for now). Click **Done**.
5. Find `analytics-admin` in the list. Click the **Pencil icon** (Edit) or the Email address.
6. Go to the **KEYS** tab.
7. Click **ADD KEY** > **Create new key** > **JSON**.
8. A file will download. **Rename it** to `service-account.json`.
9. **Move this file** into the root folder of this project (`mayanov-tarot/`).
   * *Note: Do not share this file or commit it to GitHub if public.*

## 2. Grant Access to Analytics
1. Open the `service-account.json` file and copy the `client_email` (e.g., `analytics-admin@project-id.iam.gserviceaccount.com`).
2. Go to [Google Analytics Admin](https://analytics.google.com/).
3. Select your Property (`386315459`).
4. Click **Property Access Management**.
5. Click **+** (Plus) > **Add users**.
6. Paste the email address.
7. Assign the role **Viewer**.
8. Click **Add**.

## 3. Configure the Project
Create a `.env` file in the root folder with:
```env
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
GA4_PROPERTY_ID=386315459
PORT=3001
```

## 4. Run the App
We will run both the Frontend (Port 3000) and Backend (Port 3001).
1. Open a terminal.
2. Run: `node server/index.js` (The server)
3. Open another terminal.
4. Run: `npm run dev` (The website)

Your admin panel will now fetch data silently from the server!
