# Quiz App — Complete Project Plan

---

## 1. Recommended Base Repository

**Primary base:** `alii13/examination-management-system`
- URL: https://github.com/alii13/examination-management-system
- Stack: MongoDB, Express, React, Node.js (MERN)
- Why: Has class-based student assignment, teacher/student roles, JWT auth, and MCQ support out of the box.

**Anti-cheat reference:** `shahhilag4/Proctored_Based_Exam_System`
- URL: https://github.com/shahhilag4/Proctored_Based_Exam_System
- Why: Has fullscreen enforcement, tab-switch detection, and keyboard shortcut blocking — borrow these patterns.

**Strategy:** Fork `alii13/examination-management-system`, then port the anti-cheat layer from the proctored system on top.

---

## 2. Tech Stack (Final Decision)

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React 18 + Vite | Fast dev, great ecosystem |
| Styling | Tailwind CSS | Rapid UI, no CSS bloat |
| State | Zustand or Redux Toolkit | Lightweight global state |
| Backend | Node.js + Express | MERN convention |
| Database | MongoDB + Mongoose | Flexible schema, easy to scale |
| Auth | JWT (access + refresh tokens) | Stateless, standard |
| File uploads | Multer + ExcelJS | Excel import/export |
| Excel parsing | SheetJS (xlsx) | Bulk student import |
| HTTP client | Axios | Frontend API calls |
| Email | Nodemailer | First-login password setup |

---

## 3. Project Folder Structure

```
quiz-app/
├── client/                         # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── auth/               # Login, first-time password change
│   │   │   ├── teacher/            # All teacher views
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── ClassDetail.jsx
│   │   │   │   ├── StudentManagement.jsx
│   │   │   │   ├── QuizSettings.jsx
│   │   │   │   └── ManageQuestions.jsx
│   │   │   └── student/            # All student views
│   │   │       ├── Dashboard.jsx
│   │   │       └── ExamRoom.jsx    # The actual quiz with anti-cheat
│   │   ├── components/
│   │   │   ├── ExamGuard.jsx       # Anti-cheat wrapper component
│   │   │   ├── FullscreenEnforcer.jsx
│   │   │   └── WarningModal.jsx
│   │   ├── hooks/
│   │   │   └── useAntiCheat.js     # Custom hook for all cheat detection
│   │   └── utils/
│   │       └── excelTemplate.js    # Student import/export helpers
│
├── server/                         # Express backend
│   ├── models/
│   │   ├── User.js
│   │   ├── Class.js
│   │   ├── Quiz.js
│   │   ├── Question.js
│   │   ├── Attempt.js
│   │   └── ViolationLog.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── teacher.js
│   │   ├── student.js
│   │   ├── quiz.js
│   │   ├── questions.js
│   │   └── classes.js
│   ├── middleware/
│   │   ├── auth.js                 # JWT verification
│   │   └── roleGuard.js            # Teacher/student role check
│   ├── controllers/
│   └── utils/
│       ├── excelParser.js          # Bulk student import logic
│       └── mailer.js               # First-login email
└── templates/
    ├── student-import-template.xlsx
    └── question-bulk-upload-template.json
```

---

## 4. Database Schema (MongoDB / Mongoose)

