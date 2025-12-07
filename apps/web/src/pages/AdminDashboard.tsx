import { Container, Typography, Paper, Grid, Button, Box } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/admin';
import BackButton from '../components/BackButton';

export default function AdminDashboard() {
  const { data: counters } = useQuery({
    queryKey: ['adminCounters'],
    queryFn: adminApi.getCounters,
  });

  const { data: settings } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: adminApi.getSettings,
  });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <BackButton />
        <Typography variant="h4">
          Admin Dashboard
        </Typography>
      </Box>

      {/* Counters */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">{counters?.totalUsers || 0}</Typography>
            <Typography variant="caption">Total Users</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">{counters?.freeUsers || 0}</Typography>
            <Typography variant="caption">Free Users</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">{counters?.paidUsers || 0}</Typography>
            <Typography variant="caption">Paid Users</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">₹{counters?.totalRevenue || 0}</Typography>
            <Typography variant="caption">Total Revenue</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Settings */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Plan Settings
        </Typography>
        <Typography variant="body2">Free Trial: {settings?.freeTrialDays} days</Typography>
        <Typography variant="body2">90-day Plan: ₹{settings?.planRates.paid_90}</Typography>
        <Typography variant="body2">180-day Plan: ₹{settings?.planRates.paid_180}</Typography>
        <Typography variant="body2">365-day Plan: ₹{settings?.planRates.paid_365}</Typography>
        <Typography variant="body2">Tax: {settings?.taxPercent}%</Typography>
        <Button variant="outlined" sx={{ mt: 2 }}>
          Edit Settings
        </Button>
      </Paper>

      {/* User Management */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          User Management
        </Typography>
        <Typography variant="body2">User list and management features to be implemented...</Typography>
      </Paper>
    </Container>
  );
}
