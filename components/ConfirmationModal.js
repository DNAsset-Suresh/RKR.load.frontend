'use client';

import { useEffect, useRef } from 'react';

/**
 * The original .scrim/.modal, with the accessibility the static page lacked:
 * Escape closes, focus moves in on open and returns on close, backdrop clicks
 * dismiss but clicks inside do not.
 */
export default function ConfirmationModal({
  open, title, children, onClose,
  confirmLabel = 'Confirm', onConfirm,
  cancelLabel = 'Cancel', danger = false, busy = false, large = false,
  footer,
}) {
  const modalRef = useRef(null);
  const restoreTo = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    restoreTo.current = document.activeElement;
    const first = modalRef.current?.querySelector('input, button:not(.m-close)');
    (first || modalRef.current?.querySelector('.m-close'))?.focus();

    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      restoreTo.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className={`modal${large ? ' lg' : ''}`} ref={modalRef}
        role="dialog" aria-modal="true" aria-labelledby="modal-title"
      >
        <div className="m-head">
          <div className="m-title" id="modal-title">{title}</div>
          <button className="m-close" onClick={onClose} aria-label="Close">{'\u00d7'}</button>
        </div>

        <div className="m-body">{children}</div>

        <div className="m-foot">
          {footer || (
            <>
              <button className="tbtn" onClick={onClose} disabled={busy}>{cancelLabel}</button>
              {onConfirm ? (
                <button
                  className={`tbtn ${danger ? 'danger' : 'primary'}`}
                  style={danger ? { borderColor: 'var(--neg)', color: 'var(--neg)' } : undefined}
                  onClick={onConfirm} disabled={busy}
                >
                  {busy ? <span className="spinner" /> : confirmLabel}
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
