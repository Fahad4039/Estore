# Estore Premium

A full-stack e-commerce application with a React frontend and Express API backend.

## Stack

| Layer    | Technology                                      |
|----------|-------------------------------------------------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Zustand, TanStack Query, Wouter |
| Backend  | Node.js, Express 5, TypeScript, PostgreSQL (`pg`) |
| Database | PostgreSQL (schema in `database/schema_sqlite.sql`) |

## Project Structure

```
estore/
├── frontend/          # React + Vite app (estore UI)
├── server/            # Express API server
│   └── src/
│       ├── routes/    # auth, products, cart, orders, wallet, seller, admin …
│       ├── db/        # postgres connection + DB initialisation
│       └── lib/       # logger (pino)
└── database/
    └── schema_sqlite.sql   # SQLite-style reference schema
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL database

### Environment Variables

**Server** (`server/.env`):
```
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/estore
SESSION_SECRET=your-secret-here
```

**Frontend** (`frontend/.env`):
```
PORT=5173
BASE_PATH=/
VITE_API_URL=http://localhost:3000
```

### Install & Run

```bash
# Install server deps
cd server && npm install

# Install frontend deps
cd frontend && npm install

# Start API server (dev)
cd server && npm run dev

# Start frontend (dev)
cd frontend && npm run dev
```

## API Routes

| Method | Path                  | Description              |
|--------|-----------------------|--------------------------|
| GET    | /api/healthz          | Health check             |
| POST   | /api/auth/register    | Register                 |
| POST   | /api/auth/login       | Login                    |
| GET    | /api/products         | List products            |
| GET    | /api/products/:id     | Product detail           |
| GET    | /api/cart             | Get cart                 |
| POST   | /api/cart             | Add to cart              |
| GET    | /api/orders           | List orders              |
| POST   | /api/orders           | Place order              |
| GET    | /api/wallet           | Wallet balance & history |
| GET    | /api/admin/…          | Admin endpoints          |

## License

MIT
