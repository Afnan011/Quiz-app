import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import useAuthStore from '../../store/authStore';
import useAntiCheat from '../../hooks/useAntiCheat';
import WarningModal from '../../components/WarningModal';

function useTimer(seconds, onExpire) {
  const [timeLeft, setTimeLeft] = useState(seconds > 0 ? seconds : null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!seconds || seconds <= 0) return;
    setTimeLeft(seconds);
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [seconds]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  return timeLeft !== null ? fmt(timeLeft) : null;
}

export default function ExamRoom() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // {questionId: [selected labels]}
  const [violation, setViolation] = useState(null);
  const [submitConfirm, setSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [autoSubmitting, setAutoSubmitting] = useState(false);
  const [error, setError] = useState('');

  const totalSeconds = quiz?.settings?.totalTimeLimit ? quiz.settings.totalTimeLimit * 60 : 0;
  const perQSeconds = quiz?.settings?.timeLimitPerQuestion || 0;

  const doSubmit = useCallback(async (force = false) => {
    setSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, selectedOptions]) => ({
        questionId, selectedOptions,
      }));
      await api.post('/student/quiz/submit', { answers: formattedAnswers, force });
      navigate('/student/result');
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  }, [answers, navigate]);

  const totalTime = useTimer(totalSeconds, () => doSubmit(false));
  const perQTime = useTimer(perQSeconds ? perQSeconds : 0, () => {
    if (currentIdx < questions.length - 1) setCurrentIdx(i => i + 1);
    else doSubmit(false);
  });

  const handleViolation = useCallback((type, count, remaining, autoSubmit) => {
    setViolation({ type, count, remaining });
    if (autoSubmit) {
      setAutoSubmitting(true);
      setTimeout(() => doSubmit(true), 2000);
    }
  }, [doSubmit]);

  useAntiCheat({ attemptId: attempt?._id, onViolation: handleViolation });

  useEffect(() => {
    const startExam = async () => {
      try {
        // Request fullscreen
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen().catch(() => {});
        }
        const { data } = await api.post('/student/quiz/start');
        setAttempt(data.attempt);
        setQuestions(data.questions);
        setQuiz(data.quiz);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to start exam.');
      } finally {
        setLoading(false);
      }
    };
    startExam();
    return () => {
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  const currentQ = questions[currentIdx];

  const toggleOption = (label) => {
    if (!currentQ) return;
    const qId = currentQ._id;
    const type = currentQ.type;
    setAnswers(prev => {
      const current = prev[qId] || [];
      if (type === 'single') return { ...prev, [qId]: [label] };
      const updated = current.includes(label)
        ? current.filter(l => l !== label)
        : [...current, label];
      return { ...prev, [qId]: updated };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <svg className="animate-spin w-10 h-10 text-indigo-400 mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-slate-400">Setting up your exam and activating fullscreen…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl p-8 max-w-md text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-white font-semibold">{error}</p>
          <button onClick={() => navigate('/student')} className="mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 transition">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const selectedForCurrent = answers[currentQ?._id] || [];
  const answered = questions.filter(q => (answers[q._id] || []).length > 0);

  return (
    <div className="exam-content min-h-screen bg-slate-900 flex flex-col">
      {/* Watermark overlay */}
      <div className="pointer-events-none select-none fixed inset-0 z-10 flex items-center justify-center opacity-[0.04]" aria-hidden>
        <p className="text-white text-4xl font-bold rotate-[-35deg] whitespace-nowrap">
          {user?.name} · {user?.registrationNumber}
        </p>
      </div>

      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center gap-4 z-20 relative">
        <div className="flex-1">
          <p className="text-slate-400 text-xs font-medium">EXAM IN PROGRESS</p>
          <p className="text-white font-semibold text-sm">{quiz?.title}</p>
        </div>
        <div className="flex items-center gap-4">
          {totalTime && (
            <div className={`text-sm font-mono font-bold px-3 py-1.5 rounded-lg ${
              totalTime < '05:00' ? 'bg-red-600 text-white' : 'bg-slate-700 text-white'
            }`}>
              ⏱ {totalTime}
            </div>
          )}
          {perQTime && (
            <div className="text-xs font-mono text-slate-400 px-3 py-1 bg-slate-700 rounded-lg">
              Q: {perQTime}
            </div>
          )}
          <div className="text-xs text-slate-400">
            <span className="text-white font-semibold">{answered.length}</span>/{questions.length} answered
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Question Navigation Grid */}
        <aside className="w-52 bg-slate-800 border-r border-slate-700 p-4 overflow-y-auto flex-shrink-0">
          <p className="text-slate-400 text-xs font-medium mb-3">QUESTIONS</p>
          <div className="grid grid-cols-4 gap-1.5">
            {questions.map((q, i) => {
              const isAnswered = (answers[q._id] || []).length > 0;
              const isCurrent = i === currentIdx;
              return (
                <button
                  key={q._id}
                  onClick={() => setCurrentIdx(i)}
                  className={`w-full aspect-square rounded-lg text-xs font-semibold transition ${
                    isCurrent
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                      : isAnswered
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-4 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-slate-400"><span className="w-3 h-3 rounded bg-emerald-600 block" /> Answered</div>
            <div className="flex items-center gap-2 text-slate-400"><span className="w-3 h-3 rounded bg-slate-700 block" /> Not answered</div>
          </div>
        </aside>

        {/* Question Area */}
        <main className="flex-1 overflow-y-auto p-8">
          {currentQ && (
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-slate-400 text-sm">Question {currentIdx + 1} of {questions.length}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  currentQ.type === 'single'
                    ? 'bg-blue-900 text-blue-300'
                    : 'bg-purple-900 text-purple-300'
                }`}>
                  {currentQ.type === 'single' ? 'Single answer' : 'Multiple answers'}
                </span>
                <span className="text-slate-500 text-xs ml-auto">{currentQ.marks} mark{currentQ.marks !== 1 ? 's' : ''}</span>
              </div>

              <p className="text-white text-lg font-medium leading-relaxed mb-8">{currentQ.text}</p>

              <div className="space-y-3">
                {currentQ.options.map(opt => {
                  const isSelected = selectedForCurrent.includes(opt.label);
                  return (
                    <button
                      key={opt.label}
                      onClick={() => toggleOption(opt.label)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-900/40 text-white'
                          : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500 hover:bg-slate-700'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center text-sm font-bold flex-shrink-0 transition ${
                        isSelected
                          ? 'border-indigo-400 bg-indigo-600 text-white'
                          : 'border-slate-600 text-slate-500'
                      }`}>
                        {opt.label}
                      </span>
                      <span className="text-sm">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                  disabled={currentIdx === 0}
                  className="px-5 py-2.5 bg-slate-700 text-slate-300 text-sm font-medium rounded-xl disabled:opacity-40 hover:bg-slate-600 transition"
                >
                  ← Previous
                </button>
                {currentIdx < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIdx(i => i + 1)}
                    className="px-5 py-2.5 bg-slate-700 text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-600 transition"
                  >
                    Next →
                  </button>
                ) : null}
                <button
                  onClick={() => setSubmitConfirm(true)}
                  className="ml-auto px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition"
                >
                  Submit Exam
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Violation warning modal */}
      {violation && !autoSubmitting && (
        <WarningModal
          violation={violation.type}
          remaining={violation.remaining}
          maxViolations={quiz?.settings?.maxViolations}
          onClose={() => setViolation(null)}
        />
      )}

      {/* Auto-submit overlays */}
      {autoSubmitting && (
        <div className="fixed inset-0 bg-red-900/90 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="text-center text-white">
            <div className="text-5xl mb-4">🚨</div>
            <p className="text-2xl font-bold">Maximum violations reached.</p>
            <p className="text-red-200 mt-2">Your exam is being submitted automatically…</p>
          </div>
        </div>
      )}

      {/* Submit confirmation */}
      {submitConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
            <div className="text-4xl mb-3">📝</div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Submit Your Exam?</h2>
            <p className="text-slate-500 text-sm mb-1">
              {answered.length} / {questions.length} questions answered.
            </p>
            {answered.length < questions.length && (
              <p className="text-amber-600 text-sm">You have {questions.length - answered.length} unanswered question{questions.length - answered.length !== 1 ? 's' : ''}. Unanswered questions will score 0.</p>
            )}
            <div className="flex gap-3 mt-6">
              <button onClick={() => setSubmitConfirm(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm rounded-xl hover:bg-slate-50 transition">
                Continue Exam
              </button>
              <button
                onClick={() => { setSubmitConfirm(false); doSubmit(false); }}
                disabled={submitting}
                className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition"
              >
                {submitting ? 'Submitting…' : 'Submit Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
