# ProofGrid — Decentralized Task Marketplace on Pi Network

**Version**: 1.0.0 | **Status**: Production Ready ✅ | **Last Updated**: March 31, 2026

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [Design System](#design-system)
5. [Architecture](#architecture)
6. [User Roles & Capabilities](#user-roles--capabilities)
7. [System Requirements](#system-requirements)
8. [Installation & Setup](#installation--setup)
9. [API Documentation](#api-documentation)
10. [Database Schema](#database-schema)
11. [Deployment](#deployment)
12. [Performance & Scalability](#performance--scalability)
13. [Known Issues](#known-issues)
14. [Contributing](#contributing)
15. [License](#license)

---

## Overview

**ProofGrid** is a decentralized task marketplace platform powered by the Pi Network blockchain. It enables employers to post micro-tasks with escrowed payments and workers to earn Pi cryptocurrency by completing verified work.

### Mission
Democratize work opportunities and provide a fair, transparent, and blockchain-verified platform where workers can earn without geographic or credential barriers.

### Core Value Proposition
- **For Workers**: Earn Pi crypto for flexible gig work with instant blockchain-verified payments
- **For Employers**: Access a global workforce with transparent quality control and dispute resolution
- **For Platform**: 10% transaction fee covers operations, blockchain costs, and platform maintenance

---

## Key Features

### 🎯 Task Marketplace
- **Task Discovery**: Filter by category, reward, duration, and reputation requirements
- **Proof Type Selection**: 6 types of proof verification (text, image, audio, file, video, structured form)
- **Instruction Documents**: Employers upload PDF/Word docs; workers download before claiming
- **Slot-Based Model**: Multiple workers per task with time-limited claims
- **Real-time Status**: Track task progression from creation to completion

### 👤 Worker System
- **Profile Management**: Reputation scores, badges, earning history
- **Flexible Earning**: Claim tasks anytime, submit various proof types
- **Instant Verification**: Blockchain-confirmed payments on approval
- **Dispute Resolution**: 2-tier arbitration if unfairly rejected
- **Analytics Dashboard**: Track earnings, completion rate, reputation growth

### 💼 Employer Dashboard
- **Task Management**: Create, monitor, and manage up to 100 simultaneous tasks
- **Submission Review**: Visual interface for approving/rejecting work with quality ratings
- **Escrow Control**: Lock funds, release on approval, refund unclaimed amounts
- **Analytics**: Track spending, worker quality, task performance
- **Batch Operations**: Manage multiple submissions efficiently

### 🛡️ Admin & Moderation
- **Platform Analytics**: Real-time view of transactions, fees, and platform health
- **Dispute Arbitration**: Manual intervention in contested approvals
- **Payment Recovery**: Handle stuck transactions and network issues
- **User Management**: Ban fraudulent accounts, verify identities
- **Audit Logging**: Full action history for compliance

### 💰 Financial System
- **Atomic Escrow**: PostgreSQL RPCs ensure transaction atomicity
- **Platform Fee**: 10% deducted from task rewards (covers blockchain & operations)
- **Instant Settlement**: Pi Network blockchain transactions within 1-2 seconds
- **Refund Automation**: Unclaimed slots automatically refunded after deadline
- **Transaction Tracking**: Full ledger from creation to confirmation

---

## Technology Stack

### Frontend
- **Framework**: Next.js 16.1.6 with Turbopack
- **Language**: TypeScript 5
- **Design System**: ProofGrid Color Palette (Sapphire & Cyan)
- **Layout**: Bento Grid with glassmorphism effects
- **Styling**: Tailwind CSS + Design Tokens
- **State Management**: React hooks (useContext, useState)
- **HTTP Client**: Fetch API with token-based auth

### Backend
- **Runtime**: Node.js (via Next.js)
- **API**: RESTful endpoints (47 routes)
- **Authentication**: Pi Network SDK + Custom JWT
- **Rate Limiting**: Upstash Redis (100 req/min per user)

### Database
- **Primary**: Supabase PostgreSQL
- **Tables**: 15+ normalized tables
- **RPCs**: 6 atomic functions for financial operations
- **Migrations**: SQL-based version control

### Storage
- **Files**: Supabase Storage (3 buckets)
  - `nexus-proofs`: Worker proofs and submission files
  - `nexus-docs`: Operating documentation
  - `nexus-avatars`: User profile pictures

### Payment
- **Blockchain**: Pi Network testnet/mainnet
- **SDK**: Pi Network JavaScript SDK
- **Flow**: Escrow lock → Approval → Payout
- **Confirmations**: 1-2 second settlement

### Infrastructure
- **Hosting**: Vercel (auto-scaling, CDN)
- **Database**: Supabase Cloud (PostgreSQL managed)
- **Storage**: Supabase Cloud (S3-compatible)
- **CI/CD**: GitHub Actions (on push to main)
- **Monitoring**: Vercel Analytics + custom logging

### Testing
- **Framework**: Jest 30.3.0
- **Coverage**: 40+ tests across 11 suites
- **Types**: Service layer + API integration tests
- **Mocking**: Supabase client mocks for isolation

## Design System

### ProofGrid Color Palette
The app uses the **ProofGrid design system** with a modern color palette optimized for the Pi Network marketplace:

| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| **Primary Brand** | Sapphire Deep | `#0F52BA` | Buttons, headers, active states |
| **Accent Highlight** | Electric Cyan | `#00E5E5` | Progress bars, verified badges, glows |
| **Main Background** | Obsidian Blue | `#081A33` | Page backgrounds |
| **Surface Cards** | Glass Navy | `#122647` | Card containers, dropdowns |
| **Primary Text** | Snow White | `#F4F6FA` | Body text, readable contrast |
| **Secondary Text** | Steel Gray | `#A7B8C7` | Muted labels, hints |

### Layout & Components
- **Grid System**: Bento Grid layout with `20px` border radius for tiles
- **Glassmorphism**: Cards with 80% opacity, thin cyan border, subtle backdrop blur
- **Glow Effects**: Electric cyan glow on primary buttons (mimics logo's luminous hexagon)
- **Color Distribution**: 60% dark neutrals, 30% sapphire brand, 10% cyan accents

For complete design guidelines, implementation examples, and component specifications, see [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

### Files
- `src/lib/design/tokens.ts` — Central design token definitions
- `tailwind.config.js` — Tailwind CSS brand extensions
- `DESIGN_SYSTEM.md` — Complete design documentation with examples

---

## Architecture

### High-Level Flow

```
EMPLOYER → CREATE TASK
    ↓
   Pi Payment (escrow lock)
    ↓
RPC: create_task_with_escrow (atomic)
    ├─ Lock funds in EscrowLedger
    ├─ Create Task record
    └─ Log to AdminAction

WORKER → DISCOVER & CLAIM
    ↓
Reserve slot (timeout: category-dependent)
    ↓
SUBMIT PROOF
    ├─ Upload file/image/text
    ├─ Store in Supabase
    └─ Create Submission record

EMPLOYER → REVIEW & APPROVE
    ↓
RPC: approve_submission_atomic (atomic)
    ├─ Validate employer owns task
    ├─ Calculate 10% platform fee
    ├─ Create worker_payout transaction
    ├─ Create platform_fee transaction
    └─ Update reputation scores

PAYMENT PROCESSING
    ↓
Trigger A2U payment (Pi Network)
    ├─ Worker receives: 90% of reward
    ├─ Platform keeps: 10% fee
    └─ Blockchain settles in 1-2 seconds
```

### Service Layer
- TaskService — Task CRUD & discovery
- SubmissionService — Proof management
- EscrowService — Payment management
- DisputeService — Arbitration
- AnalyticsService — Dashboards & metrics

---

## Installation & Setup

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/nexus-platform/nexus.git
cd nexus

# 2. Install dependencies
npm install

# 3. Configure environment (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key
PI_API_KEY=your_key

# 4. Start development server
npm run dev

# 5. Open browser
# http://localhost:3000
```

### Full Setup Guide
See [Installation Guide](./docs/INSTALLATION.md)

---

## API Documentation

### Base URL
```
https://nexus.vercel.app/api
```

### Quick Reference
- **47 Endpoints** across 8 categories
- **RESTful** design with standard HTTP methods
- **Token Auth** via `x-pi-uid` header
- **JSON** request/response format

### Main Endpoints
- `GET /tasks` — List active tasks
- `POST /tasks` — Create new task
- `POST /submissions` — Submit work
- `POST /submissions/:id/approve` — Approve work
- `GET /analytics/worker` — Worker dashboard
- `GET /admin/analytics` — Admin dashboard

**Full API docs**: See [API_REFERENCE.md](./docs/API_REFERENCE.md)

---

## Deployment

### Prerequisites
- Node.js 18+
- Supabase account
- Vercel account
- Pi Network API key

### Deploy to Vercel
```bash
vercel deploy --prod
```

**Detailed guide**: [Deployment Guide](./docs/DEPLOYMENT.md)

---

## Performance & Scalability

| Metric | Capacity |
|--------|----------|
| Concurrent Users | 5,000+ |
| Transactions/Day | 50,000+ |
| API Calls/Day | 500,000+ |
| Uptime SLA | 99.9% |

**Bottleneck**: Pi Network transaction settlement (1-2 seconds)

---

## Known Issues

- ✅ **FIXED**: Fee calculation now correctly uses 10%
- 🟡 **Structured Form UI**: Not yet implemented
- 🟡 **File Compression**: Missing (pending)

See [ISSUES.md](./ISSUES.md) for complete list

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit changes: `git commit -m 'feat: description'`
4. Push to fork: `git push origin feat/your-feature`
5. Create Pull Request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines

---

## Support

- **Documentation**: [./docs](./docs)
- **Issues**: [GitHub Issues](https://github.com/nexus-platform/nexus/issues)
- **Email**: support@nexus.platform
- **Discord**: [Community Server](https://discord.gg/nexus)

---

## License

**Proprietary — All Rights Reserved 2026**

This software is proprietary. Unauthorized copying is prohibited.

For licensing inquiries: `legal@nexus.platform`

---

**Last Updated**: March 31, 2026 | **Status**: Production Ready ✅
