# FiTrack — Backend API

Node.js/Express REST API for the FiTrack personal finance tracker.

## Tech Stack
- **Node.js** (ES Modules)
- **Express.js v5**
- **Sequelize ORM** + SQLite (`fitrack.sqlite`)
- **bcryptjs** — password hashing
- **jsonwebtoken** — JWT authentication
- **multer** — file upload handling (CSV/XLSX/PDF)
- **csv-parser** — CSV statement parsing
- **exceljs** — XLSX statement parsing
- **pdf-parse** — text-based PDF parsing

## API Endpoints

### Auth — `/api/auth`
| Method | Path | Description |
|---|---|---|
| POST | `/register` | Register new account |
| POST | `/login` | Login and receive JWT token |

### Transactions — `/api/transactions`
| Method | Path | Description |
|---|---|---|
| GET | `/` | Get all transactions (supports `?type=&category=&from=&to=&page=&limit=`) |
| POST | `/` | Create transaction |
| PUT | `/:id` | Update transaction |
| DELETE | `/:id` | Delete transaction |

### Budgets — `/api/budgets`
| Method | Path | Description |
|---|---|---|
| GET | `/` | Get all budgets with current spending progress |
| POST | `/` | Create budget |
| PUT | `/:id` | Update budget |
| DELETE | `/:id` | Delete budget |

### Analytics — `/api/analytics`
| Method | Path | Description |
|---|---|---|
| GET | `/monthly-trend` | Income vs expense per month (12 months) |
| GET | `/summary?period=month\|year\|all` | Totals + category breakdown |

### Import — `/api/import`
| Method | Path | Description |
|---|---|---|
| POST | `/csv` | Parse CSV (PhonePe / Google Pay / bank CSV) |
| POST | `/excel` | Parse XLSX bank statement |
| POST | `/pdf` | Parse text-based PDF bank statement |

### Profile — `/api/profile`
| Method | Path | Description |
|---|---|---|
| GET | `/` | Get current user profile |
| PUT | `/` | Update display_name, base_currency, timezone |
| PUT | `/password` | Change password |

## Environment Setup

Create `.env` in `fitrack-server/`:
```env
PORT=3000
DATABASE_STORAGE=./fitrack.sqlite
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h
```

## Running

```bash
npm install
npm install pdf-parse   # if not already installed
npm run dev             # starts with nodemon on port 3000
```

## Import Format Support

| Source | Format | Detection |
|---|---|---|
| PhonePe | CSV / PDF | `Transaction ID`, `UTR` headers (CSV) or `Jan 10, 2025` date format with `DEBIT/CREDIT` flags (PDF) |
| Google Pay | CSV / PDF | `Type`, `Amount` headers (CSV) or generic date/amount regex matcher (PDF) |
| Jio / BHIM | PDF | `09 Dec, 2025` date format with `Received from`/`Paid to` prefixes and rupee symbols |
| HDFC / ICICI | CSV / XLSX / PDF | `Narration`, `Chq/Ref` headers (CSV/XLSX) or generic column split date/amount matcher (PDF) |
| Other banks | CSV / XLSX / PDF | Generic column split and fallback regex date/amount scanner |

> **Note**: Scanned/image PDFs are not supported — only text-selectable PDFs work. The server uses a stateful scanner to auto-group multi-line and single-line layout statements dynamically.