### User
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string (unique)",
  "registrationNumber": "string (unique, students only)",
  "passwordHash": "string",
  "role": "teacher | student",
  "isFirstLogin": "boolean (default: true)",
  "classId": "ObjectId (ref: Class)",
  "createdAt": "Date"
}
```

### Class
```json
{
  "_id": "ObjectId",
  "name": "string (e.g. '10th Grade - Section A')",
  "teacherId": "ObjectId (ref: User)",
  "quizId": "ObjectId (ref: Quiz)",
  "students": ["ObjectId (ref: User)"],
  "createdAt": "Date"
}
```

### Quiz
```json
{
  "_id": "ObjectId",
  "classId": "ObjectId (ref: Class)",
  "title": "string",
  "description": "string",
  "settings": {
    "timeLimitPerQuestion": "number (seconds, 0 = no limit)",
    "totalTimeLimit": "number (minutes, 0 = no limit)",
    "shuffleQuestions": "boolean",
    "shuffleOptions": "boolean",
    "allowMultipleSelect": "boolean",
    "maxViolations": "number (default: 3)"
  },
  "isActive": "boolean",
  "questions": ["ObjectId (ref: Question)"],
  "createdAt": "Date"
}
```

### Question
```json
{
  "_id": "ObjectId",
  "quizId": "ObjectId (ref: Quiz)",
  "text": "string",
  "type": "single | multiple",
  "options": [
    { "label": "A", "text": "string" },
    { "label": "B", "text": "string" },
    { "label": "C", "text": "string" },
    { "label": "D", "text": "string" }
  ],
  "correctOptions": ["A", "C"],
  "marks": "number (default: 1)",
  "order": "number"
}
```

### Attempt
```json
{
  "_id": "ObjectId",
  "studentId": "ObjectId (ref: User)",
  "quizId": "ObjectId (ref: Quiz)",
  "classId": "ObjectId (ref: Class)",
  "status": "not_started | in_progress | submitted | force_submitted",
  "startedAt": "Date",
  "submittedAt": "Date",
  "answers": [
    {
      "questionId": "ObjectId",
      "selectedOptions": ["A"],
      "isCorrect": "boolean",
      "marksAwarded": "number"
    }
  ],
  "score": "number",
  "totalMarks": "number",
  "percentage": "number",
  "violationCount": "number (default: 0)",
  "resetBy": "ObjectId (teacher who reset, nullable)",
  "resetAt": "Date (nullable)"
}
```

### ViolationLog
```json
{
  "_id": "ObjectId",
  "attemptId": "ObjectId (ref: Attempt)",
  "studentId": "ObjectId (ref: User)",
  "type": "tab_switch | fullscreen_exit | right_click | copy_attempt | keyboard_shortcut",
  "timestamp": "Date",
  "count": "number"
}
```

---

## 5. API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/login | Login (teacher or student) |
| POST | /api/auth/change-password | First-time password change |
| POST | /api/auth/logout | Invalidate refresh token |

### Teacher — Classes
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/classes | Get all classes for logged-in teacher |
| POST | /api/classes | Create a new class |
| GET | /api/classes/:classId | Get class details + quiz + students |
| PUT | /api/classes/:classId | Edit class |
| DELETE | /api/classes/:classId | Delete class |

### Teacher — Students
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/classes/:classId/students | List students with attempt status |
| POST | /api/classes/:classId/students | Add a single student |
| PUT | /api/classes/:classId/students/:studentId | Edit student details |
| DELETE | /api/classes/:classId/students/:studentId | Remove student |
| POST | /api/classes/:classId/students/import | Bulk import from Excel |
| GET | /api/classes/:classId/students/export | Export students to Excel |
| POST | /api/classes/:classId/students/:studentId/reset-attempt | Reset exam attempt |

### Teacher — Questions
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/quiz/:quizId/questions | Get all questions |
| POST | /api/quiz/:quizId/questions | Add a single question |
| PUT | /api/quiz/:quizId/questions/:questionId | Edit a question |
| DELETE | /api/quiz/:quizId/questions/:questionId | Delete a question |
| POST | /api/quiz/:quizId/questions/bulk | Bulk upload from JSON |

### Teacher — Quiz Settings
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/quiz/:quizId/settings | Get quiz settings |
| PUT | /api/quiz/:quizId/settings | Update quiz settings |
| PUT | /api/quiz/:quizId/toggle | Activate / deactivate quiz |

### Student
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/student/quiz | Get quiz info for student's class |
| POST | /api/student/quiz/start | Start the exam (creates Attempt) |
| POST | /api/student/quiz/submit | Submit the exam |
| POST | /api/student/quiz/violation | Log a cheat violation |
| GET | /api/student/result | Get result after submission |

---

## 6. Authentication Flow

### Student Login
1. Student enters Registration Number + Email + Password.
2. Server checks `isFirstLogin` flag.
3. If `true` → redirect to "Change Password" page before proceeding.
4. On password change, `isFirstLogin` is set to `false`.
5. JWT access token (15 min) + refresh token (7 days) issued.
6. Stored in `httpOnly` cookies (not localStorage — prevents XSS).

### Teacher Login
1. Teacher enters Email + Password.
2. JWT issued with `role: teacher`.
3. Redirected to Teacher Dashboard (class list).

---

## 7. Student Exam Flow (Step by Step)

```
Login → Dashboard → Click "Start Exam"
  → Pre-exam checklist screen (rules shown)
  → Click "Begin" → fullscreen requested
  → Exam Room loads (anti-cheat activated)
  → Answer questions (with timer if set)
  → Click "Submit" OR auto-submit on time/violations
  → Result screen
