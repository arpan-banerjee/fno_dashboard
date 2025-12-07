import { Box, Container, Paper, TextField, Button, Typography, Link } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';

// Get or create a persistent device fingerprint
const getDeviceFingerprint = (): string => {
  let fingerprint = localStorage.getItem('device_fingerprint');
  if (!fingerprint) {
    // Create a unique fingerprint based on browser characteristics
    fingerprint = `device_${navigator.userAgent}_${screen.width}x${screen.height}_${new Date().getTime()}_${Math.random()}`;
    localStorage.setItem('device_fingerprint', fingerprint);
  }
  return fingerprint;
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const deviceFingerprint = getDeviceFingerprint();
      const response = await authApi.login({ email, password, device_fingerprint: deviceFingerprint });
      login(response);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={6} sx={{ p: 4, borderRadius: 2 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <img src="../../public/logo.png" alt="Logo" style={{ width: 180, marginBottom: 16 }} />
            <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
              Option Buyers' Dashboard
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Primexa Learning Series
            </Typography>
          </Box>

          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
            />
            
            {error && (
              <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link href="#" variant="body2">
                Download App
              </Link>
            </Box>
          </form>
        </Paper>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
          Default Login: primexa1967@gmail.com / ChangeMe!123
        </Typography>
      </Container>
    </Box>
  );
}
