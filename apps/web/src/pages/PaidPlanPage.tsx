import { Box, Container, Typography, Paper, Button } from '@mui/material';
import BackButton from '../components/BackButton';

export default function PaidPlanPage() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box sx={{ mb: 2 }}>
        <BackButton />
      </Box>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom color="warning.main">
          Your Free Trial Has Expired
        </Typography>
        <Typography variant="body1" paragraph>
          Continue using the Option Buyers' Dashboard with a paid plan
        </Typography>

        <Box sx={{ my: 4 }}>
          <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
            <Typography variant="h6">90-Day Plan</Typography>
            <Typography variant="h5" color="primary">₹999</Typography>
            <Button variant="contained" sx={{ mt: 1 }}>Subscribe</Button>
          </Paper>
          <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
            <Typography variant="h6">180-Day Plan</Typography>
            <Typography variant="h5" color="primary">₹1799</Typography>
            <Typography variant="caption" color="success.main">Most Popular</Typography>
            <Button variant="contained" sx={{ mt: 1 }}>Subscribe</Button>
          </Paper>
          <Paper sx={{ p: 2 }} variant="outlined">
            <Typography variant="h6">365-Day Plan</Typography>
            <Typography variant="h5" color="primary">₹2999</Typography>
            <Typography variant="caption" color="success.main">Best Value</Typography>
            <Button variant="contained" sx={{ mt: 1 }}>Subscribe</Button>
          </Paper>
        </Box>

        <Typography variant="caption" color="text.secondary">
          Contact: WhatsApp 9836001579 | primexa1967@gmail.com
        </Typography>
      </Paper>
    </Container>
  );
}
