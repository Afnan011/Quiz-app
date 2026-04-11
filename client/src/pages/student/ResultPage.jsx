import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

export default function ResultPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/result')
      .then(({ data }) => setData(data))
      .catch(() => navigate('/student'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <svg className="animate-spin w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  const { attempt, review } = data;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="font-bold text-slate-900 text-lg">Exam Results</h1>
          <button onClick={() => navigate('/student')} className="text-sm text-slate-500 hover:text-slate-800 transition">
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Score card */}
        <div className={`rounded-2xl p-8 text-center border ${
          attempt.status === 'force_submitted'
            ? 'bg-red-50 border-red-200'
            : 'bg-gradient-to-br from-indigo-600 to-indigo-700'
        }`}>
          {attempt.status === 'force_submitted' && (
            <div className="text-sm font-semibold text-red-600 mb-3 bg-red-100 rounded-lg px-4 py-2 inline-block">
              ⚠️ Auto-submitted due to violations
            </div>
          )}
          <div className={`text-6xl font-black mb-2 ${attempt.status === 'force_submitted' ? 'text-red-600' : 'text-white'}`}>
            {attempt.percentage}%
          </div>
          <p className={`text-lg font-semibold ${attempt.status === 'force_submitted' ? 'text-red-700' : 'text-indigo-100'}`}>
            {attempt.score} / {attempt.totalMarks} marks
          </p>
        </div>

        {/* Question Review */}
        <div>
          <h2 className="font-bold text-slate-900 text-lg mb-4">Question Review</h2>
          <div className="space-y-4">
            {review.map((item, idx) => {
              if (!item.question) return null;
              return (
                <div
                  key={idx}
                  className={`bg-white border rounded-2xl p-5 ${
                    item.isCorrect ? 'border-emerald-200' : 'border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      item.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                    }`}>
                      {item.isCorrect ? '✓' : '✗'}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 text-sm">{item.question.text}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.isCorrect
                          ? `✓ Correct — ${item.marksAwarded} mark${item.marksAwarded !== 1 ? 's' : ''} awarded`
                          : `✗ Incorrect — 0 marks`}
                      </p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2 ml-9">
                    {item.question.options.map(opt => {
                      const isCorrect = item.question.correctOptions.includes(opt.label);
                      const isSelected = item.selectedOptions.includes(opt.label);
                      return (
                        <div
                          key={opt.label}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border ${
                            isCorrect
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold'
                              : isSelected
                                ? 'bg-red-50 border-red-200 text-red-700'
                                : 'bg-slate-50 border-slate-100 text-slate-500'
                          }`}
                        >
                          <span className="font-mono font-bold">{opt.label}</span>
                          <span>{opt.text}</span>
                          {isCorrect && <span className="ml-auto">✓</span>}
                          {isSelected && !isCorrect && <span className="ml-auto text-red-400">✗</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
