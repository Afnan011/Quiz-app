import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

export default function ResultPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if results are published from the quiz info
    api.get('/student/quiz')
      .then(({ data: quizInfo }) => {
        setPublished(!!quizInfo?.quiz?.resultsPublished);
        if (quizInfo?.quiz?.resultsPublished) {
          return api.get('/student/result').then(({ data: result }) => setData(result));
        }
      })
      .catch(() => navigate('/student'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  // Results not yet published
  if (!published) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl shadow-lg p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Exam Submitted!</h1>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Your answers have been recorded successfully. Results will be published by your teacher at a later time.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm mb-8 font-medium shadow-sm">
            🔒 Results are currently not available.<br/>Please check back later.
          </div>
          <button
            onClick={() => navigate('/student')}
            className="w-full py-3 bg-blue-600 border border-transparent text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { attempt, review } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="font-bold text-gray-900 text-lg tracking-tight">Exam Results</h1>
          <button onClick={() => navigate('/student')} className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Score card */}
        <div className={`rounded-xl p-8 sm:p-12 text-center border relative overflow-hidden shadow-sm ${
          attempt.status === 'force_submitted'
            ? 'bg-red-50 border-red-200'
            : 'bg-white border-gray-200'
        }`}>
          {/* Decorative background border effect */}
          <div className={`absolute top-0 left-0 w-full h-1 ${attempt.status === 'force_submitted' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
          
          <div className="relative z-10">
            {attempt.status === 'force_submitted' && (
              <div className="text-sm font-bold text-red-700 mb-6 bg-red-100 border border-red-200 rounded-lg px-4 py-2 inline-flex items-center gap-2 shadow-sm">
                ⚠️ Auto-submitted due to violations
              </div>
            )}
            <p className={`text-sm font-bold tracking-widest uppercase mb-2 ${attempt.status === 'force_submitted' ? 'text-red-500' : 'text-gray-500'}`}>
              Final Score
            </p>
            <div className={`text-7xl font-black mb-4 tracking-tighter ${attempt.status === 'force_submitted' ? 'text-red-600' : 'text-blue-600'}`}>
              {attempt.percentage}%
            </div>
            <p className={`text-sm font-medium px-5 py-2 rounded-lg border inline-block shadow-sm ${attempt.status === 'force_submitted' ? 'bg-white border-red-200 text-red-700' : 'bg-white border-blue-100 text-blue-700'}`}>
              {attempt.score} <span className="opacity-50 mx-1">/</span> {attempt.totalMarks} marks
            </p>
          </div>
        </div>

        {/* Question Review */}
        <div>
          <h2 className="font-bold text-gray-900 text-lg mb-4 tracking-tight">Question Review</h2>
          <div className="space-y-4">
            {review.map((item, idx) => {
              if (!item.question) return null;
              return (
                <div
                  key={idx}
                  className={`bg-white border rounded-xl overflow-hidden shadow-sm ${
                    item.isCorrect ? 'border-green-300' : 'border-red-300'
                  }`}
                >
                  <div className={`px-5 py-4 border-b ${item.isCorrect ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
                    <div className="flex items-start gap-3">
                      <span className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                        item.isCorrect ? 'bg-green-500 border-green-600 text-white' : 'bg-red-500 border-red-600 text-white'
                      }`}>
                        {item.isCorrect ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 leading-relaxed text-[15px]">{item.question.text}</p>
                        <p className={`text-xs font-semibold mt-1 flex items-center gap-1.5 ${item.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                          {item.isCorrect
                            ? `✓ Correct (${item.marksAwarded} mark${item.marksAwarded !== 1 ? 's' : ''})`
                            : `✗ Incorrect (0 marks)`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white">
                    {item.question.options.map(opt => {
                      const isCorrect = item.question.correctOptions.includes(opt.label);
                      const isSelected = item.selectedOptions.includes(opt.label);
                      return (
                        <div
                          key={opt.label}
                          className={`flex items-start gap-3 p-3 rounded-lg text-sm border transition-colors ${
                            isCorrect
                              ? 'bg-green-50 border-green-200 shadow-[0_1px_2px_rgba(22,163,74,0.05)]'
                              : isSelected
                                ? 'bg-red-50 border-red-200 shadow-[0_1px_2px_rgba(220,38,38,0.05)]'
                                : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <span className={`w-6 h-6 flex items-center justify-center rounded border flex-shrink-0 font-bold text-xs ${
                            isCorrect ? 'bg-green-100 border-green-300 text-green-800' 
                            : isSelected ? 'bg-red-100 border-red-300 text-red-800' 
                            : 'bg-white border-gray-300 text-gray-500'
                          }`}>
                            {opt.label}
                          </span>
                          <span className={`flex-1 break-words leading-relaxed pt-0.5 ${isCorrect ? 'text-green-900 font-medium' : isSelected ? 'text-red-900 font-medium' : 'text-gray-700'}`}>
                            {opt.text}
                          </span>
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
