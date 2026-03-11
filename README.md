# MaterialFlow - Logistics Hub

A modern supply chain and logistics management system for construction materials, featuring role-based dashboards, BOQ analysis, and AI-powered bill auditing.

## How to push to a Repository (GitHub/GitLab)

Follow these steps to create a new repository and push your code:

1. **Initialize Git:**
   Open your terminal in the project root and run:
   ```bash
   git init
   ```

2. **Add Files:**
   Stage all your files for the first commit:
   ```bash
   git add .
   ```

3. **Commit Changes:**
   ```bash
   git commit -m "Initial commit: MaterialFlow Logistics System"
   ```

4. **Create a Remote Repo:**
   - Go to [GitHub](https://github.com) and create a new repository.
   - Copy the repository URL (e.g., `https://github.com/your-username/materialflow.git`).

5. **Link and Push:**
   Replace `<REPO_URL>` with the URL you copied:
   ```bash
   git branch -M main
   git remote add origin <REPO_URL>
   git push -u origin main
   ```

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS + ShadCN UI
- **Backend:** Firebase (Auth, Firestore, App Hosting)
- **AI:** Google Genkit + Gemini 1.5 Flash
