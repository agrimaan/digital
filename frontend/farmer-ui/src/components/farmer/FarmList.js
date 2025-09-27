import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  makeStyles, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import api from '../../services/api';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  paper: {
    width: '100%',
    marginBottom: theme.spacing(2),
  },
  table: {
    minWidth: 650,
  },
  tableHeader: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
  },
  headerCell: {
    color: theme.palette.common.white,
    fontWeight: 'bold',
  },
  addButton: {
    marginBottom: theme.spacing(2),
  },
  actionCell: {
    display: 'flex',
    justifyContent: 'flex-start',
  },
}));

const FarmList = () => {
  const classes = useStyles();
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setFarms([
        { id: 1, name: 'Green Valley Farm', location: 'Karnataka', size: '5 acres', crops: 'Rice, Wheat', status: 'Active' },
        { id: 2, name: 'Sunshine Fields', location: 'Punjab', size: '10 acres', crops: 'Corn, Potatoes', status: 'Active' },
        { id: 3, name: 'Riverside Plantation', location: 'Kerala', size: '3 acres', crops: 'Banana, Coconut', status: 'Inactive' },
      ]);
      setLoading(false);
    }, 1000);
    
    // Actual API call would be:
    // const fetchFarms = async () => {
    //   try {
    //     const response = await api.get('/farms');
    //     setFarms(response.data);
    //     setLoading(false);
    //   } catch (error) {
    //     console.error('Error fetching farms:', error);
    //     setLoading(false);
    //   }
    // };
    // fetchFarms();
  }, []);
  
  if (loading) {
    return <Typography>Loading farms...</Typography>;
  }
  
  return (
    <div className={classes.root}>
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        className={classes.addButton}
      >
        Add New Farm
      </Button>
      
      <TableContainer component={Paper}>
        <Table className={classes.table}>
          <TableHead className={classes.tableHeader}>
            <TableRow>
              <TableCell className={classes.headerCell}>Farm Name</TableCell>
              <TableCell className={classes.headerCell}>Location</TableCell>
              <TableCell className={classes.headerCell}>Size</TableCell>
              <TableCell className={classes.headerCell}>Crops</TableCell>
              <TableCell className={classes.headerCell}>Status</TableCell>
              <TableCell className={classes.headerCell}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {farms.map((farm) => (
              <TableRow key={farm.id}>
                <TableCell>{farm.name}</TableCell>
                <TableCell>{farm.location}</TableCell>
                <TableCell>{farm.size}</TableCell>
                <TableCell>{farm.crops}</TableCell>
                <TableCell>{farm.status}</TableCell>
                <TableCell className={classes.actionCell}>
                  <Tooltip title="View">
                    <IconButton size="small" color="primary">
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton size="small" color="primary">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="secondary">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default FarmList;
