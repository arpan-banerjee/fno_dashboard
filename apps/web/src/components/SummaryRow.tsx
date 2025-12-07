import React, { useMemo } from 'react';
import {
  calculateWeightedDelta,
  calculateBeta,
} from '@option-dashboard/shared';

interface SummaryRowProps {
  optionChainData: any | null;
  spotPrice: number;
  expiryDate: string;
  volatility: number;
}

const SummaryRow: React.FC<SummaryRowProps> = ({
  optionChainData,
  spotPrice,
  expiryDate,
  volatility,
}) => {
  // Calculate totals and Greeks
  const metrics = useMemo(() => {
    if (!optionChainData || !optionChainData.strikes) {
      return {
        volCE: 0,
        volPE: 0,
        callOI: 0,
        putOI: 0,
        pcr: 0,
        beta: 0,
      };
    }

    const strikes = optionChainData.strikes;

    // Calculate total volumes from API data
    const volCE = strikes.reduce((sum: number, strike: any) => sum + (strike.ceVolume || 0), 0);
    const volPE = strikes.reduce((sum: number, strike: any) => sum + (strike.peVolume || 0), 0);

    // Calculate total open interest from API data
    const callOI = strikes.reduce((sum: number, strike: any) => sum + (strike.ceOI || 0), 0);
    const putOI = strikes.reduce((sum: number, strike: any) => sum + (strike.peOI || 0), 0);

    // Calculate PCR (Put-Call Ratio) - Use backend PCR if available, otherwise calculate
    const pcr = optionChainData.pcr || (callOI > 0 ? putOI / callOI : 0);

    // Calculate weighted average Delta and Beta using strike data
    const options = strikes.flatMap((strike: any) => {
      const opts: Array<{ delta: number; openInterest: number; ltp: number }> = [];
      
      // Add CE option if it has valid data
      if (strike.ceLTP && strike.ceOI) {
        // Calculate delta for CE (approximate using moneyness)
        const ceDelta = strike.strikePrice < spotPrice ? 0.5 + (spotPrice - strike.strikePrice) / (2 * spotPrice) : 
                        strike.strikePrice > spotPrice ? 0.5 - (strike.strikePrice - spotPrice) / (2 * spotPrice) : 0.5;
        opts.push({
          delta: Math.max(0, Math.min(1, ceDelta)), // Clamp between 0 and 1
          openInterest: strike.ceOI,
          ltp: strike.ceLTP,
        });
      }
      
      // Add PE option if it has valid data
      if (strike.peLTP && strike.peOI) {
        // Calculate delta for PE (approximate using moneyness)
        const peDelta = strike.strikePrice > spotPrice ? -0.5 - (strike.strikePrice - spotPrice) / (2 * spotPrice) : 
                        strike.strikePrice < spotPrice ? -0.5 + (spotPrice - strike.strikePrice) / (2 * spotPrice) : -0.5;
        opts.push({
          delta: Math.max(-1, Math.min(0, peDelta)), // Clamp between -1 and 0
          openInterest: strike.peOI,
          ltp: strike.peLTP,
        });
      }
      
      return opts;
    });

    const weightedDelta = calculateWeightedDelta(
      options.map((o: any) => ({ delta: o.delta, openInterest: o.openInterest }))
    );

    // Calculate Beta using weighted delta and average option price
    const avgOptionPrice =
      options.reduce((sum: number, o: any) => sum + o.ltp, 0) / (options.length || 1);
    const beta = calculateBeta(weightedDelta, spotPrice, avgOptionPrice);

    return {
      volCE,
      volPE,
      callOI,
      putOI,
      pcr,
      beta,
    };
  }, [optionChainData, spotPrice, expiryDate, volatility]);

  // Determine PCR color and message
  const getPCRStyle = (pcr: number) => {
    if (pcr > 1.3) {
      return { color: 'var(--success-color)', message: 'Strongly Bullish' };
    } else if (pcr < 0.6) {
      return { color: 'var(--danger-color)', message: 'Strongly Bearish' };
    }
    return { color: 'var(--text-primary)', message: 'Neutral' };
  };

  const pcrStyle = getPCRStyle(metrics.pcr);

  // Format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 10000000) {
      return `${(num / 10000000).toFixed(2)}Cr`;
    } else if (num >= 100000) {
      return `${(num / 100000).toFixed(2)}L`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    }
    return num.toFixed(0);
  };

  return (
    <div className="summary-row">
      <div className="summary-grid">
        <div className="summary-item">
          <div className="summary-label">Vol CE (total)</div>
          <div className="summary-value">{formatNumber(metrics.volCE)}</div>
        </div>

        <div className="summary-item">
          <div className="summary-label">Vol PE (total)</div>
          <div className="summary-value">{formatNumber(metrics.volPE)}</div>
        </div>

        <div className="summary-item">
          <div className="summary-label">Call OI (total)</div>
          <div className="summary-value">{formatNumber(metrics.callOI)}</div>
        </div>

        <div className="summary-item">
          <div className="summary-label">Put OI (total)</div>
          <div className="summary-value">{formatNumber(metrics.putOI)}</div>
        </div>

        <div className="summary-item pcr-item" title={pcrStyle.message}>
          <div className="summary-label">PCR</div>
          <div className="summary-value" style={{ color: pcrStyle.color }}>
            {metrics.pcr.toFixed(3)}
          </div>
          <div className="pcr-message" style={{ color: pcrStyle.color }}>
            {pcrStyle.message}
          </div>
        </div>

        <div className="summary-item">
          <div className="summary-label">Beta</div>
          <div className="summary-value">{metrics.beta.toFixed(4)}</div>
        </div>
      </div>

      <style>{`
        .summary-row {
          background: var(--card-bg);
          border-radius: 8px;
          padding: 8px;
          margin: 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          position: relative;
          z-index: 1;
          clear: both;
          display: block;
          width: 100%;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 8px;
          position: relative;
          z-index: 1;
        }

        .summary-item {
          text-align: center;
          padding: 8px;
          background: var(--bg-secondary);
          border-radius: 6px;
          border: 1px solid var(--border-color);
        }

        .summary-label {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 8px;
          font-weight: 500;
        }

        .summary-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .pcr-item {
          position: relative;
        }

        .pcr-message {
          font-size: 0.75rem;
          margin-top: 4px;
          font-weight: 600;
        }

        @media (max-width: 1024px) {
          .summary-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        @media (max-width: 768px) {
          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .summary-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default SummaryRow;
