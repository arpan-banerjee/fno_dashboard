import { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  Typography,
  Chip,
  Skeleton,
  Alert,
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { INDEX_TABS } from '../types/market.types';
import { useIndexLivePrice } from '../hooks/useIndexLivePrice';
import { useIndexExpiries } from '../hooks/useIndexExpiries';

interface TabPanelProps {
  symbol: string;
  label: string;
  isActive: boolean;
  isLink?: boolean;
  badge?: string;
}

interface TabPanelCallbacks {
  onExpiryChange?: (expiry: string) => void;
}

function IndexTabPanel({ 
  symbol, 
  label, 
  isActive, 
  isLink, 
  badge,
  onExpiryChange 
}: TabPanelProps & TabPanelCallbacks) {
  const [selectedExpiry, setSelectedExpiry] = useState<string>('');
  
  const { data: quote, isLoading: quoteLoading, error: quoteError } = useIndexLivePrice(
    symbol,
    isActive && !isLink
  );
  
  const { data: expiries, isLoading: expiriesLoading } = useIndexExpiries(
    symbol,
    isActive && !isLink
  );

  // Auto-select first expiry when expiries load or tab becomes active
  useEffect(() => {
    if (isActive && expiries && expiries.expiries.length > 0 && !selectedExpiry) {
      const firstExpiry = expiries.expiries[0].date;
      console.log(`Auto-selecting first expiry for ${symbol}:`, firstExpiry);
      setSelectedExpiry(firstExpiry);
      if (onExpiryChange) {
        onExpiryChange(firstExpiry);
      }
    }
  }, [isActive, expiries, selectedExpiry, symbol, onExpiryChange]);

  // Reset selected expiry when tab becomes inactive
  useEffect(() => {
    if (!isActive) {
      setSelectedExpiry('');
    }
  }, [isActive]);

  // Handle expiry change
  const handleExpiryChange = (expiry: string) => {
    console.log(`Expiry changed for ${symbol}:`, expiry);
    setSelectedExpiry(expiry);
    if (onExpiryChange) {
      onExpiryChange(expiry);
    }
  };

  // For link tabs (FNO), just show the label
  if (isLink) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
        {badge && (
          <Chip
            label={badge}
            size="small"
            color="info"
            sx={{ height: 18, fontSize: '0.65rem' }}
          />
        )}
      </Box>
    );
  }

  // Loading state
  if (quoteLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, px: 2 }}>
        <Skeleton variant="text" width={80} height={20} />
        <Skeleton variant="text" width={100} height={24} />
        <Skeleton variant="rectangular" width={120} height={32} />
      </Box>
    );
  }

  // Error state
  if (quoteError) {
    return (
      <Box sx={{ px: 2 }}>
        <Alert severity="error" sx={{ py: 0, fontSize: '0.75rem' }}>
          Failed to load {label}
        </Alert>
      </Box>
    );
  }

  // No data (e.g., Bankex placeholder)
  if (!quote) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, px: 2 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        {badge && (
          <Chip
            label={badge}
            size="small"
            color="warning"
            sx={{ height: 18, fontSize: '0.65rem', alignSelf: 'flex-start' }}
          />
        )}
      </Box>
    );
  }

  const isPositive = quote.change >= 0;
  const priceColor = isPositive ? 'success.main' : 'error.main';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, px: 2, minWidth: 180 }}>
      {/* Symbol Name */}
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
        {label}
      </Typography>

      {/* LTP with change indicator */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          {quote.ltp.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.25,
            color: priceColor,
          }}
        >
          {isPositive ? (
            <TrendingUp sx={{ fontSize: 16 }} />
          ) : (
            <TrendingDown sx={{ fontSize: 16 }} />
          )}
          <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
            {Math.abs(quote.change).toFixed(2)} ({Math.abs(quote.changePercent).toFixed(2)}%)
          </Typography>
        </Box>
      </Box>

      {/* Expiry Dropdown */}
      {isActive && (
        <FormControl size="small" sx={{ minWidth: 120, mt: 0.5 }}>
          <Select
            value={selectedExpiry || (expiries?.expiries[0]?.date ?? '')}
            onChange={(e) => handleExpiryChange(e.target.value)}
            displayEmpty
            disabled={expiriesLoading || !expiries}
            sx={{
              fontSize: '0.75rem',
              height: 32,
              '& .MuiSelect-select': {
                py: 0.5,
              },
            }}
          >
            {expiriesLoading ? (
              <MenuItem value="" disabled>
                Loading...
              </MenuItem>
            ) : expiries ? (
              expiries.expiries.map((expiry) => (
                <MenuItem key={expiry.date} value={expiry.date} sx={{ fontSize: '0.75rem' }}>
                  {expiry.label}
                </MenuItem>
              ))
            ) : (
              <MenuItem value="" disabled>
                No expiries
              </MenuItem>
            )}
          </Select>
        </FormControl>
      )}
    </Box>
  );
}

interface IndexTabsProps {
  onSymbolChange?: (symbol: string) => void;
  onExpiryChange?: (expiry: string) => void;
}

export default function IndexTabs({ 
  onSymbolChange, 
  onExpiryChange 
}: IndexTabsProps) {
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    const tab = INDEX_TABS[newValue];
    
    // If FNO tab, navigate to FNO page
    if (tab.isLink) {
      navigate('/fno');
      return;
    }
    
    setActiveTab(newValue);
    
    // Emit symbol change
    if (onSymbolChange) {
      onSymbolChange(tab.symbol);
    }
  };

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 136, // Below header (64px) + DynamicNumbersBar (72px)
        zIndex: 1097,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        boxShadow: 1,
      }}
    >
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          minHeight: 48,
          '& .MuiTab-root': {
            minHeight: 48,
            textTransform: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            px: 1,
            minWidth: 'auto',
          },
          '& .MuiTabs-scrollButtons': {
            '&.Mui-disabled': {
              opacity: 0.3,
            },
          },
        }}
      >
        {INDEX_TABS.map((tab, index) => (
          <Tab
            key={tab.id}
            label={
              <IndexTabPanel
                symbol={tab.symbol}
                label={tab.label}
                isActive={activeTab === index}
                isLink={tab.isLink}
                badge={tab.badge}
                onExpiryChange={onExpiryChange}
              />
            }
            sx={{
              borderRight: index < INDEX_TABS.length - 1 ? 1 : 0,
              borderColor: 'divider',
            }}
          />
        ))}
      </Tabs>
    </Box>
  );
}
