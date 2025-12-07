import { Box, Select, MenuItem, FormControl, Typography, keyframes, SelectChangeEvent } from '@mui/material';
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface MoodData {
  bull: number;
  bear: number;
  neutral: number;
}

interface OISpurt {
  active: boolean;
  strike: string;
  percent: number;
  timestamp: number;
}

interface DashboardData {
  mood: MoodData;
  oiSpurt: OISpurt;
  nextUpdate: number;
  symbol: string;
  interval: string;
}

// Blinking animation for timer
const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
`;

// Sky blue glow animation for OI spurt
const skyBlueGlow = keyframes`
  0%, 100% { box-shadow: 0 0 0 rgba(135, 206, 235, 0); }
  50% { box-shadow: 0 0 20px rgba(135, 206, 235, 0.8); }
`;

export default function DynamicNumbersBar() {
  const [selectedValue, setSelectedValue] = useState<string>('1m');
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    mood: { bull: 0, bear: 0, neutral: 0 },
    oiSpurt: { active: false, strike: '', percent: 0, timestamp: 0 },
    nextUpdate: 300,
    symbol: 'NIFTY',
    interval: '5m',
  });
  const [timer, setTimer] = useState<number>(300);
  const [showOIGlow, setShowOIGlow] = useState<boolean>(false);

  // Determine the actual interval to use for API calls
  const interval = selectedValue === 'auto' ? '1m' : selectedValue;

  // Fetch dashboard data
  useEffect(() => {
    // Don't fetch if interval is not set
    if (!interval) return;

    const fetchData = async () => {
      try {
        const response = await fetch(`http://localhost:4000/mood/dashboard-data?symbol=NIFTY&interval=${interval}`);
        const data = await response.json();
        setDashboardData(data);
        setTimer(data.nextUpdate);

        // Show OI glow if spurt detected
        if (data.oiSpurt.active) {
          setShowOIGlow(true);
          setTimeout(() => setShowOIGlow(false), 3000);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
    const fetchInterval = setInterval(fetchData, 5000); // Refresh every 5 seconds

    return () => clearInterval(fetchInterval);
  }, [interval]);

  // Update timer countdown
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTimer(prev => (prev > 0 ? prev - 1 : dashboardData.nextUpdate));
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [dashboardData.nextUpdate]);

  const handleIntervalChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setSelectedValue(value);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 72,
        zIndex: 1098,
        bgcolor: 'background.default',
        p: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        animation: showOIGlow ? `${skyBlueGlow} 3s ease-in-out` : 'none',
      }}
    >
      {/* Time Frequency Dropdown */}
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <Select
          value={selectedValue}
          onChange={handleIntervalChange}
          sx={{ 
            fontSize: '0.875rem',
            bgcolor: 'background.paper',
            '& .MuiSelect-select': {
              color: 'text.primary',
              py: 0.75,
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'divider',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'primary.main',
            },
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                bgcolor: 'background.paper',
                '& .MuiMenuItem-root': {
                  color: 'text.primary',
                  fontSize: '0.875rem',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                  '&.Mui-selected': {
                    bgcolor: 'action.selected',
                    '&:hover': {
                      bgcolor: 'action.selected',
                    },
                  },
                },
              },
            },
          }}
        >
          <MenuItem value="auto">Auto Mode</MenuItem>
          <MenuItem value="1m">1m</MenuItem>
          <MenuItem value="3m">3m</MenuItem>
          <MenuItem value="5m">5m</MenuItem>
          <MenuItem value="15m">15m</MenuItem>
          <MenuItem value="30m">30m</MenuItem>
          <MenuItem value="60m">60m</MenuItem>
          <MenuItem value="1D">1D</MenuItem>
        </Select>
      </FormControl>

      {/* Mood Index Bar */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Bull Icon */}
        <TrendingUp sx={{ color: 'success.main', fontSize: 24 }} />

        {/* Multi-color bar */}
        <Box sx={{ flex: 1, height: 24, display: 'flex', borderRadius: 1, overflow: 'hidden' }}>
          {/* Bull segment */}
          <Box
            sx={{
              width: `${dashboardData.mood.bull}%`,
              bgcolor: 'success.main',
              transition: 'width 0.5s ease-in-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.7rem' }}>
              {dashboardData.mood.bull > 10 && `${dashboardData.mood.bull}%`}
            </Typography>
          </Box>

          {/* Neutral segment */}
          <Box
            sx={{
              width: `${dashboardData.mood.neutral}%`,
              bgcolor: 'grey.500',
              transition: 'width 0.5s ease-in-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.7rem' }}>
              {dashboardData.mood.neutral > 10 && `${dashboardData.mood.neutral}%`}
            </Typography>
          </Box>

          {/* Bear segment */}
          <Box
            sx={{
              width: `${dashboardData.mood.bear}%`,
              bgcolor: 'error.main',
              transition: 'width 0.5s ease-in-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.7rem' }}>
              {dashboardData.mood.bear > 10 && `${dashboardData.mood.bear}%`}
            </Typography>
          </Box>
        </Box>

        {/* Bear Icon */}
        <TrendingDown sx={{ color: 'error.main', fontSize: 24 }} />
      </Box>

      {/* Next Update Timer */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          animation: timer < 3 ? `${blink} 0.5s linear infinite` : 'none',
        }}
      >
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Next:
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 45, textAlign: 'center' }}>
          {formatTime(timer)}
        </Typography>
      </Box>

      {/* OI Spurt Alert */}
      {dashboardData.oiSpurt.active && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            bgcolor: 'info.light',
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
          }}
        >
          <Typography variant="caption" sx={{ color: 'info.dark', fontWeight: 'bold' }}>
            OI Spurt:
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'info.dark' }}>
            {dashboardData.oiSpurt.strike}
          </Typography>
          <Typography variant="caption" sx={{ color: 'success.dark' }}>
            +{dashboardData.oiSpurt.percent}%
          </Typography>
        </Box>
      )}
    </Box>
  );
}
