# Quiz App - Implementation Plan

## Goal Description
Build a comprehensive MERN-stack Quiz Application centered around proctored, high-integrity online examinations. The project will synthesize a solid foundational structure (based on `alii13/examination-management-system`) with advanced anti-cheat measures (inspired by `shahhilag4/Proctored_Based_Exam_System`). Core objectives include enabling teachers to manage classes, uploading questions/students in bulk, providing students with a structured exam process, and rigorously capturing any cheating attempts.

## Proposed Changes

> [!NOTE] 
> This app heavily revolves around the MERN stack. We will use a Monorepo-like layout (one `client/` and one `server/` directory, along with a `templates/` folder).

### 1. Foundation & Backend Structure
Set up the `server` folder with Node, Express, and MongoDB.
- Configure auth routing with secure JWT (access and refresh tokens).
- Add middleware: Role Guard (Teacher vs Student checks), Auth verifier.
- Define Mongoose Models (User, Class, Quiz, Question, Attempt, ViolationLog).

### 2. Frontend Structure & Routing (React + Vite + Tailwind)
Set up the `client` folder.
- Configure standardized `axios` instances with cookie-based interceptors.
- Create multi-role routing architecture (`/teacher/*` vs `/student/*`).

### 3. Teacher Dashboard & Administration
- Develop Teacher Interface components (`Dashboard`, `ClassDetail`, `StudentManagement`, `QuizSettings`, `ManageQuestions`).
- Implement Excel Parsing using `xlsx` (SheetJS) to enable bulk student imports & exports.
- Implement JSON loading utility for bulk question additions.
- Build logic to allow resetting of student attempts (for network failure scenarios).

### 4. Exam Engine & Student View
- Develop Student UI: Dashboard to preview exams, Rule agreement page, and the actual Exam view.
- Exam logic must run server-side grading upon submission.
- Ensure state continuity (preventing navigating away and back to reset timers).
- Create a results dashboard where students review their evaluated questions.

### 5. Anti-Cheat Proctored Layer (Critical)
- Design the `useAntiCheat.js` custom React hook.
- Implement rules enforcing Fullscreen API natively.
- Tap into `onvisibilitychange` and `onblur` window objects.
- Create standard event-preventions against context menus (`contextmenu`), text selections (`selectstart`), clipboards(`copy/cut/paste`), and DevTools shortcuts (e.g., F12, Ctrl+Shift+I).
- Build the logic connecting violations to the `ViolationLog` and forcing an auto-submit sequentially after max allowed events.
- Emplace trace parameters on screen using CSS (`blur` transitions, watermark overlays, `print` media blocks).

## Verification Plan

### Automated / API Verification
- Unit test endpoints (especially Student submission/grading logic) utilizing `Postman`/`curl` or standard automated tests.
- Secure Routes testing to firmly evaluate whether students are restricted from accessing teacher endpoints.

### Manual Verification
1. **Teacher Flow Validation:**
   - Log in as a Teacher.
   - Bulk upload a `.xlsx` test document for students.
   - Bulk upload a `.json` format representing Quiz Questions.
   - Preview configuration and Start Quiz successfully.
2. **Student Flow & Anti-Cheat Validation:**
   - Log in as an imported Student.
   - Begin the Exam, noting mandatory fullscreen execution.
   - Actively press `F12` or try copying content to trigger warnings.
   - Leave the active tab multiple times to reach the violation maximum limit.
   - Verify the auto-submission sequence logs correctly to the database.
3. **Recovery Testing:**
   - As a Teacher, "Reset" standard student attempts and verify everything resets accurately.
