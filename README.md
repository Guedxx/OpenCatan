# OpenCatan

Monorepo with backend game logic/API (`back`) and frontend client (`front`).

## Start backend

```bash
cd back
uv sync --dev
uv run uvicorn catan.api.main:app --reload --port 8000
```

## Start frontend

```bash
cd front
python -m http.server 5173
```

Open `http://localhost:5173/board.html`.
