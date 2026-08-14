# Deployment

Two targets, one codebase, both rebuilding automatically on every push to `main`.

| Target | URL shape | Base path | Config |
|---|---|---|---|
| Azure Static Web Apps | `https://<name>.azurestaticapps.net` | `/` | `staticwebapp.config.json` |
| GitHub Pages | `https://<user>.github.io/chgf-control-tower/` | `/chgf-control-tower/` | `.github/workflows/deploy-pages.yml` |

The base path differs because Pages serves from a repo subdirectory and Azure
serves from the domain root. `vite.config.ts` reads `VITE_BASE`; the Pages
workflow sets it, Azure leaves it unset and gets `/`.

---

## Azure Static Web Apps — portal route (recommended)

Azure writes its own GitHub Actions workflow when you link the repo, so you do
not need to create one by hand.

1. **Portal → Create a resource → Static Web App.**
2. Fill in:
   - **Subscription / Resource group** — your existing ones, or create
     `rg-chgf-hackathon`.
   - **Name** — `chgf-control-tower`. This becomes
     `chgf-control-tower.azurestaticapps.net`.
   - **Plan type** — **Free**. This site is static with no API; Free is enough
     for the whole event.
   - **Region** — **West US 2**, closest to Seattle.
3. **Deployment details → Source: GitHub.** Authorise, then pick your
   organisation, the `chgf-control-tower` repo, and branch `main`.
4. **Build presets → React.** Then set these three fields exactly:

   | Field | Value |
   |---|---|
   | App location | `/` |
   | Api location | *(leave empty)* |
   | Output location | `dist` |

   `dist` is the critical one — the React preset defaults to `build`, which is
   Create React App's output directory, not Vite's. Leaving it as `build`
   produces a successful-looking deployment that serves nothing.
5. **Review + create.**

Azure commits `.github/workflows/azure-static-web-apps-<random>.yml` to your
repo and runs it. First deploy takes roughly 2–4 minutes. The URL appears on
the resource **Overview** page.

After Azure adds its workflow, run `git pull` locally so your working copy
matches the remote — otherwise your next push is rejected as non-fast-forward.

### CLI route (if you prefer)

Requires the Azure CLI, which is **not currently installed on this machine**:

```bash
winget install Microsoft.AzureCLI      # then restart the shell
az login
az staticwebapp create \
  --name chgf-control-tower \
  --resource-group rg-chgf-hackathon \
  --location westus2 \
  --sku Free \
  --source https://github.com/<owner>/chgf-control-tower \
  --branch main \
  --app-location "/" \
  --output-location "dist" \
  --login-with-github
```

---

## GitHub Pages

Already configured in `.github/workflows/deploy-pages.yml`. To turn it on:

1. **Repo → Settings → Pages.**
2. **Build and deployment → Source: GitHub Actions.**
3. Push anything to `main`, or run the workflow manually from the **Actions**
   tab via **Run workflow**.

Pages requires a **public repository** on GitHub Free. If the repo is private,
use Azure only — Azure Static Web Apps deploys happily from a private repo.

If you fork or rename the repo, update `VITE_BASE` in the workflow to match the
new repo name, or every asset 404s.

---

## Verifying a deploy

```bash
gh run list --limit 3            # did the workflow pass?
gh run watch                     # follow the current run
```

Then load the site and check three things:

1. The header badge shows the correct current session.
2. `/#/teams` lists 15 teams.
3. Hard-refresh a deep link like `/#/judging` — it should load directly.

Routing uses `HashRouter`, so deep links work on both hosts with no rewrite
rules. That is deliberate: it removes the single most common static-hosting
failure, where `/judging` 404s because the server looks for a file at that path.

---

## Rollback

```bash
git revert HEAD && git push      # safest — redeploys the previous content
```

A revert-and-push is live in about 60–90 seconds, which is faster and less
error-prone than editing content back by hand under time pressure.