```

---

## 8. Anti-Cheat System (Detailed)

This is the most important part to build carefully. All of this lives in `useAntiCheat.js` and `ExamGuard.jsx`.

### 8.1 Fullscreen Enforcement
```javascript
// On exam start:
document.documentElement.requestFullscreen();

// Detect exit:
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) {
    triggerViolation('fullscreen_exit');
  }
});
```
- On violation: show warning modal, increment counter, call `/api/student/quiz/violation`.
- At 3 violations: auto-submit the exam.

### 8.2 Tab / Window Switching
```javascript
document.addEventListener('visibilitychange', () => {
  if (document.hidden) triggerViolation('tab_switch');
});

window.addEventListener('blur', () => {
  triggerViolation('tab_switch');
});
```

### 8.3 Right-Click Block
```javascript
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  triggerViolation('right_click');
});
```

### 8.4 Copy / Paste / Select Block
```javascript
document.addEventListener('copy', (e) => e.preventDefault());
document.addEventListener('cut', (e) => e.preventDefault());
document.addEventListener('paste', (e) => e.preventDefault());
document.addEventListener('selectstart', (e) => e.preventDefault());
```
CSS addition:
```css
.exam-content {
  user-select: none;
  -webkit-user-select: none;
}
```

### 8.5 DevTools / Keyboard Shortcut Block
```javascript
document.addEventListener('keydown', (e) => {
  const blocked = [
    e.key === 'F12',
    e.ctrlKey && e.shiftKey && e.key === 'I',   // DevTools
    e.ctrlKey && e.shiftKey && e.key === 'J',   // Console
    e.ctrlKey && e.key === 'u',                  // View source
    e.ctrlKey && e.key === 'c',                  // Copy
    e.ctrlKey && e.key === 'v',                  // Paste
    e.ctrlKey && e.key === 'a',                  // Select all
    e.altKey && e.key === 'Tab',                 // Alt+Tab
    e.metaKey,                                   // Windows/Mac key
  ];
  if (blocked.some(Boolean)) {
    e.preventDefault();
    triggerViolation('keyboard_shortcut');
  }
});
```

### 8.6 Screenshot Prevention
> Note: It is technically impossible to fully prevent screenshots via browser JavaScript because OS-level screenshot tools (Windows Snipping Tool, macOS Cmd+Shift+3) operate outside the browser's reach. However, you can apply these partial mitigations:

- CSS: `filter: blur(0)` toggle — blur content when `document.hidden` is true.
- Print block: `@media print { body { display: none; } }` prevents Ctrl+P saving.
- Watermark the exam page with the student's name and registration number using a semi-transparent overlay, so if a screenshot is taken, it's traceable.

### 8.7 Violation Counter and Warning Modal
```
Violation 1 → Warning: "You have 2 warnings remaining. The test will auto-submit."
Violation 2 → Warning: "Final warning! One more violation will submit your test."
Violation 3 → Auto-submit exam immediately.
```

---

## 9. Feature Modules — Implementation Details

### 9.1 Teacher Dashboard
- After login: grid of class cards (class name, number of students, quiz status: Active/Inactive).
- Click a class → Class Detail page with 4 tabs:
  1. Overview / Quiz Preview
  2. Student Management
  3. Manage Questions
  4. Quiz Settings

### 9.2 Student Management Tab

**Student table columns:**
| Registration No. | Name | Email | Exam Status | Score | Actions |
|---|---|---|---|---|---|
| REG001 | Ali Khan | ali@x.com | Completed | 85% | View / Reset |
| REG002 | Sara | sara@x.com | Not Started | — | Edit / Remove |
| REG003 | John | john@x.com | In Progress | — | Reset |

**Exam Status values:**
- `Not Started` — student has never begun
- `In Progress` — exam started, not submitted (possible network drop)
- `Completed` — submitted, scored
- `Force Submitted` — submitted by violation count

**Reset Attempt:** Teacher clicks Reset → confirmation modal → backend sets attempt `status: not_started`, clears answers and score, logs `resetBy` and `resetAt`.

**Bulk Import (Excel):**
- Download template button → generates `.xlsx` with columns: `Registration Number | Name | Email | Password (initial)`
- Upload `.xlsx` → server uses `SheetJS` to parse rows → creates User records → assigns to class.
- Duplicate registration numbers are skipped and reported back.

**Export:**
- Export button → downloads `.xlsx` with all students + their scores and exam status.

### 9.3 Manage Questions Tab

**Question list view:**
- Sortable list of all questions with question text preview, type badge (Single / Multiple), and marks.
- Edit button opens inline edit form.
- Delete with confirmation.

**Add Single Question form fields:**
- Question text (textarea)
- Type: Single Select / Multiple Select (radio toggle)
- Options: 4 fields (A, B, C, D) — dynamic "add option" button for more
- Mark correct option(s): checkbox per option
- Marks value (number input, default 1)

**Bulk Upload via JSON:**
- Download JSON template button.
- Upload `.json` file → validated and inserted.

JSON template format:
```json
[
  {
    "text": "What is the capital of France?",
    "type": "single",
    "options": [
      { "label": "A", "text": "Berlin" },
      { "label": "B", "text": "Paris" },
      { "label": "C", "text": "Madrid" },
      { "label": "D", "text": "Rome" }
    ],
    "correctOptions": ["B"],
    "marks": 1
  },
  {
    "text": "Which of the following are primary colors?",
    "type": "multiple",
    "options": [
      { "label": "A", "text": "Red" },
      { "label": "B", "text": "Green" },
      { "label": "C", "text": "Blue" },
      { "label": "D", "text": "Yellow" }
    ],
    "correctOptions": ["A", "C"],
    "marks": 2
  }
]
```

### 9.4 Quiz Settings Tab

| Setting | Type | Description |
|---|---|---|
| Quiz Title | Text | Name shown to students |
| Time per Question | Number (seconds) | 0 = unlimited |
| Total Quiz Time | Number (minutes) | 0 = unlimited |
| Shuffle Questions | Toggle | Randomize question order per student |
| Shuffle Options | Toggle | Randomize A/B/C/D order |
| Max Violations | Number (1–5) | Violations before auto-submit (default 3) |
| Quiz Active | Toggle | Enable / disable exam for students |

---

## 10. Student-Side Pages

### 10.1 Student Dashboard
- Welcome message with name and registration number.
- Quiz card showing: title, subject, number of questions, time limit.
- Status: "Not Attempted" → green "Start Exam" button.
- Status: "Completed" → grey button disabled, score shown.
- Status: "In Progress" → yellow "Resume Exam" button (teacher must reset if needed).

### 10.2 Pre-Exam Rules Screen
- List of exam rules (no copy, no tab switch, fullscreen required, 3-violation limit).
- Checkbox: "I have read and agree to the exam rules."
- "Begin Exam" button (disabled until checkbox checked).

### 10.3 Exam Room
- Fullscreen mode activated.
- Header: quiz title + countdown timer (total time or per-question).
- Question card: question number, question text, options as radio (single) or checkbox (multiple).
- Navigation: Previous / Next buttons + question number grid (quick jump).
- Questions answered shown in green in the grid; unanswered in grey.
- "Submit Exam" button with confirmation modal.

### 10.4 Result Screen
- Score: e.g. "You scored 18 / 25 (72%)".
- Pass/Fail indicator (if teacher sets a passing mark).
- Question-by-question review: student's answer vs correct answer with colour coding.

---

## 11. Development Phases

### Phase 1 — Foundation (Week 1–2)
- Fork and clean up `alii13/examination-management-system`.
- Set up Vite + React + Tailwind on the frontend.
- Set up MongoDB Atlas and Express server.
- Implement JWT auth: teacher login, student login, first-login password change.
- Build User, Class, Quiz, Question, Attempt models.

### Phase 2 — Teacher Features (Week 3–4)
- Teacher dashboard with class cards.
- Class detail page with 4 tabs.
- Full CRUD for students (add, edit, remove, view).
- Full CRUD for questions (add, edit, delete, view).
- Quiz settings page.
- Bulk student import via Excel (SheetJS).
- Bulk question upload via JSON.
- Export students + marks to Excel.

### Phase 3 — Exam Engine (Week 5–6)
- Student dashboard.
- Pre-exam rules screen.
- Exam Room component with question navigation, timer, and answer state.
- Submit exam → auto-grade → store result.
- Result screen with review.
- One-attempt enforcement (check on start, block if already completed).

### Phase 4 — Anti-Cheat Layer (Week 7)
- Fullscreen enforcement on exam start.
- Tab switch detection (visibilitychange + blur).
- Right-click block.
- Copy/paste/select block.
- Keyboard shortcut block (F12, Ctrl+Shift+I, etc.).
- Violation counter with warning modal.
- Auto-submit on 3 violations.
- Student name watermark on exam page.
- ViolationLog stored to DB.

### Phase 5 — Polish and Testing (Week 8)
- Teacher can view violation logs per student.
- Responsive design (tablet and desktop).
- Loading states, error handling, form validation.
- Reset attempt feature for teachers.
- Security review: rate limiting, input sanitization, role guard on all routes.
- End-to-end testing: full student exam flow, teacher management flow.

---

## 12. Key Security Considerations

- All exam answers submitted server-side — answers never stored only in localStorage.
- Correct answers never sent to the frontend. Grading is 100% server-side.
- JWT stored in `httpOnly` cookies (not localStorage) to prevent XSS theft.
- Role middleware on all routes: teacher routes reject student tokens and vice versa.
- Rate limiting on login endpoint (express-rate-limit) to prevent brute force.
- Input sanitization on all user inputs (express-validator).
- Exam start endpoint checks: is quiz active? Has student already attempted?

---

## 13. Excel Import Template (Column Reference)

File: `student-import-template.xlsx`

| Column | Field | Required | Notes |
|---|---|---|---|
| A | Registration Number | Yes | Must be unique |
| B | Full Name | Yes | |
| C | Email | Yes | Must be unique |
| D | Initial Password | Yes | Student must change on first login |

---

## 14. Getting Started (Commands)

```bash
# Clone the base repo
git clone https://github.com/alii13/examination-management-system.git quiz-app
cd quiz-app

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install

# Set up environment variables (server/.env)
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret
CLIENT_URL=http://localhost:5173
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Run both in development
# Terminal 1:
cd server && npm run dev

# Terminal 2:
cd client && npm run dev
```

---

## 15. Summary of What Needs to Be Built vs What the Base Repo Gives You

| Feature | Base Repo Has It | Needs to Be Built |
|---|---|---|
| JWT Auth (teacher + student) | Partial | Extend with refresh tokens, first-login flag |
| Class management | Yes | Minor tweaks |
| MCQ questions | Yes | Add bulk JSON upload, edit feature |
| Timer | Partial | Add per-question timer |
| Student management | Partial | Add bulk Excel import/export, reset attempt |
| One-attempt enforcement | No | Build from scratch |
| Anti-cheat (fullscreen, tab, copy) | No | Build from scratch |
| Violation counter + auto-submit | No | Build from scratch |
| Quiz settings panel | No | Build from scratch |
| Result screen with review | Partial | Enhance with per-question review |
| Student watermark | No | Build from scratch |
| Excel import/export | No | Build from scratch |
| Bulk JSON question upload | No | Build from scratch |
