import { Box, Typography, CircularProgress } from '@mui/material';
import { useIVDEX } from '../hooks/useIVDEX';
import { useIVWebSocket } from '../hooks/useWebSocket';

interface OptionChainHeaderProps {
  symbol: string;
}

/**
 * Row 5: Option Chain Header
 * Displays CE/PE header with symbol and IV-based trend arrow
 */
export default function OptionChainHeader({ symbol }: OptionChainHeaderProps) {
  // Use WebSocket for real-time IV updates
  const { ivData: wsIVData, isConnected } = useIVWebSocket(symbol);
  
  // Fallback to REST API
  const { data: restIVData, isLoading } = useIVDEX(symbol);
  
  // Prefer WebSocket data over REST data
  const ivdexData = wsIVData || restIVData;

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backgroundColor: '#fff',
        borderBottom: '2px solid #e0e0e0',
      }}
    >
      {/* CE (Call) Header - 50% Green */}
      <Box
        sx={{
          flex: 1,
          backgroundColor: '#4caf50',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2px',
          fontWeight: 'bold',
          fontSize: '0.85rem',
        }}
      >
        CE (CALL)
      </Box>

      {/* Center: Symbol + IV Trend Arrow */}
      <Box
        sx={{
          width: '90px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2px',
          backgroundColor: '#676767',
          border: '1px solid #e0e0e0',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#fff', fontSize: '0.85rem' }}>
          {symbol}
        </Typography>

        {isLoading ? (
          <CircularProgress size={20} sx={{ mt: 1 }} />
        ) : ivdexData ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mt: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: '#fff',
                fontSize: '0.7rem',
              }}
            >
              IV: {ivdexData.currentIV}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: ivdexData.trendColor,
                fontWeight: 'bold',
                fontSize: '0.85rem',
              }}
            >
              {ivdexData.trend}
            </Typography>
          </Box>
        ) : (
          <Typography
            variant="body2"
            sx={{ color: '#fff', mt: 1, fontSize: '0.7rem' }}
          >
            Loading IV...
          </Typography>
        )}
      </Box>

      {/* PE (Put) Header - 50% Red */}
      <Box
        sx={{
          flex: 1,
          backgroundColor: '#f44336',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2px',
          fontWeight: 'bold',
          fontSize: '0.85rem',
        }}
      >
        PE (PUT)
      </Box>
    </Box>
  );
}
