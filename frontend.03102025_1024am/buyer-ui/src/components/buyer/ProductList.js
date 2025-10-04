import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  CardActions, 
  Typography, 
  Button, 
  makeStyles,
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Search as SearchIcon, FilterList as FilterIcon } from '@mui/icons-material';
import api from '../../services/api';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  cardMedia: {
    paddingTop: '56.25%', // 16:9
  },
  cardContent: {
    flexGrow: 1,
  },
  searchBar: {
    marginBottom: theme.spacing(3),
    display: 'flex',
  },
  searchField: {
    flexGrow: 1,
    marginRight: theme.spacing(2),
  },
  price: {
    fontWeight: 'bold',
    color: theme.palette.primary.main,
  },
  farmer: {
    marginTop: theme.spacing(1),
    color: theme.palette.text.secondary,
  },
}));

const ProductList = () => {
  const classes = useStyles();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProducts([
        { 
          id: 1, 
          name: 'Organic Rice', 
          price: 45, 
          unit: 'kg', 
          quantity: 500, 
          farmer: 'Green Valley Farm', 
          location: 'Karnataka',
          image: 'https://via.placeholder.com/300x200?text=Rice'
        },
        { 
          id: 2, 
          name: 'Fresh Wheat', 
          price: 32, 
          unit: 'kg', 
          quantity: 1000, 
          farmer: 'Sunshine Fields', 
          location: 'Punjab',
          image: 'https://via.placeholder.com/300x200?text=Wheat'
        },
        { 
          id: 3, 
          name: 'Organic Potatoes', 
          price: 25, 
          unit: 'kg', 
          quantity: 300, 
          farmer: 'Riverside Plantation', 
          location: 'Kerala',
          image: 'https://via.placeholder.com/300x200?text=Potatoes'
        },
        { 
          id: 4, 
          name: 'Fresh Tomatoes', 
          price: 35, 
          unit: 'kg', 
          quantity: 200, 
          farmer: 'Green Valley Farm', 
          location: 'Karnataka',
          image: 'https://via.placeholder.com/300x200?text=Tomatoes'
        },
      ]);
      setLoading(false);
    }, 1000);
    
    // Actual API call would be:
    // const fetchProducts = async () => {
    //   try {
    //     const response = await api.get('/products');
    //     setProducts(response.data);
    //     setLoading(false);
    //   } catch (error) {
    //     console.error('Error fetching products:', error);
    //     setLoading(false);
    //   }
    // };
    // fetchProducts();
  }, []);
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.farmer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.location.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (loading) {
    return <Typography>Loading products...</Typography>;
  }
  
  return (
    <div className={classes.root}>
      <div className={classes.searchBar}>
        <TextField
          className={classes.searchField}
          variant="outlined"
          placeholder="Search products, farmers, locations..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <IconButton>
          <FilterIcon />
        </IconButton>
      </div>
      
      <Grid container spacing={4}>
        {filteredProducts.map((product) => (
          <Grid item key={product.id} xs={12} sm={6} md={4}>
            <Card className={classes.card}>
              <CardMedia
                className={classes.cardMedia}
                image={product.image}
                title={product.name}
              />
              <CardContent className={classes.cardContent}>
                <Typography gutterBottom variant="h5" component="h2">
                  {product.name}
                </Typography>
                <Typography variant="h6" className={classes.price}>
                  \u20b9{product.price}/{product.unit}
                </Typography>
                <Typography>
                  Available: {product.quantity} {product.unit}
                </Typography>
                <Typography className={classes.farmer}>
                  {product.farmer}, {product.location}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" color="primary">
                  View Details
                </Button>
                <Button size="small" color="primary">
                  Add to Cart
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

export default ProductList;
