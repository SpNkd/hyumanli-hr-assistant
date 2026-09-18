# Deployment history

## Public demo · 2026-09-18

- Source commit: `0878e4b734cee585471be53ae6a44759e4414edd`
- Application release commit: `010322f795a1ce894f6e1e81e7c11d6927c590bb`
- Static frontend: [GitHub Pages](https://spnkd.github.io/hyumanli-hr-assistant/)
- Pages workflow: [Deploy ХьюманЛИ to GitHub Pages](https://github.com/SpNkd/hyumanli-hr-assistant/actions/runs/35337364155)
- API Gateway: `https://d5dk89ppio7pjn77uh2g.7qsg961h.apigw.yandexcloud.net`
- Function version: `d4euc10dqalv2tnjeike` (`ACTIVE`)
- Live provider: BotHub, model `deepseek-v4-flash`
- Health check: `GET /api/status` returned `configured: true`, provider `bothub`
- CORS check: Pages origin preflight returned `204` with the exact allowed origin
- Generation smoke test: two consecutive structured JSON responses returned `HTTP 200`

Secrets are stored only in the Yandex Function version environment. They are not part of the repository, Pages artifact, workflow, or deployment documentation.

## Rollback

Keep the previous known-good source commit available in Git history. For the serverless backend, publish a new version from `deploy/yandex/function` and move the gateway tag only after a status, CORS, and generation smoke test. Do not place provider keys in `config.js` or static assets.
