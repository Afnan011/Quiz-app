import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import useAuthStore from '../../store/authStore';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [quizInfo, setQuizInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/student/quiz')
      .then(({ data }) => setQuizInfo(data))
      .catch(err => setError(err.response?.data?.message || 'No quiz available.'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getButton = () => {
    const status = quizInfo?.attemptStatus;
    if (status === 'submitted' || status === 'force_submitted') {
      if (quizInfo?.quiz?.resultsPublished) {
        return (
          <button onClick={() => navigate('/student/result')} className="w-full py-3 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-800 transition">
            📊 View My Results
          </button>
        );
      }
      return (
        <div className="w-full py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold rounded-xl text-center text-sm">
          ✅ Exam Submitted — Results will be published by your teacher.
        </div>
      );
    }
    if (status === 'in_progress') {
      return (
        <button onClick={() => navigate('/student/pre-exam')} className="w-full py-3 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition">
          Resume Exam
        </button>
      );
    }
    return (
      <button onClick={() => navigate('/student/pre-exam')} className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
        Start Exam
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="font-bold text-slate-800 text-lg">QuizProctor</span>
          </div>
          <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-slate-800 transition">Sign out</button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Welcome, {user?.name}!</h2>
          <p className="text-slate-500 text-sm mt-1">Reg No: <span className="font-mono">{user?.registrationNumber}</span></p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <svg className="animate-spin w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : error ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-semibold text-amber-700">{error}</p>
            <p className="text-amber-600 text-sm mt-1">Please check with your teacher when the exam is ready.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 text-xl">{quizInfo.quiz.title}</h3>
                {quizInfo.quiz.description && <p className="text-slate-500 text-sm mt-1">{quizInfo.quiz.description}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">{quizInfo.questionsCount ?? '?'}</div>
                <div className="text-xs text-slate-500 mt-0.5">Questions</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">
                  {quizInfo.quiz.settings?.totalTimeLimit ? `${quizInfo.quiz.settings.totalTimeLimit}m` : '∞'}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Time Limit</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-slate-800">{quizInfo.quiz.settings?.maxViolations ?? 3}</div>
                <div className="text-xs text-slate-500 mt-0.5">Max Warnings</div>
              </div>
            </div>

            {getButton()}
          </div>
        )}
      </main>
    </div>
  );
}
