import React from 'react';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import { useOptionChain } from '../hooks/useOptionChain';
import { useOptionChainWebSocket } from '../hooks/useWebSocket';

interface OptionChainTableProps {
  symbol: string;
  expiry: string;
}

/**
 * Row 6: Option Chain Table - Mirrored Layout
 * 17-column table: 8 CE (left) + Strike/PCR (center) + 8 PE (right)
 */
export default function OptionChainTable({
  symbol,
  expiry,
}: OptionChainTableProps) {
  // Use WebSocket for real-time updates
  const { optionChainData } = useOptionChainWebSocket(symbol, expiry);
  
  // Fallback to REST API if WebSocket not connected or no data yet
  const { data: restData, isLoading, error } = useOptionChain(symbol, expiry);
  
  // Prefer WebSocket data over REST data
  let data = optionChainData || restData;
  
  // Limit to 17 strikes centered around ATM
  if (data && data.strikes && data.strikes.length > 17) {
    const atmIndex = data.strikes.findIndex((strike: any) => strike.isATM);
    
    if (atmIndex !== -1) {
      // Get 8 strikes before ATM, ATM itself, and 8 strikes after ATM (total 17)
      const startIndex = Math.max(0, atmIndex - 8);
      const endIndex = Math.min(data.strikes.length, atmIndex + 9);
      
      // Adjust if we don't have enough strikes on either side
      let adjustedStart = startIndex;
      let adjustedEnd = endIndex;
      
      if (endIndex - startIndex < 17) {
        if (startIndex === 0) {
          adjustedEnd = Math.min(data.strikes.length, 17);
        } else if (endIndex === data.strikes.length) {
          adjustedStart = Math.max(0, data.strikes.length - 17);
        }
      }
      
      data = {
        ...data,
        strikes: data.strikes.slice(adjustedStart, adjustedEnd)
      };
    } else {
      // If no ATM found, just take first 17 strikes
      data = {
        ...data,
        strikes: data.strikes.slice(0, 17)
      };
    }
  }

  if (isLoading && !data) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px',
        }}
      >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading Option Chain...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          padding: '20px',
          textAlign: 'center',
          color: '#f44336',
        }}
      >
        <Typography>Failed to load option chain</Typography>
      </Box>
    );
  }

  if (!data) {
    return null;
  }

  // Helper functions
  const calculatePCR = (strike: any): number => {
    const callOI = strike.ceOI || 0;
    const putOI = strike.peOI || 0;
    return callOI > 0 ? putOI / callOI : 0;
  };

  // Determine if we need dark text on light background or light text on dark background
  const getContrastTextColor = (bgColor: string): string => {
    // If background is transparent or not set, use dark text
    if (!bgColor || bgColor === 'transparent') {
      return '#1a1a1a';
    }
    
    // Convert hex to RGB
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return dark text for light backgrounds, light text for dark backgrounds
    return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
  };

  const calculateDelta = (strike: number, spotPrice: number, optionType: string): number => {
    const moneyness = optionType === 'CE' 
      ? (spotPrice - strike) / spotPrice 
      : (strike - spotPrice) / spotPrice;
    
    if (optionType === 'CE') {
      return moneyness > 0 ? Math.min(0.5 + (moneyness * 50), 1) : Math.max(0.5 - (Math.abs(moneyness) * 50), 0);
    } else {
      return moneyness > 0 ? Math.max(-0.5 - (moneyness * 50), -1) : Math.min(-0.5 + (Math.abs(moneyness) * 50), 0);
    }
  };

  const calculateOIChangePercent = (oi: number, oiChange: number): number => {
    const prevOI = oi - oiChange;
    return prevOI > 0 ? (oiChange / prevOI) * 100 : 0;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        {/* Header Info */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: '#676767',
            borderBottom: '1px solid #e0e0e0',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#fff' }}>
            Spot: ₹{data.spotPrice.toLocaleString()}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#fff' }}>
            ATM: {data.atmStrike}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#fff' }}>
            PCR: {data.pcr}
          </Typography>
          <Typography variant="body2" sx={{ color: '#fff' }}>
            Expiry: {expiry}
          </Typography>
        </Box>

        {/* New Mirrored Table Layout: 8 CE + Strike/PCR + 8 PE */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(8, 1fr) 150px repeat(8, 1fr)',
          gap: '1px',
          background: '#e0e0e0',
          p: 0
        }}>
          {/* Headers Row */}
          {/* CE Headers (Green) */}
          <HeaderCell bgColor="#e8f5e9">Built Up</HeaderCell>
          <HeaderCell bgColor="#e8f5e9">ITVitm/IV</HeaderCell>
          <HeaderCell bgColor="#e8f5e9">Volume</HeaderCell>
          <HeaderCell bgColor="#e8f5e9">Delta/Gamma</HeaderCell>
          <HeaderCell bgColor="#e8f5e9">Alpha/Vega</HeaderCell>
          <HeaderCell bgColor="#e8f5e9">OI/OI Chg</HeaderCell>
          <HeaderCell bgColor="#e8f5e9">OI Chg %</HeaderCell>
          <HeaderCell bgColor="#e8f5e9">LTP/LTP Chg</HeaderCell>
          
          {/* Center Column (Black) */}
          <HeaderCell bgColor="#424242" color="white">Strike/PCR</HeaderCell>
          
          {/* PE Headers (Red) */}
          <HeaderCell bgColor="#ffebee">LTP/LTP Chg</HeaderCell>
          <HeaderCell bgColor="#ffebee">OI Chg %</HeaderCell>
          <HeaderCell bgColor="#ffebee">OI/OI Chg</HeaderCell>
          <HeaderCell bgColor="#ffebee">Alpha/Vega</HeaderCell>
          <HeaderCell bgColor="#ffebee">Delta/Gamma</HeaderCell>
          <HeaderCell bgColor="#ffebee">Volume</HeaderCell>
          <HeaderCell bgColor="#ffebee">TVitm/IV</HeaderCell>
          <HeaderCell bgColor="#ffebee">Built Up</HeaderCell>

          {/* Data Rows */}
          {data.strikes.map((strike: any) => {
            const pcr = calculatePCR(strike);
            const isATM = strike.isATM;
            const ceDelta = calculateDelta(strike.strikePrice, data.spotPrice, 'CE');
            const peDelta = calculateDelta(strike.strikePrice, data.spotPrice, 'PE');
            const ceOIChangePercent = calculateOIChangePercent(strike.ceOI, strike.ceOIChange);
            const peOIChangePercent = calculateOIChangePercent(strike.peOI, strike.peOIChange);
            // Use existing buildup from API data
            const ceBuildup = strike.ceBuiltUp || '-';
            const peBuildup = strike.peBuiltUp || '-';
            const ceBuiltUpColor = strike.ceBuiltUpColor || 'transparent';
            const peBuiltUpColor = strike.peBuiltUpColor || 'transparent';

            return (
              <React.Fragment key={strike.strikePrice}>
                {/* CE Data (Left - Green background) */}
                <DataCell bgColor={isATM ? '#fff9c4' : '#f1f8e9'}>
                  {ceBuildup !== '-' && (
                    <Box sx={{ 
                      px: 0.5, 
                      py: 0.25, 
                      borderRadius: 1,
                      background: ceBuiltUpColor,
                      color: getContrastTextColor(ceBuiltUpColor),
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      display: 'inline-block'
                    }}>
                      {ceBuildup}
                    </Box>
                  )}
                </DataCell>
                
                <DataCell bgColor={isATM ? '#fff9c4' : '#f1f8e9'}>
                  <MergedCell 
                    top={strike.ceIV?.toFixed(2) || '-'} 
                    bottom={strike.ceTV?.toFixed(2) || '-'} 
                  />
                </DataCell>
                
                <DataCell bgColor={isATM ? '#fff9c4' : '#f1f8e9'}>
                  {formatNumber(strike.ceVolume || 0)}
                </DataCell>
                
                <DataCell bgColor={isATM ? '#fff9c4' : '#f1f8e9'}>
                  <MergedCell 
                    top={strike.ceDelta?.toFixed(4) || ceDelta.toFixed(2)} 
                    bottom={strike.ceGamma?.toFixed(4) || '-'} 
                  />
                </DataCell>
                
                <DataCell bgColor={isATM ? '#fff9c4' : '#f1f8e9'}>
                  <MergedCell 
                    top={(strike.ceVega ? (strike.ceVega / 100).toFixed(4) : '-')} 
                    bottom={strike.ceVega?.toFixed(2) || '-'} 
                  />
                </DataCell>
                
                <DataCell bgColor={isATM ? '#fff9c4' : '#f1f8e9'}>
                  <MergedCell 
                    top={formatNumber(strike.ceOI || 0)} 
                    bottom={`${strike.ceOIChange > 0 ? '+' : ''}${formatNumber(strike.ceOIChange || 0)}`}
                    bottomColor={strike.ceOIChange > 0 ? '#4caf50' : strike.ceOIChange < 0 ? '#f44336' : undefined}
                  />
                </DataCell>
                
                <DataCell bgColor={isATM ? '#fff9c4' : '#f1f8e9'}>
                  <Typography sx={{ 
                    color: ceOIChangePercent > 0 ? '#4caf50' : ceOIChangePercent < 0 ? '#f44336' : 'inherit',
                    fontWeight: 600,
                    fontSize: '0.85rem'
                  }}>
                    {ceOIChangePercent.toFixed(1)}%
                  </Typography>
                </DataCell>
                
                <DataCell bgColor={isATM ? '#fff9c4' : '#f1f8e9'}>
                  <MergedCell 
                    top={`₹${strike.ceLTP?.toFixed(2) || '0.00'}`} 
                    bottom={`${strike.ceLTPChange > 0 ? '+' : ''}${strike.ceLTPChange?.toFixed(2) || '0.00'}`}
                    bottomColor={strike.ceLTPChange > 0 ? '#4caf50' : strike.ceLTPChange < 0 ? '#f44336' : undefined}
                  />
                </DataCell>

                {/* Center Column - Strike/PCR (Black) */}
                <DataCell 
                  bgColor={isATM ? '#fdd835' : '#424242'} 
                  color={isATM ? '#000' : 'white'}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: 'inherit' }}>
                      {strike.strikePrice}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      fontSize: '0.75rem',
                      color: isATM ? '#000' : pcr > 1.3 ? '#4caf50' : pcr < 0.6 ? '#f44336' : 'inherit'
                    }}>
                      {pcr.toFixed(2)}
                    </Typography>
                  </Box>
                </DataCell>

                {/* PE Data (Right - Red background) */}
                <DataCell bgColor={isATM ? '#fff9c4' : '#ffebee'}>
                  <MergedCell 
                    top={`₹${strike.peLTP?.toFixed(2) || '0.00'}`} 
                    bottom={`${strike.peLTPChange > 0 ? '+' : ''}${strike.peLTPChange?.toFixed(2) || '0.00'}`}
                    bottomColor={strike.peLTPChange > 0 ? '#4caf50' : strike.peLTPChange < 0 ? '#f44336' : undefined}
                  />
                </DataCell>
                
                <DataCell bgColor={isATM ? '#fff9c4' : '#ffebee'}>
                  <Typography sx={{ 
                    color: peOIChangePercent > 0 ? '#4caf50' : peOIChangePercent < 0 ? '#f44336' : 'inherit',
                    fontWeight: 600,
                    fontSize: '0.85rem'
                  }}>
                    {peOIChangePercent.toFixed(1)}%
                  </Typography>
                </DataCell>
                
                <DataCell bgColor={isATM ? '#fff9c4' : '#ffebee'}>
                  <MergedCell 
                    top={formatNumber(strike.peOI || 0)} 
                    bottom={`${strike.peOIChange > 0 ? '+' : ''}${formatNumber(strike.peOIChange || 0)}`}
                    bottomColor={strike.peOIChange > 0 ? '#4caf50' : strike.peOIChange < 0 ? '#f44336' : undefined}
                  />
                </DataCell>
                
                <DataCell bgColor={isATM ? '#fff9c4' : '#ffebee'}>
                  <MergedCell 
                    top={(strike.peVega ? (strike.peVega / 100).toFixed(4) : '-')} 
                    bottom={strike.peVega?.toFixed(2) || '-'} 
                  />
                </DataCell>
                
                <DataCell bgColor={isATM ? '#fff9c4' : '#ffebee'}>
                  <MergedCell 
                    top={strike.peDelta?.toFixed(4) || peDelta.toFixed(2)} 
                    bottom={strike.peGamma?.toFixed(4) || '-'} 
                  />
                </DataCell>
                
                <DataCell bgColor={isATM ? '#fff9c4' : '#ffebee'}>
                  {formatNumber(strike.peVolume || 0)}
                </DataCell>
                
                <DataCell bgColor={isATM ? '#fff9c4' : '#ffebee'}>
                  <MergedCell 
                    top={strike.peIV?.toFixed(2) || '-'} 
                    bottom={strike.peTV?.toFixed(2) || '-'} 
                  />
                </DataCell>
                
                <DataCell bgColor={isATM ? '#fff9c4' : '#ffebee'}>
                  {peBuildup !== '-' && (
                    <Box sx={{ 
                      px: 0.5, 
                      py: 0.25, 
                      borderRadius: 1,
                      background: peBuiltUpColor,
                      color: getContrastTextColor(peBuiltUpColor),
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      display: 'inline-block'
                    }}>
                      {peBuildup}
                    </Box>
                  )}
                </DataCell>
              </React.Fragment>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
}

