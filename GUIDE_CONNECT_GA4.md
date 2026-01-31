# How to Connect Your Real Analytics Data

Since you already have Google Analytics tracking your website, you just need to create a "Secure Key" that allows this Dashboard to read that data.

Follow these 3 simple steps:

### Step 1: Get your Property ID (The Data Source)
1. Go to [analytics.google.com](https://analytics.google.com/).
2. Click the **Admin** (Gear icon ⚙️) in the bottom left.
3. In the "Property" column, click **Property Settings**.
4. You will see a **Property ID** (a number like `324567890`).
5. **Copy this number**. This is your `Property ID`.

---

### Step 2: Get your Client ID (The Key)
You need to tell Google, *"Trust this dashboard to view my data."*

1. Go to the [Google Cloud Console Setup Wizard](https://console.cloud.google.com/projectselector2/apis/credentials/wizard).
2. **Create a Project**:
   - Click "Create Project".
   - Name it `Mayanov Dashboard`.
   - Click "Create".
3. **Configure the API**:
   - In the "Find an API" box, select **Google Analytics Data API**. (If asked, click "Enable").
   - Under "Which API are you using?", select **Google Analytics Data API**.
   - Under "Platform", select **Web Browser (JavaScript)**.
   - Click "User Data" (since access is restricted to you).
   - Click **Next**.
4. **App Info**:
   - App Name: `Mayanov Dashboard`.
   - User Support Email: Select your email.
   - Developer Contact: Select your email.
   - Click **Save and Continue**.
5. **Authorized Domains (Important)**:
   - Under **Authorized JavaScript origins**, click "ADD URI".
   - Type: `http://localhost:3000`
   - *(Optional: If you published your site, add that too, e.g., `https://mayanov-tarot.com`)*.
   - Click **Create**.
6. **Copy Your Key**:
   - You will see a long string ending in `...apps.googleusercontent.com`.
   - **Copy this string**. This is your `Client ID`.
   - You can skip "Download credentials" and just click "Done".

---

### Step 3: Connect!
1. Open your dashboard: `http://localhost:3000/?dashboard=true`
2. In the "**Connect Real Data**" box:
   - Paste your **Client ID** (from Step 2).
   - Paste your **Property ID** (from Step 1).
3. Click **Connect**.
4. A Google popup will appear. Select your account and allow access.

**Success!** Your real traffic data should now appear on the charts.
