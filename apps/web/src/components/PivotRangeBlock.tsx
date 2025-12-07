import React from 'react';
import {
  calculateCamarillaPivots,
  calculateVolatilityRanges,
  formatRangeDisplay,
  type CamarillaPivots,
  type VolatilityRanges,
} from '@option-dashboard/shared';

interface PivotRangeBlockProps {
  previousHigh: number;
  previousLow: number;
  previousClose: number;
  currentClose: number;
  volatility: number; // From IVDEX/VIX
  spotPrice: number;
}

const PivotRangeBlock: React.FC<PivotRangeBlockProps> = ({
  previousHigh,
  previousLow,
  previousClose,
  currentClose,
  volatility,
  spotPrice,
}) => {
  // Calculate Camarilla Pivots
  const pivots: CamarillaPivots = calculateCamarillaPivots(
    previousHigh,
    previousLow,
    previousClose
  );

  // Calculate Volatility Ranges
  const ranges: VolatilityRanges = calculateVolatilityRanges(
    currentClose,
    volatility
  );

  // Helper to determine if spot is above or below a level
  const getDirection = (level: number): 'up' | 'dn' => {
    return spotPrice >= level ? 'up' : 'dn';
  };

  return (
    <div className="pivot-range-block">
      <div className="pivot-range-header">
        <h3>RANGE</h3>
      </div>

      <div className="pivot-range-grid">
        {/* Header Row */}
        <div className="grid-header">
          <div className="pivot-label">PIVOT (Camarilla)</div>
          <div className="pivot-value-header">Value</div>
          <div className="separator-line"></div>
          <div className="range-column">
            <div className="range-label">Daily Range</div>
          </div>
          <div className="range-column">
            <div className="range-label">Weekly Range</div>
          </div>
          <div className="range-column">
            <div className="range-label">Monthly Range</div>
          </div>
        </div>

        {/* Range Display Row */}
        <div className="range-values-row">
          <div className="pivot-label">Range</div>
          <div className="pivot-value-cell"></div>
          <div className="separator-line"></div>
          <div className="range-value">
            {formatRangeDisplay(ranges.daily.lower, ranges.daily.upper)}
          </div>
          <div className="range-value">
            {formatRangeDisplay(ranges.weekly.lower, ranges.weekly.upper)}
          </div>
          <div className="range-value">
            {formatRangeDisplay(ranges.monthly.lower, ranges.monthly.upper)}
          </div>
        </div>

        {/* Sub-header with Up/Dn columns */}
        <div className="direction-headers">
          <div className="pivot-label"></div>
          <div className="pivot-value-cell"></div>
          <div className="separator-line"></div>
          {['Daily', 'Weekly', 'Monthly'].map((period) => (
            <div key={period} className="direction-columns">
              <div className="direction-label up">Up</div>
              <div className="direction-label dn">Dn</div>
            </div>
          ))}
        </div>

        {/* H3 Row */}
        <div className="pivot-row">
          <div className="pivot-label">H3</div>
          <div className="pivot-value-cell">{pivots.H3.toFixed(2)}</div>
          <div className="separator-line"></div>
          <div className="target-cell">
            {getDirection(pivots.H3) === 'up' ? '✓' : ''}
          </div>
          <div className="target-cell">
            {getDirection(pivots.H3) === 'dn' ? '✓' : ''}
          </div>
          <div className="target-cell">
            {getDirection(pivots.H3) === 'up' ? '✓' : ''}
          </div>
          <div className="target-cell">
            {getDirection(pivots.H3) === 'dn' ? '✓' : ''}
          </div>
          <div className="target-cell">
            {getDirection(pivots.H3) === 'up' ? '✓' : ''}
          </div>
          <div className="target-cell">
            {getDirection(pivots.H3) === 'dn' ? '✓' : ''}
          </div>
        </div>

        {/* H4 Row - T1 */}
        <div className="pivot-row">
          <div className="pivot-label">H4</div>
          <div className="pivot-value-cell">{pivots.H4.toFixed(2)}</div>
          <div className="separator-line"></div>
          <div className="target-cell">T1: {ranges.daily.T1_up.toFixed(2)}</div>
          <div className="target-cell">T1: {ranges.daily.T1_dn.toFixed(2)}</div>
          <div className="target-cell">T1: {ranges.weekly.T1_up.toFixed(2)}</div>
          <div className="target-cell">T1: {ranges.weekly.T1_dn.toFixed(2)}</div>
          <div className="target-cell">T1: {ranges.monthly.T1_up.toFixed(2)}</div>
          <div className="target-cell">T1: {ranges.monthly.T1_dn.toFixed(2)}</div>
        </div>

        {/* L3 Row - T2 */}
        <div className="pivot-row">
          <div className="pivot-label">L3</div>
          <div className="pivot-value-cell">{pivots.L3.toFixed(2)}</div>
          <div className="separator-line"></div>
          <div className="target-cell">T2: {ranges.daily.T2_up.toFixed(2)}</div>
          <div className="target-cell">T2: {ranges.daily.T2_dn.toFixed(2)}</div>
          <div className="target-cell">T2: {ranges.weekly.T2_up.toFixed(2)}</div>
          <div className="target-cell">T2: {ranges.weekly.T2_dn.toFixed(2)}</div>
          <div className="target-cell">T2: {ranges.monthly.T2_up.toFixed(2)}</div>
          <div className="target-cell">T2: {ranges.monthly.T2_dn.toFixed(2)}</div>
        </div>

        {/* L4 Row - T3 */}
        <div className="pivot-row">
          <div className="pivot-label">L4</div>
          <div className="pivot-value-cell">{pivots.L4.toFixed(2)}</div>
          <div className="separator-line"></div>
          <div className="target-cell">T3: {ranges.daily.T3_up.toFixed(2)}</div>
          <div className="target-cell">T3: {ranges.daily.T3_dn.toFixed(2)}</div>
          <div className="target-cell">T3: {ranges.weekly.T3_up.toFixed(2)}</div>
          <div className="target-cell">T3: {ranges.weekly.T3_dn.toFixed(2)}</div>
          <div className="target-cell">T3: {ranges.monthly.T3_up.toFixed(2)}</div>
          <div className="target-cell">T3: {ranges.monthly.T3_dn.toFixed(2)}</div>
        </div>
        {/* B/O_up Row */}
        <div className="breakout-row">
          <div className="pivot-label">B/O_up</div>
          <div className="pivot-value-cell">{pivots.B_O_up.toFixed(2)}</div>
          <div className="separator-line"></div>
          <div className="empty-cell"></div>
          <div className="empty-cell"></div>
          <div className="empty-cell"></div>
        </div>

        {/* B/O_dn Row */}
        <div className="breakout-row">
          <div className="pivot-label">B/O_dn</div>
          <div className="pivot-value-cell">{pivots.B_O_dn.toFixed(2)}</div>
          <div className="separator-line"></div>
          <div className="empty-cell"></div>
          <div className="empty-cell"></div>
          <div className="empty-cell"></div>
        </div>
      </div>

      <style>{`
        .pivot-range-block {
          background: var(--card-bg);
          border-radius: 8px;
          padding: 20px;
          margin: 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          position: relative;
          z-index: 1;
          clear: both;
          display: block;
          width: 100%;
        }

        .pivot-range-header h3 {
          color: var(--text-primary);
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 16px;
          text-align: center;
        }

        .pivot-range-grid {
          display: grid;
          gap: 1px;
          background: var(--border-color);
          position: relative;
          z-index: 1;
        }

        .grid-header,
        .range-values-row,
        .direction-headers,
        .pivot-row,
        .breakout-row {
          display: grid;
          grid-template-columns: 100px 100px 2px repeat(3, 1fr);
          background: var(--card-bg);
        }

        .direction-headers {
          grid-template-columns: 100px 100px 2px repeat(3, 1fr);
        }

        .direction-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
        }

        .pivot-row {
          grid-template-columns: 100px 100px 2px repeat(6, 1fr);
        }

        .breakout-row {
          grid-template-columns: 100px 100px 2px repeat(3, 1fr);
        }

        .separator-line {
          background: #e1ff0f;
          width: 10px;
        }

        .pivot-label {
          padding: 12px;
          font-weight: 600;
          color: var(--text-primary);
          background: var(--bg-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          border-right: 1px solid var(--border-color);
        }

        .pivot-value-header {
          padding: 12px;
          font-weight: 600;
          color: var(--text-primary);
          background: var(--bg-secondary);
          text-align: center;
          font-size: 1rem;
        }

        .pivot-value-cell {
          padding: 12px;
          font-weight: 600;
          color: var(--primary-color);
          background: var(--card-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
        }

        .empty-cell {
          background: var(--card-bg);
        }

        .range-column {
          padding: 12px;
          text-align: center;
          border-right: 1px solid var(--border-color);
        }

        .range-label {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 1.2rem;
        }

        .range-value {
          padding: 12px;
          text-align: center;
          font-size: 1rem;
          color: var(--text-secondary);
          border-right: 1px solid var(--border-color);
        }

        .direction-label {
          padding: 8px;
          text-align: center;
          font-size: 1rem;
          font-weight: 600;
          background: var(--bg-secondary);
        }

        .direction-label.up {
          color: var(--success-color);
        }

        .direction-label.dn {
          color: var(--danger-color);
        }

        .target-cell {
          padding: 10px;
          text-align: center;
          font-size: 1rem;
          color: var(--text-secondary);
          border-right: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .pivot-range-grid {
            overflow-x: auto;
          }

          .grid-header,
          .range-values-row,
          .direction-headers,
          .pivot-row {
            min-width: 800px;
          }
        }
      `}</style>
    </div>
  );
};

export default PivotRangeBlock;
