# Quiz App Implementation Tasks

## Phase 1: Foundation
- [ ] Setup base repository (alii13/examination-management-system).
- [ ] Configure Vite + React + Tailwind frontend.
- [ ] Setup Backend (Node + Express + MongoDB).
- [ ] Implement enhanced Auth flow (JWT, refresh token, isFirstLogin flag).
- [ ] Implement robust Mongoose Schemas (User, Class, Quiz, Question, Attempt, ViolationLog).

## Phase 2: Teacher Features
- [ ] Teacher Dashboard & Class List.
- [ ] Class Detail Views (Overview, Settings).
- [ ] Student Management (List, Add, Edit, Remove, Bulk Excel Import/Export, Reset Attempt).
- [ ] Question Management (List, Add, Edit, Delete, Bulk JSON Upload).
- [ ] Quiz Settings Configuration.

## Phase 3: Exam Engine
- [ ] Student Dashboard & Exam Status Tracking.
- [ ] Pre-Exam Rules / Agreement Screen.
- [ ] Exam Room View (Question layout, Per-question & Total Timer, Navigation).
- [ ] Submission & Server-side Grading Logic.
- [ ] Results & Review (correct answers display) View.

## Phase 4: Anti-Cheat System
- [ ] Build `useAntiCheat` hook and `ExamGuard` component.
- [ ] Implement Fullscreen enforcement.
- [ ] Add Tab/Window switch detection.
- [ ] Implement Right-click and Copy/Paste/Select blocking.
- [ ] Add Keyboard shortcut blocking (DevTools, Print, etc.).
- [ ] Add Violation Tracker, Warning Modal & Auto-submit Logic.
- [ ] Implement identifiable Watermarking on the exam view.

## Phase 5: Polish & Security
- [ ] Add Server Middleware: Role Guards, Rate Limiting, Input Validation.
- [ ] Refine responsive application layouts (mobile to desktop).
- [ ] Conduct comprehensive end-to-end testing of core exam execution.
