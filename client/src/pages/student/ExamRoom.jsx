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
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
        <svg className="animate-spin w-10 h-10 text-blue-500 mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-gray-400 font-medium tracking-wide">Setting up your exam and activating fullscreen…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 max-w-md text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-red-500/20">
            ⚠️
          </div>
          <p className="text-gray-100 font-medium">{error}</p>
          <button onClick={() => navigate('/student')} className="mt-8 px-6 py-2.5 bg-gray-700 border border-gray-600 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors w-full">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const selectedForCurrent = answers[currentQ?._id] || [];
  const answered = questions.filter(q => (answers[q._id] || []).length > 0);

  return (
    <div className="exam-content min-h-screen bg-gray-950 flex flex-col">
      {/* Watermark overlay */}
      <div className="pointer-events-none select-none fixed inset-0 z-10 flex items-center justify-center opacity-[0.03]" aria-hidden>
        <p className="text-white text-4xl font-bold rotate-[-35deg] whitespace-nowrap tracking-widest">
          {user?.name} · {user?.registrationNumber}
        </p>
      </div>

      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center gap-4 z-20 relative shadow-sm">
        <div className="flex-[2] min-w-0">
          <p className="text-gray-500 text-[10px] font-bold tracking-widest uppercase">EXAM IN PROGRESS</p>
          <p className="text-gray-100 font-semibold text-sm truncate">{quiz?.title}</p>
        </div>
        <div className="flex items-center gap-3">
          {totalTime && (
            <div className={`text-sm font-mono font-medium px-3 py-1.5 rounded flex items-center justify-center min-w-[70px] ${
              totalTime < '05:00' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-gray-800 border border-gray-700 text-gray-200'
            }`}>
               {totalTime}
            </div>
          )}
          {perQTime && (
            <div className="text-xs font-mono text-gray-400 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded flex items-center gap-1">
              <span className="opacity-50">Q:</span> {perQTime}
            </div>
          )}
          <div className="text-xs text-gray-500 hidden sm:block">
            <span className="text-gray-200 font-medium">{answered.length}</span>/{questions.length} answered
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Question Navigation Grid */}
        <aside className="w-full md:w-56 bg-gray-900 border-b md:border-b-0 md:border-r border-gray-800 p-4 flex flex-col md:overflow-y-auto flex-shrink-0 z-20">
          <div className="flex items-center justify-between md:block mb-4">
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Question Map</p>
            <div className="flex items-center gap-3 text-[10px] md:hidden">
              <div className="flex items-center gap-1.5 text-gray-400"><span className="w-2 h-2 bg-emerald-500 rounded-sm" /> Ans</div>
              <div className="flex items-center gap-1.5 text-gray-400"><span className="w-2 h-2 bg-gray-700 rounded-sm" /> Unans</div>
            </div>
          </div>

          <div className="flex md:grid md:grid-cols-4 gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
            {questions.map((q, i) => {
              const isAnswered = (answers[q._id] || []).length > 0;
              const isCurrent = i === currentIdx;
              return (
                <button
                  key={q._id}
                  onClick={() => setCurrentIdx(i)}
                  className={`w-9 h-9 md:w-full md:h-auto md:aspect-square rounded border text-xs font-semibold transition-all flex-shrink-0 flex items-center justify-center ${
                    isCurrent
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)] scale-105'
                      : isAnswered
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 opacity-90'
                        : 'border-gray-800 bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-6 space-y-2.5 text-[11px] hidden md:block">
            <div className="flex items-center gap-2.5 text-gray-400 font-medium"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/20 border border-emerald-500/50 block" /> Answered</div>
            <div className="flex items-center gap-2.5 text-gray-400 font-medium"><span className="w-2.5 h-2.5 rounded-sm bg-gray-800/50 border border-gray-800 block" /> Not answered</div>
          </div>
        </aside>

        {/* Question Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 z-20">
          {currentQ && (
            <div className="max-w-3xl mx-auto h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800/50">
                <span className="text-gray-400 text-sm font-medium">Question {currentIdx + 1} <span className="opacity-50">/ {questions.length}</span></span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${
                  currentQ.type === 'single'
                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                    : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                }`}>
                  {currentQ.type === 'single' ? 'Single Choice' : 'Multiple Choice'}
                </span>
                <span className="text-gray-500 text-xs font-medium ml-auto flex items-center gap-1.5 pt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-gray-700 mb-0.5"/> {currentQ.marks} mark{currentQ.marks !== 1 ? 's' : ''}</span>
              </div>

              <p className="text-gray-100 text-[17px] font-medium leading-loose mb-8">{currentQ.text}</p>

              <div className="space-y-3 mb-auto">
                {currentQ.options.map(opt => {
                  const isSelected = selectedForCurrent.includes(opt.label);
                  return (
                    <button
                      key={opt.label}
                      onClick={() => toggleOption(opt.label)}
                      className={`w-full flex items-center gap-4 p-4 rounded-lg border text-left transition-colors ${
                        isSelected
                          ? 'border-blue-500/50 bg-blue-500/10 text-white shadow-[0_2px_10px_rgba(59,130,246,0.05)]'
                          : 'border-gray-800 bg-gray-900/40 text-gray-300 hover:border-gray-700 hover:bg-gray-800'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded border flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-gray-700 bg-gray-800 text-gray-500'
                      }`}>
                        {opt.label}
                      </span>
                      <span className="text-[15px]">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex flex-wrap sm:flex-nowrap gap-3 mt-12 pt-6 border-t border-gray-800/50">
                <button
                  onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                  disabled={currentIdx === 0}
                  className="w-full sm:w-auto px-5 py-3 sm:py-2.5 bg-gray-800 border border-gray-700 text-gray-300 text-sm font-medium rounded-lg disabled:opacity-40 hover:bg-gray-700 transition-colors order-2 sm:order-none"
                >
                  ← Previous
                </button>
                {currentIdx < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIdx(i => i + 1)}
                    className="w-full sm:w-auto px-5 py-3 sm:py-2.5 bg-gray-800 border border-gray-700 text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors order-1 sm:order-none"
                  >
                    Next Question →
                  </button>
                ) : null}
                <button
                  onClick={() => setSubmitConfirm(true)}
                  className="w-full sm:w-auto sm:ml-auto px-6 py-3 sm:py-2.5 bg-blue-600 border border-transparent text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors order-3 sm:order-none"
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
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center border border-gray-100">
            <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-5">
              <span className="grayscale opacity-70 mt-1">📝</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">Submit Your Exam?</h2>
            <p className="text-gray-500 text-sm mb-1 font-medium">
              {answered.length} / {questions.length} questions answered.
            </p>
            {answered.length < questions.length && (
              <p className="text-amber-600 text-sm font-medium mt-3 bg-amber-50 p-2 rounded border border-amber-100">You have {questions.length - answered.length} unanswered question{questions.length - answered.length !== 1 ? 's' : ''}. Unanswered questions receive 0 marks.</p>
            )}
            <div className="flex gap-3 mt-8">
              <button onClick={() => setSubmitConfirm(false)} className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                Back to Exam
              </button>
              <button
                onClick={() => { setSubmitConfirm(false); doSubmit(false); }}
                disabled={submitting}
                className="flex-1 py-2.5 bg-blue-600 border border-transparent text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
              >
                {submitting ? 'Submitting…' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
