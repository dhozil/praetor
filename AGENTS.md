<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Commands

- Contract tests (35 tests): `.venv\Scripts\python.exe -m pytest tests/test_praetor.py -q` — do NOT use `npx pytest` (hangs on an unrelated npm package)
- Frontend typecheck: `npx tsc --noEmit`
- Frontend build: `npm run build`
- Deployed contract address lives in `src/lib/genlayer-network.ts:38`; update it (plus README) after each redeploy and push.
