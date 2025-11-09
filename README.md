# Quiz App Backend

A comprehensive REST API backend for a quiz application built with Node.js, Express, and MongoDB.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Database Models](#database-models)
- [Middleware](#middleware)
- [Real-time Features](#real-time-features)
- [Running the Server](#running-the-server)

## Features

### Authentication & Authorization
- **JWT-based Authentication**: Secure token-based authentication system
- **User Registration & Login**: 
  - Email/password registration with validation
  - Password hashing using bcrypt
  - Login with JWT token generation
- **Google OAuth Integration**: 
  - One-click sign-in with Google accounts
  - Automatic user creation for OAuth users
  - JWT token generation for OAuth users
  - OAuth provider tracking (local/google)
- **CAS (Central Authentication Service) Integration**:
  - CAS server authentication support
  - Automatic user creation for CAS users
  - JWT token generation for CAS users
  - OAuth provider tracking (local/google/cas)
  - CAS ticket validation and XML response parsing
- **Role-based Access Control**: Admin and User roles with middleware protection
- **Token Refresh**: Endpoint to refresh expired JWT tokens
- **Persistent Login**: Token-based session management across browser sessions
- **Password Security**: Optional password field for OAuth users

### User Management
- **User Profiles**: 
  - Avatar upload and storage
  - Bio and personal information
  - Email and name management
- **Profile Editing**: Update profile information with validation
- **User Statistics**: 
  - Total quizzes attempted
  - Average score across all quizzes
  - Quiz completion history
  - Badge collection
- **Follow/Following System**:
  - Users can follow and unfollow other users
  - Mutual follow tracking (both users must follow each other)
  - Followers and following lists with user details
  - Remove followers functionality
  - User discovery endpoint with search and sorting
  - Mutual followers calculation
- **Badge System**: 
  - Automatic badge awarding based on achievements
  - Multiple badge types (First Quiz, Perfect Score, Quiz Master, etc.)
  - Badge criteria tracking
- **Quiz Streak Tracking**: 
  - Tracks consecutive days of quiz completion
  - Updates `lastQuizDate` on quiz submission
  - Calculates streak based on daily quiz attempts
  - Awards "Streak Master" badge for 7-day streaks

### Quiz Management
- Create, read, update, and delete quizzes
- Quiz metadata (title, description, tags, difficulty, image)
- Quiz participants and subscribers tracking
- Quiz publishing/unpublishing
- Search, filter, and sort quizzes
- Save/bookmark quizzes

### Question Management
- **Question Creation**: Add multiple choice questions to quizzes
- **Question Structure**: 
  - Question text with options
  - Multiple correct answer support
  - Original text storage (before filtering)
- **Banned Keyword Filtering**: 
  - Automatic detection and replacement of banned keywords
  - Replaces offensive content with `***`
  - Stores original text for admin review
  - Applied during question creation and editing
- **Save/Bookmark Questions**: Users can save questions for later review
- **Question Reporting System**: 
  - Users can report inappropriate questions
  - Report tracking with reasons
  - Admin moderation workflow
  - Report count tracking per question

### Analytics & Statistics
- Per-quiz analytics dashboard
- Participant growth over time
- Attempts tracking
- Average score trends
- **Completion Time Analytics**:
  - Histogram showing completion time distribution
  - Average, median, min, and max completion times
  - Time-based performance metrics
  - Completion time tracking per quiz attempt

### Reporting & Moderation
- **Question Reporting System**:
  - Users can report questions during quiz attempts
  - Report reasons and tracking
  - One report per question per user (prevents spam)
  - Report count increment on questions
- **Admin Moderation**:
  - Admin moderation panel (only shows reports for own quizzes)
  - Filter reports by status (pending, fixed, ignored, deleted)
  - Fix reported questions (edit question text and options)
  - Ignore or delete reported questions
  - Auto-expiry for unhandled reports (10 days)
  - Quiz ownership verification for report management

### Categories & Tags
- Predefined categories (Science, Math, History, etc.)
- Custom category creation
- Follow/unfollow categories
- Tag-based quiz filtering

### Chat System
- **REST-based Chat** (simpler alternative to WebSockets):
  - Create chats between users with mutual follow requirement
  - Send and receive messages via REST API
  - Message history with sender information
  - Polling support for real-time updates (frontend)
  - Mutual follow verification before chat creation and message sending
  - Chat list filtered by mutual follow status
- **Socket.io Integration** (also available):
  - Real-time messaging using Socket.io
  - Chat between quiz creators and participants
  - Message history

### Badge System
- **Automatic Badge Awarding**: Badges are awarded automatically on quiz completion
- **Badge Types**:
  - **First Quiz**: Complete your first quiz attempt
  - **Perfect Score**: Achieve 100% on any quiz
  - **Quiz Master**: Complete 10 or more quizzes
  - **Speed Demon**: Complete a quiz in under 5 minutes (300 seconds)
  - **Streak Master**: Complete quizzes for 7 consecutive days
- **Badge Initialization**: Default badges are created on server startup
- **Badge Criteria**: Flexible criteria system for future badge additions
- **Badge Storage**: User badges stored as references in User model
- **Badge Utility Functions**: Helper functions in `utils/badges.js` for awarding logic

### Banned Keywords
- **Global Banned Keywords List**: Centralized list of offensive/inappropriate words
- **Automatic Filtering**: 
  - Filters quiz titles, descriptions, and questions
  - Replaces banned keywords with `***`
  - Preserves original text for admin review
- **Admin Management**: 
  - Add new banned keywords via API
  - View all banned keywords
  - Delete banned keywords
  - Keyword case-insensitive matching
- **Middleware Integration**: Applied automatically to quiz and question creation/editing
- **Utility Functions**: Helper functions in `utils/bannedKeywords.js` for filtering logic

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5.x
- **Database**: MongoDB (MongoDB Atlas)
- **ODM**: Mongoose
- **Authentication**: JWT (jsonwebtoken), bcryptjs, node-cas-authentication, xml2js
- **File Upload**: Multer
- **Real-time**: Socket.io
- **Scheduling**: node-cron
- **Environment**: dotenv

## Project Structure

```
backend/
├── config/
│   └── db.js                 # MongoDB connection configuration
├── controllers/
│   ├── analyticsController.js # Quiz analytics logic
│   ├── authController.js      # Authentication logic
│   ├── bannedKeywordController.js
│   ├── categoryController.js
│   ├── chatController.js      # Chat functionality
│   ├── profileController.js   # User profile management
│   ├── questionController.js # Question CRUD operations
│   ├── quizController.js      # Quiz CRUD operations
│   ├── reportController.js    # Reporting and moderation
│   └── resultController.js    # Quiz results and scoring
├── middleware/
│   ├── authMiddleware.js      # JWT authentication
│   ├── bannedKeywordsMiddleware.js # Keyword filtering
│   ├── roleMiddleware.js      # Role-based access control
│   └── uploadMiddleware.js    # File upload handling
├── models/
│   ├── Analytics.js          # Analytics data model
│   ├── Badge.js              # Badge definitions
│   ├── BannedKeyword.js      # Banned keywords list
│   ├── Category.js           # Category model
│   ├── Chat.js               # Chat and messages
│   ├── Question.js           # Question model
│   ├── Quiz.js               # Quiz model
│   ├── Report.js             # Report model
│   ├── Result.js             # Quiz attempt results
│   └── User.js               # User model
├── routes/
│   ├── analyticsRoutes.js
│   ├── authRoutes.js
│   ├── bannedKeywordRoutes.js
│   ├── categoryRoutes.js
│   ├── chatRoutes.js
│   ├── profileRoutes.js
│   ├── questionRoutes.js
│   ├── quizRoutes.js
│   └── reportRoutes.js
├── utils/
│   ├── badges.js             # Badge awarding logic
│   ├── bannedKeywords.js     # Keyword filtering utilities
│   └── generateToken.js      # JWT token generation
├── uploads/                  # Uploaded images directory
├── server.js                 # Main server file
├── package.json
└── .env                      # Environment variables
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher recommended)
- MongoDB Atlas account or local MongoDB instance
- npm or yarn

### Installation

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```bash
   cp .env.example .env  # If you have an example file
   # Or create manually
   ```

4. **Configure environment variables** (see [Environment Variables](#environment-variables))

5. **Start the server:**
   ```bash
   npm start
   # Or for development with auto-reload:
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Server Configuration
PORT=5000
FRONTEND_URL=http://localhost:3000

# MongoDB Connection
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# JWT Secret (use a strong, random string in production)
JWT_SECRET=your_super_secret_jwt_key_here

# Google OAuth (Optional - for Google Sign-In)
# Note: Frontend uses REACT_APP_GOOGLE_CLIENT_ID
# Backend only needs these if server-side OAuth validation is required
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# CAS Authentication (Optional - for CAS/SSO login)
CAS_URL=https://cas.example.edu/cas
CAS_VERSION=2.0
CAS_EMAIL_DOMAIN=example.edu
# BACKEND_URL is required for CAS - the CAS server must be able to reach this URL
# For local development, use a public URL or ngrok/tunneling service
# For production, use your production backend URL
BACKEND_URL=http://localhost:5000
```

### Environment Variables Explained

- **PORT**: Server port number (default: 5000)
- **FRONTEND_URL**: Frontend application URL for CORS configuration
- **MONGO_URI**: MongoDB connection string (MongoDB Atlas or local instance)
- **JWT_SECRET**: Secret key for JWT token signing and verification
  - **Important**: Use a strong, random string in production
  - Generate using: `openssl rand -base64 32`
- **GOOGLE_CLIENT_ID**: Google OAuth Client ID (optional, for server-side validation)
- **GOOGLE_CLIENT_SECRET**: Google OAuth Client Secret (optional, for server-side validation)
- **CAS_URL**: CAS server URL (optional, for CAS/SSO authentication)
  - Example: `https://cas.example.edu/cas`
- **CAS_VERSION**: CAS protocol version (optional, default: "2.0")
- **CAS_EMAIL_DOMAIN**: Email domain for CAS users if email not provided by CAS (optional)
  - Example: `example.edu` (will create emails like `username@example.edu`)
- **BACKEND_URL**: Backend URL that CAS server can reach (required for CAS)
  - **Important**: The CAS server must be able to redirect to this URL after authentication
  - For local development: Use `http://localhost:5000` or a public URL (ngrok/tunneling)
  - For production: Use your production backend URL (e.g., `https://api.yourdomain.com`)
  - The callback endpoint will be: `{BACKEND_URL}/api/auth/cas/callback`

### Getting MongoDB Connection String

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a cluster (or use existing)
3. Go to **Connect** → **Connect your application**
4. Copy the connection string
5. Replace `<password>` with your database password
6. Replace `<database>` with your database name

## API Endpoints

### Authentication (`/api/auth`)

- `POST /api/auth/register` - Register a new user
  - Body: `{ name, email, password, role? }`
  - Returns: `{ user, token }`
- `POST /api/auth/login` - Login user
  - Body: `{ email, password }`
  - Returns: `{ user, token }`
- `POST /api/auth/google` - Google OAuth login
  - Body: `{ googleId, email, name, avatar? }`
  - Returns: `{ user, token }`
  - Creates user if doesn't exist
- `GET /api/auth/cas/login` - Initiate CAS login (redirects to CAS server)
- `GET /api/auth/cas/callback` - CAS callback handler (validates ticket and creates/updates user)
  - Query params: `ticket` (from CAS server)
  - Redirects to frontend with token on success
- `POST /api/auth/cas` - CAS login endpoint (alternative approach)
  - Body: `{ casId, email, name, attributes? }`
  - Returns: `{ user, token }`
- `POST /api/auth/refresh` - Refresh JWT token
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ token }`
  - Requires valid (possibly expired) token

### Quizzes (`/api/quizzes`)

- `GET /api/quizzes` - Get all published quizzes (protected)
- `GET /api/quizzes/explore` - Explore quizzes with search/filter/sort (public)
- `GET /api/quizzes/saved` - Get user's saved quizzes (protected)
- `GET /api/quizzes/:quizId` - Get single quiz with stats
- `POST /api/quizzes` - Create new quiz (admin only)
- `PUT /api/quizzes/:quizId` - Update quiz (creator/admin)
- `DELETE /api/quizzes/:quizId` - Delete quiz (admin only)
- `POST /api/quizzes/:quizId/subscribe` - Subscribe to quiz (protected)
- `POST /api/quizzes/:quizId/save` - Save/bookmark quiz (protected)
- `POST /api/quizzes/:quizId/submit` - Submit quiz attempt (protected)
  - Body: `{ answers: [{ questionId, selectedOption }], timeTaken, startTime }`
  - Returns: `{ score, total, percentage, timeTaken, awardedBadges }`
- `GET /api/quizzes/:quizId/results` - Get quiz results (admin only)

### Questions (`/api/quizzes/:quizId/questions`)

- `GET /api/quizzes/:quizId/questions` - Get all questions for a quiz
- `POST /api/quizzes/:quizId/questions` - Add question to quiz (admin only)

### Questions (`/api/questions`)

- `POST /api/questions/:questionId/save` - Save/bookmark question (protected)
- `GET /api/questions/saved` - Get saved questions (protected)

### Profile (`/api/profile`)

- `GET /api/profile/:userId` - Get user profile
- `PUT /api/profile/:userId` - Update profile (self/admin)
- `GET /api/profile/:userId/quizzes` - Get user's quiz attempts
- `GET /api/profile/:userId/badges` - Get user badges
- `POST /api/profile/:userId/follow-category` - Follow/unfollow category
- `GET /api/profile/discover` - Discover/search users (protected)
  - Query params: `search`, `sortBy` (followers/name/recent), `limit`
  - Returns: List of users with follow status and mutual followers
- `POST /api/profile/:userId/follow` - Follow/unfollow user (protected)
  - Returns: `{ isFollowing, message }`
- `GET /api/profile/:userId/followers` - Get user's followers list (protected)
  - Returns: `{ followers: [], canRemove: boolean }`
- `GET /api/profile/:userId/following` - Get user's following list (protected)
  - Returns: `{ following: [], canUnfollow: boolean }`
- `DELETE /api/profile/:userId/followers/:followerId` - Remove follower (protected)

### Analytics (`/api/analytics`)

- `GET /api/analytics/quiz/:quizId` - Get quiz analytics overview
- `GET /api/analytics/quiz/:quizId/participants` - Participant growth data
- `GET /api/analytics/quiz/:quizId/attempts` - Attempts over time
- `GET /api/analytics/quiz/:quizId/scores` - Score trends
- `GET /api/analytics/quiz/:quizId/completion-time` - Completion time analytics (admin)
  - Returns: `{ histogram: [], stats: { averageTime, medianTime, minTime, maxTime, totalAttempts } }`

### Reports (`/api/reports`)

- `POST /api/reports` - Create a report (protected)
- `GET /api/reports` - Get all reports (admin only)
- `PUT /api/reports/:reportId/fix` - Fix reported question (admin)
- `PUT /api/reports/:reportId/ignore` - Ignore report (admin)
- `DELETE /api/reports/:reportId` - Delete question (admin)
- `POST /api/reports/expire` - Auto-expire old reports (admin)

### Chat (`/api/chat`)

- `GET /api/chat` - Get user's chats (protected)
  - Returns only chats where mutual follow exists
  - Filters out chats where mutual follow is broken
- `POST /api/chat` - Create/start chat (protected)
  - Body: `{ participantId }`
  - Requires mutual follow (both users must follow each other)
  - Returns: Chat object with participants
- `GET /api/chat/:chatId/messages` - Get chat messages (protected)
  - Returns messages sorted by timestamp (oldest first)
  - Populates sender information
- `POST /api/chat/:chatId/messages` - Send message (protected)
  - Body: `{ text }`
  - Verifies mutual follow before allowing message
  - Returns: `{ message: 'Message sent successfully', messageData: {...} }`

### Categories (`/api/categories`)

- `GET /api/categories` - Get all categories (public)
- `POST /api/categories` - Create custom category (protected)

### Banned Keywords (`/api/banned-keywords`)

- `GET /api/banned-keywords` - Get banned keywords (admin)
- `POST /api/banned-keywords` - Add banned keyword (admin)
- `DELETE /api/banned-keywords/:keywordId` - Delete banned keyword (admin)

## Database Models

### User
- `name`, `email`, `password`
- `role` (user/admin)
- `avatar`, `bio`
- `badges[]`, `followedCategories[]`
- `savedQuizzes[]`, `savedQuestions[]`
- `googleId`, `casId`, `oauthProvider` (local/google/cas)
- `lastQuizDate`, `quizStreak`
- `followers[]`, `following[]` (User references)

### Quiz
- `title`, `description`
- `createdBy` (User reference)
- `tags[]`, `difficulty` (easy/medium/hard)
- `imageUrl`
- `participants[]`, `subscribers[]`
- `isPublished`
- `questions[]` (embedded)

### Question
- `quiz` (Quiz reference)
- `questionText`, `originalText`
- `options[]` (with isCorrect flag)
- `reportCount`

### Result
- `quizId` (Quiz reference)
- `userId` (User reference)
- `username` (cached for performance)
- `score` (number of correct answers)
- `total` (total number of questions)
- `timeTaken` (completion time in seconds)
- `startTime` (ISO timestamp of quiz start)
- `attemptedAt` (timestamp of attempt)
- `createdAt`, `updatedAt` (timestamps)

### Report
- `questionId`, `reportedBy`
- `reason`, `status` (pending/ignored/fixed/deleted)
- `resolvedAt`, `expiresAt`

### Badge
- `name`, `description`, `icon`
- `criteria` (type and value)

### Category
- `name`, `description`
- `followers[]`
- `isPredefined`
- `createdBy`

### Chat
- `participants[]` (User references, exactly 2 users)
- `messages[]` (embedded with sender, text, timestamp)
- `lastMessageAt`
- **Mutual Follow Requirement**: Both participants must follow each other to create/send messages

### Analytics
- `quizId`, `date`
- `participantsCount`, `attemptsCount`, `averageScore`

### BannedKeyword
- `word` (lowercase, unique)
- `addedBy`

## Middleware

### Authentication Middleware (`protect`)
- Validates JWT token from Authorization header
- Adds user info to `req.user`
- Returns 401 if token is missing/invalid

### Role Middleware (`allowRoles`)
- Checks if user has required role
- Used for admin-only routes
- Returns 403 if unauthorized

### Banned Keywords Middleware
- Filters banned keywords from request body
- Replaces offensive content with `***`
- Applied to question and quiz creation/editing

### Upload Middleware
- Handles file uploads using Multer
- Supports image uploads (quiz images, avatars)
- 5MB file size limit
- Stores files in `uploads/` directory

## Real-time Features

### Socket.io Integration

The server uses Socket.io for real-time chat functionality:

- **Connection**: Clients connect to the server
- **Join Chat**: `join-chat` event with `chatId`
- **Send Message**: `send-message` event with `{chatId, senderId, text}`
- **New Message**: Server emits `new-message` to all participants

### Cron Jobs

- **Auto-expire Reports**: Runs daily at midnight (00:00)
  - Automatically marks pending reports older than 10 days as "ignored"
  - Updates report status and `resolvedAt` timestamp
  - Logs expired report count
  - Can be manually triggered via `/api/reports/expire` endpoint

## Running the Server

### Development Mode

```bash
npm run dev
```

Uses nodemon for auto-reload on file changes.

### Production Mode

```bash
npm start
```

### Server Behavior

- Server waits for MongoDB connection before starting
- Creates `uploads/` directory if it doesn't exist
- Initializes default badges and categories on startup
- Serves uploaded files from `/uploads` route
- Runs on port 5000 by default (configurable via PORT env var)

## Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

Error responses include a `message` field with error details.

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Role-based access control
- Banned keyword filtering
- Input validation
- File upload restrictions (type and size)

## Quiz Submission & Scoring

### Quiz Attempt Flow
1. User starts quiz → Questions are fetched
2. User selects answers → Answers stored locally (frontend)
3. User submits quiz → Answers sent to `/api/quizzes/:quizId/submit`
4. Server calculates score:
   - Compares user answers with correct answers
   - Calculates percentage score
   - Tracks time taken (from start to submit)
5. Server updates:
   - Creates Result record
   - Adds user to quiz participants (if not already)
   - Awards badges based on performance
   - Updates quiz streak (if applicable)
6. Returns result with score, badges earned, and statistics

### Time Tracking
- **Quiz Timer**: Frontend tracks elapsed time during quiz attempt
- Time is calculated from `startTime` to submission
- Stored in seconds in the Result model (`timeTaken`)
- Used for "Speed Demon" badge (under 5 minutes)
- Displayed in quiz results and analytics
- **Completion Time Analytics**: Histogram and statistics for completion times

### Badge Awarding
Badges are automatically checked and awarded after quiz submission:
- Checks all badge criteria
- Awards badges if conditions are met
- Returns awarded badges in quiz result response
- Updates user's badge collection

### Quiz Streak
- Streak is calculated based on `lastQuizDate` and current date
- If quiz is completed on consecutive days, streak increases
- If gap of more than 1 day, streak resets to 1
- Streak is updated after each quiz submission
- Used for "Streak Master" badge (7-day streak)

## Google OAuth Implementation

### OAuth Flow
1. Frontend sends Google JWT credential to `/api/auth/google`
2. Backend decodes JWT and extracts user information:
   - `googleId` (subject)
   - `email`
   - `name`
   - `avatar` (picture URL)
3. Backend checks if user exists:
   - If exists: Updates OAuth info and returns user
   - If doesn't exist: Creates new user with OAuth provider
4. Backend generates JWT token and returns to frontend
5. Frontend stores token and authenticates user

### User Creation for OAuth
- Password field is optional for OAuth users
- `oauthProvider` set to "google"
- `googleId` stored for future OAuth logins
- User can later set password if desired (not implemented)

## Notes

- **MongoDB Connection**: 
  - Connection string must be valid and cluster must be running
  - IP address must be whitelisted in MongoDB Atlas (or use 0.0.0.0/0 for testing)
  - Server waits for database connection before starting
- **Data Initialization**: 
  - Default badges are automatically created on first startup
  - Default categories are automatically created on first startup
  - Initialization runs after database connection is established
- **File Uploads**: 
  - Uploaded images are served statically from `/uploads` route
  - `uploads/` directory is created automatically if it doesn't exist
  - File size limit: 5MB
  - Supported formats: jpg, jpeg, png, gif
- **Socket.io**: 
  - CORS is configured for frontend URL
  - Real-time chat functionality ready
  - Connection requires authentication
- **Security**: 
  - Passwords are hashed using bcrypt (10 rounds)
  - JWT tokens expire (default: 7 days, configurable)
  - Banned keywords are filtered automatically
  - File uploads are validated for type and size
- **Performance**: 
  - Quiz statistics are calculated on-the-fly (can be optimized with caching)
  - Analytics data can be aggregated and stored for better performance
  - Database indexes recommended on frequently queried fields