/**
 * Header Cell Component
 */
function HeaderCell({ 
  children, 
  bgColor, 
  color = '#000' 
}: { 
  children?: React.ReactNode; 
  bgColor: string;
  color?: string;
}) {
  return (
    <Box sx={{ 
      background: bgColor, 
      color: color,
      p: 1, 
      textAlign: 'center', 
      fontWeight: 600,
      fontSize: '0.85rem'
    }}>
      {children}
    </Box>
  );
}

/**
 * Data Cell Component
 */
function DataCell({ 
  children, 
  bgColor,
  color = '#1a1a1a'  // Default to dark text for better visibility on light backgrounds
}: { 
  children?: React.ReactNode; 
  bgColor: string;
  color?: string;
}) {
  return (
    <Box sx={{ 
      background: bgColor,
      color: color,
      p: 1, 
      textAlign: 'center', 
      fontSize: '0.85rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50px',
      fontWeight: 500  // Medium weight for better readability
    }}>
      {children}
    </Box>
  );
}

/**
 * Merged Cell Component (Top/Bottom with smaller font)
 */
function MergedCell({ 
  top, 
  bottom,
  bottomColor
}: { 
  top: string; 
  bottom: string;
  bottomColor?: string;
}) {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '2px' 
    }}>
      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#1a1a1a' }}>
        {top}
      </Typography>
      <Typography 
        variant="caption" 
        sx={{ 
          fontSize: '0.7rem', 
          color: bottomColor || '#424242',  // Darker gray for better visibility
          fontWeight: 500
        }}
      >
        {bottom}
      </Typography>
    </Box>
  );
}
