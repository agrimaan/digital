import React from 'react';
import { Typography, makeStyles } from '@mui/material';
import ProductList from '../../components/buyer/ProductList';

const useStyles = makeStyles((theme) => ({
  title: {
    marginBottom: theme.spacing(3),
  },
}));

const MarketplacePage = () => {
  const classes = useStyles();
  
  return (
    <div>
      <Typography variant="h4" className={classes.title}>
        Marketplace
      </Typography>
      <ProductList />
    </div>
  );
};

export default MarketplacePage;
