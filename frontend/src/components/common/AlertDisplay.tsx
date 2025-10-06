// src/components/common/AlertDisplay.tsx
import React, { useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../pages/storeHooks';
import { removeAlert } from '../../features/alert/alertSlice';
import type { AlertItem } from '../../types/domains';

const AlertDisplay: React.FC = () => {
  const dispatch = useAppDispatch();
  const alerts = useAppSelector((state) => state.alert.alerts);

  useEffect(() => {
    alerts.forEach((alert: AlertItem) => {
      if (alert.timeout) {
        const timer = setTimeout(() => dispatch(removeAlert(alert.id)), alert.timeout);
        return () => clearTimeout(timer);
      }
    });
  }, [alerts, dispatch]);

  return (
    <>
      {alerts.map((alert: AlertItem, index: number) => (
        <Snackbar key={alert.id} open autoHideDuration={alert.timeout || 5000}>
          <Alert severity={alert.severity || 'info'} variant="filled">
            {alert.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};

export default AlertDisplay;
