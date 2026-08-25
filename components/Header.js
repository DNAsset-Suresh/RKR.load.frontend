'use client';

/**
 * The rate chip from the original strip. The spec requires the RKR rate to be
 * visible at all times, so it rides in the top bar on every page.
 */
export default function Header({ title, rates, children }) {
  return (
    <div className="topbar">
      <h1>{title}</h1>
      {children}
      {rates ? (
        <div className="rate-chip" title="RKR commission rate">
          <div className="rc-label">RKR Profit<br />Rate</div>
          <div className="rc-val">
            {'\u20b9'}{rates.rkrProfitPerTon} / TON
          </div>
        </div>
      ) : null}
    </div>
  );
}
