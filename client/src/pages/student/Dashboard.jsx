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
        <button onClick={() => navigate('/student/pre-exam')} className="w-full py-3 bg-blue-600 border border-transparent text-white font-medium rounded-lg hover:bg-blue-700 hover:shadow-md transition-all">
          Start Exam
        </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">QuizProctor</span>
          </div>
          <button onClick={handleLogout} className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Sign out</button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome, {user?.name}!</h2>
          <p className="text-gray-500 text-sm mt-1 font-medium">Reg No: <span className="font-mono text-gray-700">{user?.registrationNumber}</span></p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <svg className="animate-spin w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : error ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
            <div className="w-12 h-12 mx-auto bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl grayscale opacity-60">📋</span>
            </div>
            <h3 className="font-semibold text-gray-900 text-lg mb-1">{error}</h3>
            <p className="text-gray-500 text-sm">Please check with your teacher when the exam is ready.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-100">
              <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="flex-1 mt-0.5">
                <h3 className="font-bold text-gray-900 text-xl tracking-tight">{quizInfo.quiz.title}</h3>
                {quizInfo.quiz.description && <p className="text-gray-500 text-sm mt-1">{quizInfo.quiz.description}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="bg-white border border-gray-200 flex flex-col items-center justify-center rounded-lg p-5 text-center transition-colors hover:bg-gray-50">
                <div className="text-2xl font-bold text-gray-900">{quizInfo.questionsCount ?? '?'}</div>
                <div className="text-xs font-semibold text-gray-500 tracking-wider uppercase mt-1">Questions</div>
              </div>
              <div className="bg-white border border-gray-200 flex flex-col items-center justify-center rounded-lg p-5 text-center transition-colors hover:bg-gray-50">
                <div className="text-2xl font-bold text-gray-900">
                  {quizInfo.quiz.settings?.totalTimeLimit ? `${quizInfo.quiz.settings.totalTimeLimit}m` : '∞'}
                </div>
                <div className="text-xs font-semibold text-gray-500 tracking-wider uppercase mt-1">Time Limit</div>
              </div>
              <div className="bg-white border border-gray-200 flex flex-col items-center justify-center rounded-lg p-5 text-center transition-colors hover:bg-gray-50">
                <div className="text-2xl font-bold text-gray-900">{quizInfo.quiz.settings?.maxViolations ?? 3}</div>
                <div className="text-xs font-semibold text-gray-500 tracking-wider uppercase mt-1">Warnings Max</div>
              </div>
            </div>

            {getButton()}
          </div>
        )}
      </main>
    </div>
  );
}
