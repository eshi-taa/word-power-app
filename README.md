# Word Power App

A full-stack mobile application designed to help users build high-level English vocabulary through root-word semantic associations. The app features automated text-to-speech pronunciation, interactive testing, streak tracking, and push notification reminders.

---

## 📱 Demo

`[Add GIF here]`

---

## 🧠 The Problem

Traditional vocabulary apps often overwhelm users by presenting isolated words in alphabetical order without contextual retention or logical groupings. Word Power solves this by teaching vocabulary through root-word semantic families (e.g., *CRED* — "believe", *RUPT* — "break"), reinforcing understanding using dynamic quizzes, and maintaining daily study streaks to build consistency.

---

## 🛠️ Tech Stack

| Technology | Why I Chose It |
| :--- | :--- |
| **React Native (Expo)** | Cross-platform mobile development (iOS/Android) with a native feel, using a single codebase and Expo's secure system tools (`SecureStore`, `Audio`). |
| **Node.js** | Fast, event-driven, non-blocking asynchronous environment, optimal for building lightweight API services. |
| **Express** | Minimalist, unopinionated routing framework for structuring RESTful APIs cleanly in JavaScript. |
| **PostgreSQL** | Relational database to enforce integrity for key entities like users, study history, streaks, and quiz results. |
| **Prisma** | Modern ORM providing complete type-safety, automatic migrations, and clean relational query nesting. |
| **Redis** | Chosen for future implementation of high-speed caching of user sessions and rate-limiting. |
| **JWT** | Stateless, secure JSON Web Tokens to authenticate API requests between the client and backend. |
| **Firebase Auth** | Industry-standard identity provider for verifying OAuth user tokens (e.g., Google Sign-in) on the backend. |
| **Google Text-to-Speech** | High-fidelity, natural-sounding audio synthesis engine to generate clear pronunciation guides for vocabulary. |
| **Cloudflare R2** | S3-compatible cloud object storage with zero egress fees, ideal for caching generated audio files. |
| **Railway** | Developer-friendly cloud hosting platform offering seamless Git-based CI/CD pipeline deployments. |

---

## 📐 Architecture

`[Add architecture diagram here]`

---

## 🔑 Key Technical Decisions

* **Pronunciation Caching with Cloudflare R2**: Calling the Google Text-to-Speech (TTS) API on every single card tap is slow and expensive. To solve this, when a word's audio is first requested, the backend synthesizes it, uploads it to Cloudflare R2 as an `.mp3`, and stores the public URL in the database. Subsequent taps hit the database/R2 directly, which reduces latency and saves Google API costs.
* **Stateless JWT with Token Rotation**: To prevent credential interception, the app implements a secure token rotation system. Short-lived access tokens (15 minutes) are sent in API request headers, while a long-lived refresh token (7 days) is stored securely on the device in `SecureStore` to silently request a new access token when it expires.
* **Prisma ORM over Raw SQL**: Prisma provides full JavaScript/TypeScript autocompletion and type-safety. It allows us to perform nested query operations (such as fetching a word group along with the user's progress and the associated words in one database call) without writing complex SQL JOIN boilerplate.

---

## 🚀 How to Run Locally

### 1. Prerequisite Setup
* Clone the repository.
* Ensure you have [Node.js](https://nodejs.org/) installed.

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env` variables (use `.env.example` as a template):
   ```ini
   PORT=3000
   NODE_ENV=development
   DATABASE_URL="your-postgresql-url"
   JWT_SECRET="your-32-char-jwt-secret"
   JWT_REFRESH_SECRET="your-32-char-refresh-secret"
   GOOGLE_TTS_API_KEY="your-google-api-key"
   R2_ACCESS_KEY="your-r2-access-key"
   R2_SECRET_KEY="your-r2-secret-key"
   R2_BUCKET="your-r2-bucket-name"
   R2_ENDPOINT="your-cloudflare-r2-endpoint"
   ```
4. Push the Prisma database schema and generate the client:
   ```bash
   npx prisma db push
   npx prisma generate
   ```
5. Seed the vocabulary database:
   ```bash
   node src/config/seed.js
   ```
6. Start the Express development server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your local IP in your `.env` file:
   ```ini
   EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:3000/api
   ```
4. Run the Metro bundler:
   ```bash
   npm run start
   ```

---

## api API Documentation

| Method | Route | Auth | Description |
| :--- | :--- | :---: | :--- |
| **POST** | `/api/auth/firebase` | Public | Authenticates or registers a user via a Firebase token. Returns access & refresh tokens. |
| **POST** | `/api/auth/refresh` | Public | Generates a new short-lived access token using a valid refresh token. |
| **GET** | `/api/words/groups` | Private | Fetches all root-word groups with meanings, word counts, and study status. |
| **GET** | `/api/words/groups/:id` | Private | Retrieves detailed group data including all associated vocabulary words. |
| **POST** | `/api/words/groups/studied` | Private | Marks a group as studied for the user and schedules a 24-hour review push notification. |
| **GET** | `/api/words/audio/:wordId` | Private | Returns a cached pronunciation audio URL (or generates a new one on R2 if missing). |
| **GET** | `/api/words/progress` | Private | Fetches all study progress records for the user dashboard. |
| **GET** | `/api/quiz/:groupId` | Private | Generates a 3-question vocabulary quiz if the user has studied the group. |
| **POST** | `/api/quiz/submit` | Private | Submits quiz answers, grades results, increments streaks, and unlocks subsequent groups. |
| **GET** | `/health` | Public | Simple health check endpoint for checking server uptime. |

---

## 🔮 What I'd Build Next

1. **AI Word Coach**: Integrate the Anthropic Claude API to offer personalized, real-time contextual explanations and creative custom examples whenever a user answers a quiz question incorrectly.
2. **Global Leaderboards**: Incorporate gamified leaderboards based on vocabulary mastery and streak consistency to drive user engagement.
3. **Advanced Spaced Repetition (SRS)**: Implement a dynamic study algorithm (like SM-2) that determines exactly when to prompt users to review words based on their historic quiz performance.
