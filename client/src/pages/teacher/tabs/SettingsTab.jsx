import { useState } from 'react';
import api from '../../../utils/api';

const Toggle = ({ checked, onChange, label }) => (
  <label className="flex items-center justify-between py-3 border-b border-gray-100 cursor-pointer group last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors">
    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{label}</span>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-10 h-5 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}
    >
      <span className={`inline-block w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
    </button>
  </label>
);

export default function SettingsTab({ classData, onRefresh }) {
  const quiz = classData?.quizId;
  const [form, setForm] = useState({
    title: quiz?.title || '',
    description: quiz?.description || '',
    settings: {
      timeLimitPerQuestion: quiz?.settings?.timeLimitPerQuestion ?? 0,
      totalTimeLimit: quiz?.settings?.totalTimeLimit ?? 0,
      shuffleQuestions: quiz?.settings?.shuffleQuestions ?? false,
      shuffleOptions: quiz?.settings?.shuffleOptions ?? false,
      maxViolations: quiz?.settings?.maxViolations ?? 3,
    },
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const setS = (key, val) => setForm(p => ({ ...p, settings: { ...p.settings, [key]: val } }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!quiz?._id) return;
    setSaving(true); setSuccess(false);
    try {
      await api.put(`/quiz/${quiz._id}/settings`, form);
      setSuccess(true);
      onRefresh();
      setTimeout(() => setSuccess(false), 2500);
    } finally { setSaving(false); }
  };

  if (!quiz) return <div className="py-10 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">No active quiz configuration.</div>;

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      {/* Basic info */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">Quiz Information</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Title</label>
          <input
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="opacity-60 font-normal">(optional)</span></label>
          <textarea
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-shadow"
          />
        </div>
      </div>

      {/* Timers */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3 pb-3 border-b border-gray-100">Timers</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time per Question <span className="opacity-60 font-normal">(sec, 0 for off)</span></label>
            <input
              type="number"
              min={0}
              value={form.settings.timeLimitPerQuestion}
              onChange={e => setS('timeLimitPerQuestion', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Quiz Time <span className="opacity-60 font-normal">(min, 0 for off)</span></label>
            <input
              type="number"
              min={0}
              value={form.settings.totalTimeLimit}
              onChange={e => setS('totalTimeLimit', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            />
          </div>
        </div>
      </div>

      {/* Toggles & violations */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-2 pb-3 border-b border-gray-100">Behavior & Enforcements</h3>
        <Toggle checked={form.settings.shuffleQuestions} onChange={v => setS('shuffleQuestions', v)} label="Shuffle Question Order" />
        <Toggle checked={form.settings.shuffleOptions} onChange={v => setS('shuffleOptions', v)} label="Shuffle Options (A/B/C/D)" />
        <div className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors mt-2">
          <div>
            <span className="text-sm font-medium text-gray-700 block">Max Rule Violations</span>
            <span className="text-xs text-gray-500">Auto-submits after N cheating attempts (1–10)</span>
          </div>
          <input
            type="number"
            min={1}
            max={10}
            value={form.settings.maxViolations}
            onChange={e => setS('maxViolations', Number(e.target.value))}
            className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-center text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-700 text-sm font-medium flex items-center gap-2">
          <span>✓</span> Settings saved successfully.
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="px-5 py-2 bg-blue-600 border border-transparent text-white font-medium text-sm rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </form>
  );
}
