// src/pages/matchmaking/MatchMakingPage.tsx
import React, { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../storeHooks';
import {
  getRecommendationsForFarmer,
  getRecommendationsForBuyer,
} from '../../features/matchmaking/matchmakingSlice';
import type { MatchRecommendation } from '../../features/matchmaking/matchmakingSlice';
import {
  Card, CardContent, Typography, LinearProgress, Stack, Chip, Button, Alert, Box,
} from '@mui/material';

const MatchMakingPage: React.FC = () => {
  const dispatch = useAppDispatch();

  // ✅ read auth state
  const { user, isAuthenticated, loading: authLoading } = useAppSelector((s) => s.auth);

  // ✅ be defensive about backend shape
  const userId = (user as any)?.id ?? (user as any)?._id ?? '';
  const roleRaw = (user as any)?.role ?? (user as any)?.userType ?? '';
  const role = typeof roleRaw === 'string' ? roleRaw.toLowerCase() : '';

  // ✅ matchmaking state (ensure reducer is registered as "match" in store.ts)
  const { items, loading, error } = useAppSelector((s) => s.match);

  const fetchRecs = useCallback(() => {
    if (!userId || !role) return;
    if (role === 'farmer') dispatch(getRecommendationsForFarmer(userId));
    else if (role === 'buyer') dispatch(getRecommendationsForBuyer(userId));
  }, [dispatch, role, userId]);

  useEffect(() => {
    if (isAuthenticated && !authLoading) fetchRecs();
  }, [isAuthenticated, authLoading, fetchRecs]);

  // ⏳ wait until auth resolves to avoid false “not signed in”
  if (authLoading) return <LinearProgress />;

  // 🚪 guard after auth is loaded
  if (!isAuthenticated || !userId || !role) {
    return <Alert severity="warning">Please sign in to view matchmaking</Alert>;
  }

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h5">
          {role === 'farmer' ? 'Buyer matches for your listings' : 'Farmer matches for your preferences'}
        </Typography>
        <Button variant="outlined" onClick={fetchRecs} disabled={loading}>Refresh</Button>
      </Box>

      {loading && <LinearProgress />}
      {error && <Alert severity="error">{error}</Alert>}
      {!loading && !error && items.length === 0 && (
        <Alert severity="info">No matches yet — add listings or preferences, then refresh</Alert>
      )}

      {items.map((r: MatchRecommendation) => (
        <Card key={r.id}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <Typography variant="h6">
                {role === 'farmer'
                  ? `Buyer match for your ${r.crop}`
                  : `Farmer match for your ${r.crop} preference`}
              </Typography>
              <Chip
                label={`Fit: ${Math.round(r.score * 100)}%`}
                color={r.score > 0.75 ? 'success' : r.score > 0.5 ? 'primary' : 'default'}
                size="small"
              />
            </Box>

            <Stack spacing={0.5} sx={{ mt: 1 }}>
              {r.reasons.map((reason: string, idx: number) => (
                <Typography key={idx} variant="body2">• {reason}</Typography>
              ))}
            </Stack>

            <Box display="flex" gap={1} mt={2}>
              <Button variant="contained">{role === 'farmer' ? 'Contact Buyer' : 'Contact Farmer'}</Button>
              <Button variant="text">View Profile</Button>
            </Box>

            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Farmer: {r.farmerId} • Buyer: {r.buyerId}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
};

export default MatchMakingPage;
