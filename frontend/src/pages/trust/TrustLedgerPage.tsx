import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../storeHooks';
import { fetchTrustProfile } from '../../features/trustLedger/trustLedgerSlice';
import { Card, CardContent, Typography, LinearProgress, Box, Chip, Stack, Divider } from '@mui/material';
import type { LedgerEntry } from '../../types/agrimaan';
import { Alert } from '@mui/material';

export default function TrustLedgerPage() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector(state => state.auth.user?.id) ?? '';
  const { profile, loading, error } = useAppSelector(state => state.trust);

  useEffect(() => {
    if (userId) dispatch(fetchTrustProfile(userId));
  }, [dispatch, userId]);

  if (loading) return <LinearProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!profile) return <Typography>No trust profile found</Typography>;

  const { score, metrics, history } = profile;

  return (
    <Stack spacing={2}>
      <Card>
        <CardContent>
          <Typography variant="h6">Trust Score</Typography>
          <Box display="flex" alignItems="center" gap={2} mt={1}>
            <Typography variant="h3">{Math.round(score)}</Typography>
            <Chip label={`On-time: ${metrics.onTimeDelivery}`} />
            <Chip label={`Quality: ${metrics.qualityConsistency}`} />
            <Chip label={`Disputes: ${metrics.disputeRate}`} color="warning" />
            <Chip label={`Sustainability: ${metrics.sustainabilityScore}`} color="success" />
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6">Ledger History</Typography>
          <Divider sx={{ my: 2 }} />
    

          <Stack spacing={1}>
            {history.map((h: LedgerEntry) => (
              <Box key={h.id} display="flex" justifyContent="space-between" gap={2}>
                <Typography sx={{ minWidth: 140 }}>{h.type}</Typography>
                <Typography color={h.delta >= 0 ? 'success.main' : 'error.main'}>
                  {h.delta > 0 ? `+${h.delta}` : h.delta}
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                  {new Date(h.createdAt).toLocaleString()}
                </Typography>
              </Box>
            ))}
          </Stack>

        </CardContent>
      </Card>
    </Stack>
  );
}
