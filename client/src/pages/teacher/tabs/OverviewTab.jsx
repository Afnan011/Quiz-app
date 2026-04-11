import { useState } from 'react';
import api from '../../../utils/api';
import useAuthStore from '../../../store/authStore';

export default function OverviewTab({ classData, onRefresh }) {
  const quiz = classData?.quizId;
  const [toggling, setToggling] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const handleToggleQuiz = async () => {
    if (!quiz?._id) return;
    setToggling(true);
    try {
      await api.put(`/quiz/${quiz._id}/toggle`);
      onRefresh();
    } finally {
      setToggling(false);
    }
  };

  const handlePublishResults = async () => {
    if (!quiz?._id) return;
    setPublishing(true);
    try {
      await api.put(`/quiz/${quiz._id}/publish-results`);
      onRefresh();
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard label="Students" value={classData?.students?.length || 0} icon="👥" color="indigo" />
        <StatCard label="Questions" value={quiz?.questions?.length || 0} icon="❓" color="purple" />
        <StatCard label="Quiz Status" value={quiz?.isActive ? 'Active' : 'Inactive'} icon={quiz?.isActive ? '✅' : '⏸️'} color={quiz?.isActive ? 'emerald' : 'slate'} />
      </div>

      {/* Quiz card */}
      {quiz ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 border-none">Quiz Configuration</h3>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleToggleQuiz}
              disabled={toggling}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition border ${
                quiz.isActive
                  ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              {toggling ? '…' : quiz.isActive ? 'Deactivate Quiz' : 'Activate Quiz'}
            </button>
            <button
              onClick={handlePublishResults}
              disabled={publishing}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition border ${
                quiz.resultsPublished
                  ? 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
              }`}
            >
              {publishing ? '…' : quiz.resultsPublished ? 'Unpublish Results' : 'Publish Results'}
            </button>
          </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <InfoRow label="Title" value={quiz.title} />
            <InfoRow label="Time per Question" value={quiz.settings?.timeLimitPerQuestion ? `${quiz.settings.timeLimitPerQuestion}s` : 'No limit'} />
            <InfoRow label="Total Time" value={quiz.settings?.totalTimeLimit ? `${quiz.settings.totalTimeLimit} min` : 'No limit'} />
            <InfoRow label="Max Violations" value={quiz.settings?.maxViolations ?? 3} />
            <InfoRow label="Shuffle Questions" value={quiz.settings?.shuffleQuestions ? 'Yes' : 'No'} />
            <InfoRow label="Shuffle Options" value={quiz.settings?.shuffleOptions ? 'Yes' : 'No'} />
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-amber-800 text-sm">
          No quiz linked to this class. Go to the <strong>Settings</strong> tab to configure.
        </div>
      )}
    </div>
  );
}

const StatusBadge = ({ active }) => (
  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 border rounded-md text-xs font-medium ${
    active ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-500'
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
    {active ? 'Active' : 'Inactive'}
  </span>
);

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
