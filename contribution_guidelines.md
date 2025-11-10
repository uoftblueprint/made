## Pull Request Conventions

### 1. General Rules

- One PR should do **one thing well** (a single feature, bugfix, or refactor).
- Keep PRs **small and focused** to make review easier.
- Every PR must:
  - Pass all CI checks (lint, tests, build).
  - Be reviewed and approved by **at least one lead** before merging.
  - Be linked to at least one **issue**.
- Draft PRs are encouraged for early feedback.

---

### 2. Branch Naming

Use the format:

- `feature/<short-description>` for new features  
  Example: `feature/auth-login-endpoint`
- `fix/<short-description>` for bug fixes  
  Example: `fix/catalogue-search-bug`
- `chore/<short-description>` for maintenance or refactors  
  Example: `chore/update-readme`

Use lowercase and hyphens (`-`), not underscores.

---

### 3. PR Title Format

Follow the structure:

`<type>(<scope>): <short summary>`

Where:
- `type` is one of: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`
- `scope` is the main module or feature being changed (e.g. `auth`, `catalogue`, `admin`, `frontend`, `backend`, `history`, `move-requests`)

Examples:
- `feat(auth): implement JWT login endpoint`
- `fix(catalogue): correct on-floor filtering`
- `refactor(history): extract location computation helper`
- `chore(ci): add linting workflow`

---

### 4. PR Description Template

Every PR should follow this structure:

```markdown
### Summary
Short summary of what this PR does and why it matters.

### Related Issues
- Closes #<issue-number>
- Relates to #<issue-number> (if applicable)

### Changes
- Bullet point 1
- Bullet point 2
- Bullet point 3

### How to Test
1. Step-by-step testing instructions
2. Include example commands (e.g. `npm test`, `pytest`, or `curl` requests)
3. Mention any environment variables or setup steps

### Screenshots / UI (if applicable)
- Before:
- After:

### Checklist
- [ ] Tests added or updated
- [ ] CI passes (lint, tests, build)
- [ ] Documentation updated (if behavior changed)
- [ ] No secrets or credentials committed
```

---

### 5. Linking Issues

- Always link related issues using GitHub keywords:
  - `Closes #123` or `Fixes #456` will auto-close issues when merged.
- If the PR only partially addresses an issue, use:
  - `Relates to #123` or `Part of #123` (avoid `Closes`).

---

### 6. Code and Test Expectations

- **Backend PRs:**
  - Include unit tests for new logic (e.g. APIs, history rules, auth flow).
  - Update or add API documentation if endpoints change.
- **Frontend PRs:**
  - Add or update component tests if possible.
  - Include screenshots or short descriptions for UI changes.
- No PR should introduce failing tests or lint warnings.

---

### 7. Review Process

- Each PR must be reviewed and approved by **at least one lead**.
- As the author:
  - Highlight any uncertain areas or breaking changes in the PR description.
  - Respond to all review comments before requesting re-approval.
- As the reviewer:
  - Focus on correctness, clarity, and maintainability.
  - Confirm tests and CI pass before approving.
  - Ensure naming, structure, and documentation are consistent.

---

### 8. Merging

- Use **squash and merge** to maintain a clean, linear history.
- Before merging:
  - Confirm that all review comments are resolved.
  - Ensure CI is green.
  - Verify that the PR title is meaningful for the squash commit message.
- Delete the feature branch after merging.

---

### 9. When to Split a PR

Split large PRs into smaller ones if:
- The PR touches **unrelated features** (e.g. auth + catalogue + admin).
- The diff is too large to review easily (more than ~400–500 lines changed).
- You have mixed refactors and new features that can be separated.

---

### 10. Sensitive Data and Secrets

- Never commit:
  - API keys
  - Tokens
  - Real passwords or `.env` files
- Use `.env.example` to document required environment variables.
- Verify that `.gitignore` covers secrets and local configuration files.
