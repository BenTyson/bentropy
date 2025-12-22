# Agent Workflow Guide

> **Universal workflow for all projects. Copy this file to any project's docs folder.**

---

## ⚠️ CRITICAL: Branch Rules

```
DEFAULT BRANCH: develop (YOU ARE HERE)
PRODUCTION:     main (DO NOT TOUCH)
```

### The One Rule

**NEVER push to `main`. Always push to `develop`.**

---

## Start of Session

```bash
# 1. Verify you're on develop
git branch

# 2. If not on develop, switch
git checkout develop

# 3. Pull latest
git pull origin develop
```

---

## During Work

```bash
# Make changes, then:
git add .
git commit -m "Description of changes"
git push origin develop
```

---

## End of Session

**Always say:**
> "Changes pushed to `develop`. Create a PR to `main` when ready to deploy."

**DO NOT:**
- Push to main
- Create PRs automatically
- Merge anything

---

## When User Says "Deploy" / "Merge" / "Go Live"

Only then:

```bash
# Option A: Guide user to GitHub
# "Go to: https://github.com/USERNAME/REPO/compare/main...develop"
# "Create PR, then merge"

# Option B: If user wants CLI
git checkout main
git merge develop
git push origin main
git checkout develop
```

---

## Commands to NEVER Run

```bash
git push origin main          # NO
git checkout main && git push # NO
git merge main                # NO (wrong direction)
```

---

## Commands That Are Safe

```bash
git checkout develop          # YES
git pull origin develop       # YES
git push origin develop       # YES
git add .                     # YES
git commit -m "..."           # YES
git status                    # YES
git log                       # YES
```

---

## Quick Reference

| Action | Command |
|--------|---------|
| Check branch | `git branch` |
| Switch to develop | `git checkout develop` |
| Pull latest | `git pull origin develop` |
| Push changes | `git push origin develop` |
| Check status | `git status` |

---

## Why This Workflow?

- `main` = production (auto-deploys to live site)
- `develop` = safe working branch
- PRs = controlled deployments with review
- Prevents accidental production pushes

---

## For Project-Specific Info

Check these files if they exist:
- `docs/WORKFLOW.md` - Project-specific workflow details
- `docs/DEPLOYMENT.md` - Deployment configuration
- `docs/SESSION-START.md` - Project context and status
