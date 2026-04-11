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
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Quiz Configuration</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleQuiz}
              disabled={toggling}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition ${
                quiz.isActive
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
              }`}
            >
              {toggling ? '…' : quiz.isActive ? 'Deactivate Quiz' : 'Activate Quiz'}
            </button>
            <button
              onClick={handlePublishResults}
              disabled={publishing}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition ${
                quiz.resultsPublished
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
              }`}
            >
              {publishing ? '…' : quiz.resultsPublished ? '🔒 Unpublish Results' : '📢 Publish Results'}
            </button>
          </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <InfoRow label="Title" value={quiz.title} />
            <InfoRow label="Time per Question" value={quiz.settings?.timeLimitPerQuestion ? `${quiz.settings.timeLimitPerQuestion}s` : 'No limit'} />
            <InfoRow label="Total Time" value={quiz.settings?.totalTimeLimit ? `${quiz.settings.totalTimeLimit} min` : 'No limit'} />
            <InfoRow label="Max Violations" value={quiz.settings?.maxViolations ?? 3} />
            <InfoRow label="Shuffle Questions" value={quiz.settings?.shuffleQuestions ? 'Yes' : 'No'} />
            <InfoRow label="Shuffle Options" value={quiz.settings?.shuffleOptions ? 'Yes' : 'No'} />
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-800 text-sm">
          No quiz linked to this class. Go to the <strong>Settings</strong> tab to configure.
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  const colors = {
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-700',
    purple: 'bg-purple-50 border-purple-100 text-purple-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    slate: 'bg-slate-50 border-slate-200 text-slate-600',
  };
  return (
    <div className={`border rounded-2xl p-5 ${colors[color]}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm font-medium opacity-70 mt-0.5">{label}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-50">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}
