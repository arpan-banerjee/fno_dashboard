import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import DynamicNumbersBar from '../components/DynamicNumbersBar';
import IndexTabs from '../components/IndexTabs';
import OptionChainHeader from '../components/OptionChainHeader';
import OptionChainTable from '../components/OptionChainTable';
import PivotRangeBlock from '../components/PivotRangeBlock';
import SummaryRow from '../components/SummaryRow';
import DashboardFooter from '../components/DashboardFooter';
import { useOptionChain } from '../hooks/useOptionChain';
import { useIVDEX } from '../hooks/useIVDEX';
import axios from 'axios';

export default function DashboardPage() {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  // State for Row 5 + Row 6
  const [selectedSymbol, setSelectedSymbol] = useState<string>('NIFTY');
  const [selectedExpiryDate, setSelectedExpiryDate] = useState<string>('');
  const [spotPrice, setSpotPrice] = useState<number>(19650);
  const [previousSessionData, setPreviousSessionData] = useState({
    high: 19886.4,
    low: 19413.6,
    close: 19610.7,
  });

  // Fetch option chain data for summary calculations
  const { data: optionChainData } = useOptionChain(selectedSymbol, selectedExpiryDate);
  
  // Fetch IV/VIX data
  const { data: ivData } = useIVDEX(selectedSymbol);
  const volatility = ivData?.currentIV || 15; // Default 15% if not available

  // Handle symbol change from IndexTabs
  const handleSymbolChange = (symbol: string) => {
    console.log('📌 Symbol changed to:', symbol);
    setSelectedSymbol(symbol);
    // Reset expiry when symbol changes
    setSelectedExpiryDate('');
  };

  // Handle expiry change from IndexTabs
  const handleExpiryChange = (expiry: string) => {
    console.log('📅 Expiry changed to:', expiry);
    setSelectedExpiryDate(expiry);
  };

  // Fetch spot price and previous session data
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch spot price
        const spotResponse = await axios.get(
          `http://localhost:4000/market/spot-price?symbol=${selectedSymbol}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (spotResponse.data.spotPrice) {
          setSpotPrice(spotResponse.data.spotPrice);
        }

        // Fetch previous session data
        const sessionResponse = await axios.get(
          `http://localhost:4000/market/previous-session/${selectedSymbol}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (sessionResponse.data.previousSession) {
          setPreviousSessionData(sessionResponse.data.previousSession);
        }
      } catch (error) {
        console.error('Failed to fetch market data:', error);
      }
    };

    if (selectedSymbol) {
      fetchMarketData();
    }
  }, [selectedSymbol]);

  // Start polling when symbol and expiry are selected
  useEffect(() => {
    if (selectedSymbol && selectedExpiryDate) {
      const startPolling = async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.post(
            'http://localhost:4000/market/polling/start',
            {
              symbol: selectedSymbol,
              expiry: selectedExpiryDate,
              interval: 5000, // 5 seconds (reduced to prevent rate limiting)
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          console.log(`📊 Started polling for ${selectedSymbol} ${selectedExpiryDate}`);
        } catch (error) {
          console.error('Failed to start polling:', error);
        }
      };

      startPolling();

      // Cleanup: Stop polling when unmounting or changing selection
      return () => {
        const stopPolling = async () => {
          try {
            const token = localStorage.getItem('token');
            await axios.post(
              'http://localhost:4000/market/polling/stop',
              {
                symbol: selectedSymbol,
                expiry: selectedExpiryDate,
              },
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            console.log(`⏹️  Stopped polling for ${selectedSymbol} ${selectedExpiryDate}`);
          } catch (error) {
            console.error('Failed to stop polling:', error);
          }
        };

        stopPolling();
      };
    }
  }, [selectedSymbol, selectedExpiryDate]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if API call fails, clear local state
      logout();
      navigate('/login');
    }
  };

  const handleAdmin = () => {
    navigate('/admin');
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      {/* Row 1: Header - Sticky */}
      <Box sx={{ position: 'sticky', top: 0, zIndex: 1100, bgcolor: 'background.paper' }}>
        <Typography variant="h5" align="center" fontWeight="bold" sx={{ py: 1 }}>
          OPTION BUYERS' DASHBOARD
        </Typography>
      </Box>

      {/* Row 2: Golden Subheader - Sticky */}
      <Box
        sx={{
          position: 'sticky',
          top: 40,
          zIndex: 1099,
          bgcolor: 'background.paper', // Remove yellow
          color: 'inherit',
          py: 0.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 2,
        }}
      >
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ color: '#FFD700', fontSize: '1.5rem', fontWeight: 600, flex: 1, textAlign: 'center' }}>
            PRIMEXA Learning Series WhatsApp 9836001579
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2, justifyContent: 'flex-end' }}>
            {user?.role === 'superadmin' || user?.role === 'admin' ? (
              <button onClick={handleAdmin}>Admin</button>
            ) : null}
            <button>Refresh</button>
            <button onClick={handleLogout}>Logout</button>
          </Box>
        </Box>
      </Box>

      {/* Row 3: Dynamic Numbers Bar - Sticky */}
      <DynamicNumbersBar />

      {/* Row 4: Index Tabs with Live Prices - Sticky */}
      <IndexTabs 
        onSymbolChange={handleSymbolChange}
        onExpiryChange={handleExpiryChange}
      />

      {/* Row 5: Option Chain Header (CE/PE with IV trend) */}
      {selectedExpiryDate && (
        <OptionChainHeader symbol={selectedSymbol} />
      )}

      {/* Row 6: Option Chain Table */}
      {selectedExpiryDate ? (
        <Box sx={{ 
          overflow: 'auto', 
          p: 2,
          position: 'relative',
          zIndex: 1,
          mb: 3,
          width: '100%'
        }}>
          <OptionChainTable 
            symbol={selectedSymbol} 
            expiry={selectedExpiryDate} 
          />
        </Box>
      ) : (
        <Box sx={{ 
          minHeight: '400px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: 2
        }}>
          <Typography variant="h6" color="text.secondary">
            Select an expiry date from the dropdown above
          </Typography>
        </Box>
      )}

      {/* Summary Row with Totals and Greeks */}
      {selectedExpiryDate && (
        <Box sx={{ 
          p: 2,
          mt: 0,
          position: 'relative',
          zIndex: 2,
          mb: 0
        }}>
          <SummaryRow
            optionChainData={optionChainData}
            spotPrice={spotPrice}
            expiryDate={selectedExpiryDate}
            volatility={volatility}
          />
        </Box>
      )}

      {/* Row 24-29: Pivot + Range Block */}
      {selectedExpiryDate && (
        <Box sx={{ 
          p: 2, 
          mt: 0,
          position: 'relative',
          zIndex: 2,
          mb: 0
        }}>
          <PivotRangeBlock
            previousHigh={previousSessionData.high}
            previousLow={previousSessionData.low}
            previousClose={previousSessionData.close}
            currentClose={spotPrice}
            volatility={volatility}
            spotPrice={spotPrice}
          />
        </Box>
      )}

      {/* Row 32: Footer Warning */}
      <DashboardFooter />
    </Box>
  );
}
