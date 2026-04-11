import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const RULES = [
  'The exam must be taken in fullscreen mode. Exiting fullscreen will be recorded as a violation.',
  'Switching tabs or minimizing the browser will be recorded as a violation.',
  'Right-clicking, copying, or pasting is not allowed during the exam.',
  'Keyboard shortcuts (F12, Ctrl+Shift+I, etc.) are disabled during the exam.',
  `You are allowed a maximum of 3 violations. On the 3rd violation, your exam will be automatically submitted.`,
  'You can only attempt this exam once. Make sure you have a stable internet connection.',
  'Your name and registration number are watermarked on the exam page.',
];

export default function PreExamPage() {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  // Guard: redirect if exam already submitted or no active quiz
  useEffect(() => {
    api.get('/student/quiz').then(({ data }) => {
      const status = data?.attemptStatus;
      if (status === 'submitted' || status === 'force_submitted') {
        navigate('/student', { replace: true });
      }
    }).catch(() => navigate('/student', { replace: true }));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 border-b border-gray-100 px-8 py-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-gray-500 text-sm font-semibold tracking-wide uppercase">Exam Rules</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Before You Begin</h1>
            <p className="text-gray-500 text-sm mt-1">Read all rules carefully. By proceeding, you agree to these terms.</p>
          </div>

          {/* Rules */}
          <div className="px-8 py-6">
            <ul className="space-y-4">
              {RULES.map((rule, idx) => (
                <li key={idx} className="flex gap-3 items-start">
                  <span className="w-6 h-6 border border-gray-200 rounded-md bg-gray-50 text-gray-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-gray-700 text-sm leading-relaxed">{rule}</p>
                </li>
              ))}
            </ul>

            {/* Warning box */}
            <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-amber-800 text-sm leading-relaxed">
                <strong>Important:</strong> This exam can only be taken once. Ensure you have a stable internet connection and at least 30 minutes of uninterrupted time.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 pb-8">
            <label className="flex items-center gap-3 mb-5 cursor-pointer group p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                I have read and understood all the exam rules above.
              </span>
            </label>
            <div className="flex gap-3">
              <button 
                onClick={() => navigate('/student')} 
                className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
               >
                Go Back
              </button>
              <button
                onClick={() => navigate('/student/exam')}
                disabled={!agreed}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 border border-transparent disabled:opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
               >
                Begin Exam →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
