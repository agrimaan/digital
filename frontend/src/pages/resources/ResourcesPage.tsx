// src/pages/resources/ResourcesPage.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../storeHooks';
import { fetchResources, createBooking } from '../../features/resources/resourcesSlice';
import type { Resource } from '../../types/agrimaan';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Alert,
} from '@mui/material';

export default function ResourcesPage() {
  const dispatch = useAppDispatch();
  const { list, loading, error } = useAppSelector((state) => state.resources);
  const userId = useAppSelector((state) => state.auth.user?.id) ?? '';

  const [open, setOpen] = useState(false);
  // Change: Store the entire selected resource object
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [start, setStart] = useState<string>('');
  const [end, setEnd] = useState<string>('');

  useEffect(() => {
    dispatch(fetchResources());
  }, [dispatch]);

  const handleBookClick = (resource: Resource) => {
    setSelectedResource(resource);
    setOpen(true);
  };

  const book = async () => {
    if (!selectedResource || !userId || !start || !end) {
      // Add more specific feedback if needed, e.g., using a toast or alert
      return;
    }

    // Calculate duration in hours
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (endDate <= startDate) {
      // Provide user feedback for invalid dates
      return;
    }
    const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

    // Calculate price based on hourly rate
    const price = selectedResource.hourlyRate * durationHours;

    // Dispatch the booking creation with the calculated price
    await dispatch(
      createBooking({
        resourceId: selectedResource.id,
        requesterId: userId,
        start,
        end,
        price, // Fix: Use the calculated price
      })
    );
    setOpen(false);
    setSelectedResource(null);
    setStart('');
    setEnd('');
  };

  if (loading) return <LinearProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <>
      <Grid container spacing={2}>
        {list.map((r: Resource) => (
          <Grid item xs={12} md={6} lg={4} key={r.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{r.name}</Typography>
                <Typography variant="body2">
                  {r.type} • {r.location}
                </Typography>
                <Typography variant="body2">₹{r.hourlyRate}/hr</Typography>
                <Button
                  sx={{ mt: 1 }}
                  variant="contained"
                  disabled={!r.available}
                  onClick={() => handleBookClick(r)}
                >
                  {r.available ? 'Book' : 'Unavailable'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {!list.length && (
          <Grid item xs={12}>
            <Typography>No resources found</Typography>
          </Grid>
        )}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>
          Book {selectedResource?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" sx={{ mt: 1 }}>
            Hourly Rate: ₹{selectedResource?.hourlyRate}/hr
          </Typography>
          <TextField
            label="Start"
            type="datetime-local"
            fullWidth
            sx={{ mt: 1 }}
            value={start}
            onChange={(e) => setStart(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End"
            type="datetime-local"
            fullWidth
            sx={{ mt: 2 }}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button sx={{ mt: 2 }} variant="contained" onClick={book}>
            Confirm Booking
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}