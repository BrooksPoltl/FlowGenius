# Initial Setup Implementation Guide

This document outlines the step-by-step implementation for setting up the development environment for the AI-Powered Personalized News Curator feature.

## Phase 0: Project Tooling Setup

### Step 1: Migrate from Biome to ESLint with Airbnb Rules

#### 1.1 Remove Biome
- Delete `biome.json` configuration file
- Remove `@biomejs/biome` from `devDependencies` in `package.json`

#### 1.2 Install ESLint and Dependencies
Add the following dev dependencies to `package.json`:
```json
"@typescript-eslint/eslint-plugin": "^7.18.0",
"@typescript-eslint/parser": "^7.18.0",
"eslint": "^8.57.0",
"eslint-config-airbnb": "^19.0.4",
"eslint-config-airbnb-typescript": "^18.0.0",
"eslint-config-prettier": "^9.1.0",
"eslint-plugin-import": "^2.29.1",
"eslint-plugin-jsx-a11y": "^6.9.0",
"eslint-plugin-prettier": "^5.2.1",
"eslint-plugin-react": "^7.35.0",
"eslint-plugin-react-hooks": "^4.6.2",
"prettier": "^3.3.3"
```

#### 1.3 Create ESLint Configuration
Create `.eslintrc.cjs`:
```javascript
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'airbnb',
    'airbnb-typescript',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'react'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
    'react/require-default-props': 'off',
    'import/prefer-default-export': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
```

#### 1.4 Create Prettier Configuration
Create `.prettierrc`:
```json
{
  "semi": true,
  "singleQuote": true,
  "jsxSingleQuote": false,
  "trailingComma": "es5",
  "arrowParens": "as-needed",
  "printWidth": 80,
  "tabWidth": 2,
  "endOfLine": "lf"
}
```

#### 1.5 Update Package.json Scripts
Replace the existing lint scripts with:
```json
"lint": "eslint . --ext .js,.jsx,.ts,.tsx --report-unused-disable-directives --max-warnings 0",
"lint:fix": "eslint . --ext .js,.jsx,.ts,.tsx --fix",
"format": "prettier --write \"src/**/*.{js,jsx,ts,tsx,css,md}\""
```

Update the `prebuild` script to enforce linting:
```json
"prebuild": "run-s lint clean:dev compile:app compile:packageJSON"
```

## Phase 1: Core Dependencies and Structure

### Step 2: Install News Curator Dependencies

Add the following production dependencies:
```bash
pnpm add langgraph@latest @langchain/core@latest better-sqlite3@latest dotenv@latest
```

Add development dependencies:
```bash
pnpm add -D @types/better-sqlite3@latest
```

### Step 3: Create Directory Structure

Create the following directory structure in `src/main/`:
```
src/main/
├── db/
│   ├── schema.ts
│   └── index.ts
├── services/
│   ├── settings.ts
│   └── news_curator/
│       ├── agents/
│       │   ├── search.ts
│       │   └── curation.ts
│       └── graph.ts
└── (existing files)
```

### Step 4: Environment Variable Setup

#### 4.1 Create .env File
Create `.env` in project root:
```
BRAVE_API_KEY=<YOUR_BRAVE_API_KEY>
```

#### 4.2 Update .gitignore
Add to `.gitignore`:
```
.env
```

### Step 5: Database Setup

#### 5.1 Create Database Schema (`src/main/db/schema.ts`)
```typescript
export const CREATE_INTERESTS_TABLE = `
  CREATE TABLE IF NOT EXISTS Interests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT NOT NULL UNIQUE
  );
`;

export const CREATE_ARTICLES_TABLE = `
  CREATE TABLE IF NOT EXISTS Articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;
```

#### 5.2 Create Database Connection (`src/main/db/index.ts`)
```typescript
import Database from 'better-sqlite3';
import path from 'node:path';
import { app } from 'electron';
import { CREATE_ARTICLES_TABLE, CREATE_INTERESTS_TABLE } from './schema';

const dbPath = path.join(app.getPath('userData'), 'app_database.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Create tables if they don't exist
db.exec(CREATE_INTERESTS_TABLE);
db.exec(CREATE_ARTICLES_TABLE);

console.log('Database initialized at:', dbPath);

export default db;
```

#### 5.3 Create Settings Service (`src/main/services/settings.ts`)
```typescript
import db from '../db';

const DEFAULT_INTERESTS = [
  'Artificial Intelligence',
  'Technology',
  'Finance',
  'Software Engineering',
  'Startups',
];

export function seedDefaultInterests(): void {
  const count = db.prepare('SELECT COUNT(*) as count FROM Interests').get() as { count: number };
  
  if (count.count === 0) {
    const insertInterest = db.prepare('INSERT INTO Interests (topic) VALUES (?)');
    
    for (const topic of DEFAULT_INTERESTS) {
      insertInterest.run(topic);
    }
    
    console.log('Default interests seeded');
  }
}

export function getUserInterests(): string[] {
  const interests = db.prepare('SELECT topic FROM Interests').all() as { topic: string }[];
  return interests.map(interest => interest.topic);
}
```

This implementation guide provides the complete foundation needed before beginning feature development. 