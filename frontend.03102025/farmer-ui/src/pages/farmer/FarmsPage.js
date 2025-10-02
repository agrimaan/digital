import React from 'react';
import { Typography, makeStyles } from '@mui/material';
import FarmList from '../../components/farmer/FarmList';

const useStyles = makeStyles((theme) => ({
  title: {
    marginBottom: theme.spacing(3),
  },
}));

const FarmsPage = () => {
  const classes = useStyles();
  
  return (
    <div>
      <Typography variant="h4" className={classes.title}>
        My Farms
      </Typography>
      <FarmList />
    </div>
  );
};

export default FarmsPage;
