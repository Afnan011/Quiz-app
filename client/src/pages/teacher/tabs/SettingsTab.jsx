import { useState } from 'react';
import api from '../../../utils/api';

const Toggle = ({ checked, onChange, label }) => (
  <label className="flex items-center justify-between py-3 border-b border-slate-100 cursor-pointer group">
    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{label}</span>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-11 h-6 items-center rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-slate-200'}`}
    >
      <span className={`inline-block w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
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

  if (!quiz) return <div className="py-10 text-center text-slate-400">No quiz linked.</div>;

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      {/* Basic info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-slate-900">Quiz Info</h3>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Quiz Title</label>
          <input
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Description (optional)</label>
          <textarea
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            rows={2}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
          />
        </div>
      </div>

      {/* Timers */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Timers</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Time per Question (seconds, 0 = no limit)</label>
            <input
              type="number"
              min={0}
              value={form.settings.timeLimitPerQuestion}
              onChange={e => setS('timeLimitPerQuestion', Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Total Quiz Time (minutes, 0 = no limit)</label>
            <input
              type="number"
              min={0}
              value={form.settings.totalTimeLimit}
              onChange={e => setS('totalTimeLimit', Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>
      </div>

      {/* Toggles & violations */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h3 className="font-semibold text-slate-900 mb-2">Behavior</h3>
        <Toggle checked={form.settings.shuffleQuestions} onChange={v => setS('shuffleQuestions', v)} label="Shuffle Questions" />
        <Toggle checked={form.settings.shuffleOptions} onChange={v => setS('shuffleOptions', v)} label="Shuffle Options (A/B/C/D)" />
        <div className="flex items-center justify-between py-3">
          <div>
            <span className="text-sm font-medium text-slate-700">Max Violations before Auto-Submit</span>
            <p className="text-xs text-slate-400">Triggers auto-submit after N violations (1–10)</p>
          </div>
          <input
            type="number"
            min={1}
            max={10}
            value={form.settings.maxViolations}
            onChange={e => setS('maxViolations', Number(e.target.value))}
            className="w-20 px-3 py-2 border border-slate-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-700 text-sm font-medium">
          ✓ Settings saved successfully.
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-3 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition shadow-sm"
      >
        {saving ? 'Saving…' : 'Save Settings'}
      </button>
    </form>
  );
}
