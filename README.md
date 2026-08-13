# CONAN – Lung Cancer Risk Screening App

CONAN is an AI-assisted lung cancer risk screening tool for awareness and early detection guidance. It uses symptom-based assessment and chest X-ray imaging analysis to estimate lung cancer risk.

---

## Table of Contents

1. [Requirements](#1-requirements)
2. [Step 1 – Install Node.js](#2-step-1--install-nodejs)
3. [Step 2 – Install Git](#3-step-2--install-git)
4. [Step 3 – Download the Project](#4-step-3--download-the-project)
5. [Step 4 – Open the Project Folder](#5-step-4--open-the-project-folder)
6. [Step 5 – Install Dependencies](#6-step-5--install-dependencies)
7. [Step 6 – Run the App](#7-step-6--run-the-app)
8. [Step 7 – Open in Browser](#8-step-7--open-in-browser)
9. [Stopping the App](#9-stopping-the-app)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Requirements

Before you begin, make sure your computer has the following. Don't worry — the steps below will guide you through installing each one.

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | v18 or higher | Runs the app |
| npm | Comes with Node.js | Installs packages |
| Git | Any recent version | Downloads the project |
| A modern browser | Chrome, Edge, Firefox | Views the app |

---

## 2. Step 1 – Install Node.js

Node.js is required to run this project.

1. Go to **https://nodejs.org**
2. Click the **"LTS"** (Long-Term Support) download button — this is the recommended version
3. Open the downloaded file and follow the installer steps (just click Next → Next → Install)
4. Once installed, verify it works:
   - Press `Windows + R`, type `cmd`, and press Enter to open Command Prompt
   - Type the following and press Enter:
     ```
     node -v
     ```
   - You should see something like `v20.x.x` — that means it's installed correctly
   - Also check npm:
     ```
     npm -v
     ```
   - You should see a version number like `10.x.x`

---

## 3. Step 2 – Install Git

Git is used to download the project from GitHub.

1. Go to **https://git-scm.com/downloads**
2. Click **Download for Windows** (or your OS)
3. Open the installer and click Next through all the steps — the default options are fine
4. Verify the installation:
   - Open Command Prompt (press `Windows + R`, type `cmd`, press Enter)
   - Type:
     ```
     git -v
     ```
   - You should see something like `git version 2.x.x`

> **Tip:** If you already have Git installed, you can skip this step.

---

## 4. Step 3 – Download the Project

Now let's get the project files onto your computer.

1. Open **Command Prompt** (press `Windows + R`, type `cmd`, press Enter)
2. Navigate to where you want to save the project. For example, to save it on your Desktop:
   ```
   cd Desktop
   ```
3. Clone (download) the project by typing:
   ```
   git clone https://github.com/crisvin03/Conan-App.git
   ```
4. Wait for it to finish downloading. You'll see files being copied.

> **Alternative:** If you don't want to use Git, you can go to https://github.com/crisvin03/Conan-App, click the green **"Code"** button, then click **"Download ZIP"**. Extract the ZIP file to a folder on your computer.

---

## 5. Step 4 – Open the Project Folder

1. In Command Prompt, move into the downloaded project folder:
   ```
   cd Conan-App
   ```
   If you downloaded the ZIP and extracted it to a different name, use that folder name instead.

2. You should now be inside the project directory. It will look something like:
   ```
   C:\Users\YourName\Desktop\Conan-App>
   ```

---

## 6. Step 5 – Install Dependencies

The project uses several libraries that need to be installed before it can run.

1. In Command Prompt, type the following and press Enter:
   ```
   npm install
   ```
2. This will download all the required packages. It may take **1–3 minutes** depending on your internet speed.
3. You'll see a progress bar and some text scrolling. Wait until it's done and you see the prompt again.

> **Note:** You only need to do this once. You don't need to run `npm install` again the next time you want to start the app.

---

## 7. Step 6 – Run the App

1. In Command Prompt (still inside the project folder), type:
   ```
   npm run dev
   ```
2. You'll see output like this:
   ```
   ▲ Next.js 16.x.x (Turbopack)
   - Local:   http://localhost:3000
   ✓ Ready in 3.9s
   ```
3. The app is now running on your computer!

> **Important:** Keep this Command Prompt window open while you're using the app. Closing it will stop the app.

---

## 8. Step 7 – Open in Browser

1. Open your web browser (Chrome, Edge, Firefox, etc.)
2. In the address bar, type:
   ```
   http://localhost:3000
   ```
3. Press Enter — the CONAN app should load and you're ready to go!

---

## 9. Stopping the App

When you're done using the app:

1. Go back to the Command Prompt window where the app is running
2. Press `Ctrl + C` on your keyboard
3. Type `Y` and press Enter if it asks to confirm

The app will stop. You can start it again anytime by running `npm run dev` inside the project folder.

---

## 10. Troubleshooting

**"npm is not recognized" or "node is not recognized"**
- Node.js is not installed or not added to PATH. Re-install Node.js from https://nodejs.org and restart Command Prompt.

**"git is not recognized"**
- Git is not installed. Follow Step 2 above, then restart Command Prompt.

**"npm install" fails with errors**
- Make sure you have a stable internet connection.
- Try deleting the `node_modules` folder (if it exists) and running `npm install` again.

**The browser shows "This site can't be reached"**
- Make sure the app is still running in Command Prompt (you should see the "Ready" message).
- Make sure you're going to `http://localhost:3000` (not https).

**Port 3000 is already in use**
- Another app is using port 3000. You can run on a different port:
  ```
  npm run dev -- -p 3001
  ```
  Then open `http://localhost:3001` in your browser.

**Changes not showing up**
- The app auto-updates when you edit files. If it doesn't, try refreshing the browser with `Ctrl + R`.

---

## Project Info

- **Framework:** Next.js 16 + TailwindCSS
- **Language:** TypeScript
- **Storage:** Local (Browser only — no data is sent to any server)
- **Project:** Bulan National High School
- **Developer:** Crisvin B. Habitsuela
