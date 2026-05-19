# JBC ATHENAEUM

JBC ATHENAEUM is a sophisticated, classic-themed academic resource platform developed for **Jana Bhawana Campus**. It serves as a centralized hub for students to access, share, and preserve academic notes, past questions, and research materials.

## 🏛️ Mission
To streamline the flow of academic intelligence and ensure that every student at Jana Bhawana Campus has instant access to high-quality pedagogical resources.

## ✨ Key Features
- **Semantic Resource Indexing**: All materials are organized by Faculty, Semester, and Subject for effortless retrieval.
- **Classic Library Interface**: A polished UI inspired by traditional academic registries, featuring a Mega Menu for faculty navigation.
- **Secure Portal**: Role-based access for students and administrators to manage the archive.
- **Global Search**: Instant search across all indexed subjects and specific dispatches.
- **Collaborative Archive**: Integrated submission system for students to contribute their own verified notes.
- **Personalized Experience**: Cookie-based user greeting and persistent local storage for session management.

## 🛠️ Technology Stack
- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS (Modern Utility-First)
- **Icons**: Lucide React
- **Animations**: Motion (Framer Motion)
- **Database/Storage**: Supabase (PostgreSQL) for resource metadata.
- **Deployment**: Optimized for standard cloud environments.

## 🚀 Getting Started
To get the application fully operational, you must configure your Supabase instance.
Please refer to [frontend/SUPABASE_SETUP.md](./frontend/SUPABASE_SETUP.md) for the required SQL schema and table structures.

```bash
npm install
npm run dev:frontend   # Frontend on Vite
npm run dev:backend    # Backend API server
```

## 📂 Project Structure
```text
.
├── frontend/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/        # UI Component Library
│   │   ├── lib/               # Supabase and data logic
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── backend/                   # Express backend server
│   ├── server.js
│   └── package.json
└── package.json               # Root workspace scripts
```

## 👨‍💻 Developer Information
**Nirmal Sanjel**
- **Role**: Lead Developer & Architect
- **Email**: hackingwithnirmal@gmail.com
- **Phone**: +977 9848744321

---
*Developed with a commitment to academic excellence.*
