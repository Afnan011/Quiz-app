const TYPE_LABELS = {
  tab_switch: 'Tab/Window Switch',
  fullscreen_exit: 'Fullscreen Exit',
  right_click: 'Right Click',
  copy_attempt: 'Copy Attempt',
  keyboard_shortcut: 'Keyboard Shortcut',
};

export default function WarningModal({ violation, remaining, maxViolations, onClose }) {
  const isLast = remaining === 0;
  const icon = isLast ? '🚨' : '⚠️';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className={`bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center border-2 ${
        isLast ? 'border-red-400' : 'border-amber-400'
      }`}>
        <div className="text-5xl mb-4">{icon}</div>
        <h2 className={`text-xl font-bold mb-2 ${isLast ? 'text-red-600' : 'text-amber-600'}`}>
          {isLast ? 'Final Warning!' : 'Violation Detected'}
        </h2>
        <p className="text-slate-600 text-sm mb-1">
          <strong>{TYPE_LABELS[violation] || violation}</strong> was detected.
        </p>
        {isLast ? (
          <p className="text-red-600 font-semibold mt-3 text-sm">
            Your exam will be auto-submitted now.
          </p>
        ) : (
          <p className="text-slate-500 text-sm mt-3">
            You have <span className="font-bold text-amber-600">{remaining}</span> warning{remaining !== 1 ? 's' : ''} remaining before auto-submit.
          </p>
        )}
        {!isLast && (
          <button
            onClick={onClose}
            className="mt-6 w-full py-3 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition"
          >
            I Understand, Continue
          </button>
        )}
      </div>
    </div>
  );
}
