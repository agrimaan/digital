import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Tooltip,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as LocalShippingIcon,
  Image as ImageIcon,
  FileUpload as FileUploadIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { farmerMarketplaceService, MarketplaceListing, CreateListingData } from '../../services/farmerMarketplaceService';
interface CustomCreateListingData extends CreateListingData {
    images: string[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`marketplace-tabpanel-${index}`}
      aria-labelledby={`marketplace-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const FarmerMarketplace: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [readyCrops, setReadyCrops] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);

  const [formData, setFormData] = useState<CustomCreateListingData>({
    cropId: '',
    title: '',
    description: '',
    quantity: {
      available: 0,
      unit: 'kg',
      minimum: 1, 
    },
    pricing: {
      pricePerUnit: 0,
      currency: 'INR',
      negotiable: false,
    },
    harvestInfo: {
      expectedDate: new Date().toISOString().split('T')[0],
      actualDate: new Date().toISOString().split('T')[0],
    },
    qualityAttributes: {
      grade: 'A',
      isOrganic: false,
      healthStatus: 'good',
      certifications: [],
    },
    images: [],
  });
  
  const [selectedImageFiles, setSelectedImageFiles] = useState<FileList | null>(null);
  const [selectedCertFiles, setSelectedCertFiles] = useState<FileList | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false); 

  useEffect(() => {
    loadData();
  }, [tabValue]);

  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (tabValue === 0) {
        const data = await farmerMarketplaceService.getMyListings();
        setListings(data.data.listings || []);
      } else if (tabValue === 1) {
        const data = await farmerMarketplaceService.getReadyCrops();
        setReadyCrops(data.data.crops || []);
      } else if (tabValue === 2) {
        const data = await farmerMarketplaceService.getStatistics();
        setStatistics(data.data || {});
      }
    } catch (err: any) {
      console.log(err);
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateListing = async () => {
    setLoading(true);
    setError(null);

    try {
      await farmerMarketplaceService.createListing(formData); 
      setSuccess('Listing created successfully!');
      setCreateDialogOpen(false);
      resetForm();
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateListing = async () => {
    if (!selectedListing) return;
    setLoading(true);
    setError(null);
    try {
      await farmerMarketplaceService.updateListing(selectedListing._id, formData);
      setSuccess('Listing updated successfully!');
      setEditDialogOpen(false);
      setSelectedListing(null);
      resetForm();
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update listing');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateListing = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate this listing?')) return;
    setLoading(true);
    setError(null);
    try {
      await farmerMarketplaceService.deactivateListing(id);
      setSuccess('Listing deactivated successfully!');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to deactivate listing');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateListing = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await farmerMarketplaceService.reactivateListing(id);
      setSuccess('Listing reactivated successfully!');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reactivate listing');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (listing: MarketplaceListing) => {
    setSelectedListing(listing);
    setFormData({
      cropId: listing.crop._id,
      title: listing.title,
      description: listing.description,
      quantity: {
          available: listing.quantity.available,
          unit: listing.quantity.unit,
          minimum: listing.quantity.minimum || 1 
      },
      pricing: listing.pricing,
      harvestInfo: listing.harvestInfo,
      qualityAttributes: {
          grade: listing.quality?.grade || 'A',
          isOrganic: listing.quality?.isOrganic || false,
          healthStatus: listing.quality?.healthStatus || 'good',
          certifications: listing.quality?.certifications || [],
      },
      images: listing.images || [], 
    });
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedImageFiles(null);
    setSelectedCertFiles(null);
    setIsProcessing(false);
    setFormData({
      cropId: '',
      title: '',
      description: '',
      quantity: {
        available: 0,
        unit: 'kg',
        minimum: 1,
      },
      pricing: {
        pricePerUnit: 0,
        currency: 'INR',
        negotiable: false,
      },
      harvestInfo: {
        expectedDate: new Date().toISOString().split('T')[0],
        actualDate: new Date().toISOString().split('T')[0],
      },
      qualityAttributes: {
        grade: 'A',
        isOrganic: false,
        healthStatus: 'good',
        certifications: [],
      },
      images: [],
    });
  };

  const renderListingCard = (listing: MarketplaceListing) => {
    const imageString = listing.images?.length ? listing.images[0] : null;

    let imageUrl = '';
    if (imageString) {
        if (imageString.startsWith('http')) {
            imageUrl = imageString;
        } else {
            imageUrl = `data:image/jpeg;base64,${imageString}`; 
        }
    }

    return (
      <Grid item xs={12} sm={6} md={4} key={listing._id}>
        <Card>
          {imageUrl ? (
            <CardMedia
              component="img"
              height="200"
              image={imageUrl}
              alt={listing.title}
            />
          ) : (
               <Box sx={{ height: 200, bgcolor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ImageIcon sx={{ fontSize: 60, color: 'grey.400' }} />
               </Box>
          )}
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {listing.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {listing.crop.name} - {listing.crop.variety}
            </Typography>
            <Box sx={{ my: 1 }}>
              <Chip
                label={capitalize(listing.status)}
                color={listing.status === 'active' ? 'success' : 'default'}
                size="small"
                sx={{ mr: 1 }}
              />
              {listing.quality?.isOrganic && (
                <Chip label="Organic" color="success" size="small" sx={{ mr: 1 }} />
              )}
              <Chip label={`Grade ${listing.quality?.grade}`} size="small" />
            </Box>
            <Typography variant="h6" color="primary" gutterBottom>
              ₹{listing.pricing.pricePerUnit}/{listing.quantity.unit}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Available: {listing.quantity.available} {listing.quantity.unit}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Tooltip title="Views">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <VisibilityIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="caption">{listing.statistics.views}</Typography>
                </Box>
              </Tooltip>
              <Tooltip title="Inquiries">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ShoppingCartIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="caption">{listing.statistics.inquiries}</Typography>
                </Box>
              </Tooltip>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleEditClick(listing)}
              >
                <EditIcon />
              </IconButton>
              {listing.status === 'active' ? (
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeactivateListing(listing._id)}
                >
                  <VisibilityOffIcon />
                </IconButton>
              ) : (
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => handleReactivateListing(listing._id)}
                >
                  <VisibilityIcon />
                </IconButton>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    );
  };

  const renderListingDialog = (isEdit: boolean) => {
    
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64String = (reader.result as string).split(',')[1]; 
                resolve(base64String);
            };
            reader.onerror = (error) => reject(error);
        });
    };
    
    const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedImageFiles(e.target.files);
    };

    const handleUploadImages = async () => {
        if (!selectedImageFiles || selectedImageFiles.length === 0) return;

        setIsProcessing(true);
        setError(null);
        
        try {
            const base64Promises: Promise<string>[] = Array.from(selectedImageFiles).map(fileToBase64);
            const newBase64Images = await Promise.all(base64Promises);
            setFormData((prev) => ({
                ...prev,
                images: [...prev.images, ...newBase64Images], 
            }));

            setSelectedImageFiles(null);
        } catch (err: any) {
            setError('Error converting image files to Base64.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRemoveImage = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
    };
    
    const handleCertFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedCertFiles(e.target.files);
    };

    const handleUploadCerts = async () => {
        if (!selectedCertFiles || selectedCertFiles.length === 0) return;

        setIsProcessing(true);
        setError(null);

        try {
            const base64Promises: Promise<string>[] = Array.from(selectedCertFiles).map(fileToBase64);
            const newBase64Certs = await Promise.all(base64Promises);
            
            setFormData((prev) => ({
                ...prev,
                qualityAttributes: {
                    ...prev.qualityAttributes,
                    certifications: [...(prev.qualityAttributes.certifications ?? []), ...newBase64Certs],
                },
            }));

            setSelectedCertFiles(null);
        } catch (err: any) {
            setError('Error converting certification files to Base64.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRemoveCert = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            qualityAttributes: {
                ...prev.qualityAttributes,
                certifications: (prev.qualityAttributes.certifications ?? []).filter((_, i) => i !== index),
            },
        }));
    };

    return (
      <Dialog
        open={isEdit ? editDialogOpen : createDialogOpen}
        onClose={() => (isEdit ? setEditDialogOpen(false) : setCreateDialogOpen(false))}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{isEdit ? 'Edit Listing' : 'Create New Listing'}</DialogTitle>
        
        <DialogContent dividers>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={3}>
              
              {!isEdit && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="select-crop">Select Crop</InputLabel>
                    <Select
                      labelId="select-crop"
                      label="Select Crop"
                      value={formData.cropId}
                      onChange={(e) => setFormData({ ...formData, cropId: e.target.value })}
                    >
                      {readyCrops.map((crop) => (
                        <MenuItem key={crop._id} value={crop._id}>
                          {crop.name} - {crop.variety} ({crop.currentStage})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  label="Title"
                  fullWidth
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Available Quantity"
                  type="number"
                  fullWidth
                  value={formData.quantity.available}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: { ...formData.quantity, available: Number(e.target.value) },
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="unit-label">Unit</InputLabel>
                  <Select
                    labelId="unit-label"
                    label="Unit"
                    value={formData.quantity.unit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: { ...formData.quantity, unit: e.target.value },
                      })
                    }
                  >
                    <MenuItem value="kg">Kilograms (kg)</MenuItem>
                    <MenuItem value="quintal">Quintal</MenuItem>
                    <MenuItem value="ton">Ton</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Minimum Order Quantity"
                  type="number"
                  fullWidth
                  value={formData.quantity.minimum}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: { ...formData.quantity, minimum: Number(e.target.value) },
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Price Per Unit"
                  type="number"
                  fullWidth
                  value={formData.pricing.pricePerUnit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pricing: { ...formData.pricing, pricePerUnit: Number(e.target.value) },
                    })
                  }
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel id="grade">Grade</InputLabel>
                  <Select
                    labelId="grade"
                    label="Grade"
                    value={formData.qualityAttributes?.grade}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        qualityAttributes: {
                          ...formData.qualityAttributes,
                          grade: e.target.value,
                        },
                      })
                    }
                  >
                    <MenuItem value="A">Grade A</MenuItem>
                    <MenuItem value="B">Grade B</MenuItem>
                    <MenuItem value="C">Grade C</MenuItem>
                    <MenuItem value="premium">Premium</MenuItem>
                    <MenuItem value="standard">Standard</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel id="organic-label">Is Organic?</InputLabel>
                  <Select
                    labelId="organic-label"
                    label="Is Organic?"
                    value={formData.qualityAttributes.isOrganic ? 'yes' : 'no'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        qualityAttributes: {
                          ...formData.qualityAttributes,
                          isOrganic: e.target.value === 'yes',
                        },
                      })
                    }
                  >
                    <MenuItem value="yes">Yes</MenuItem>
                    <MenuItem value="no">No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel id="health-status-label">Health Status</InputLabel>
                  <Select
                    labelId="health-status-label"
                    label="Health Status"
                    value={formData.qualityAttributes.healthStatus || 'good'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        qualityAttributes: {
                          ...formData.qualityAttributes,
                          healthStatus: e.target.value,
                        },
                      })
                    }
                  >
                    <MenuItem value="excellent">Excellent</MenuItem>
                    <MenuItem value="good">Good</MenuItem>
                    <MenuItem value="fair">Fair</MenuItem>
                    <MenuItem value="poor">Poor</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
                  🖼️ Product Images ({formData.images.length})
                </Typography>

                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Current Images ({formData.images.length})
                    </Typography>
                    {formData.images.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">No images uploaded yet.</Typography>
                    ) : (
                        <List dense>
                            {formData.images.map((base64String, index) => (
                                <ListItem
                                    key={index}
                                    secondaryAction={
                                        <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveImage(index)}>
                                            <DeleteIcon color="error" />
                                        </IconButton>
                                    }
                                    sx={{ borderBottom: '1px solid #eee' }}
                                >
                                    <CardMedia
                                        component="img"
                                        sx={{ width: 40, height: 40, mr: 2, objectFit: 'cover', borderRadius: 1 }}
                                        image={`data:image/jpeg;base64,${base64String}`} 
                                        alt={`Image ${index + 1}`}
                                    />
                                    <ListItemText 
                                        primary={`Image ${index + 1}`}
                                        primaryTypographyProps={{ 
                                            variant: 'body2', 
                                            noWrap: true, 
                                            sx: { maxWidth: '80%' } 
                                        }} 
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Paper>

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Upload New Images
                  </Typography>
                  <Grid container spacing={2} alignItems="center">
                    
                    <Grid item xs={12} sm={8}>
                      <input
                          accept="image/*"
                          id="image-upload-button"
                          type="file"
                          multiple
                          onChange={handleImageFileChange}
                          style={{ display: 'none' }}
                      />
                      <label htmlFor="image-upload-button">
                          <Button 
                              variant="outlined" 
                              component="span" 
                              fullWidth 
                              startIcon={<FileUploadIcon />}
                          >
                              {selectedImageFiles ? `${selectedImageFiles.length} file(s) selected` : 'Select Image Files'}
                          </Button>
                      </label>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Button
                        onClick={handleUploadImages}
                        variant="contained"
                        startIcon={<AddIcon />}
                        disabled={!selectedImageFiles || isProcessing}
                        fullWidth
                      >
                        {isProcessing ? <CircularProgress size={24} color="inherit" /> : 'Add Images'}
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
                    📜 Certifications ({(formData.qualityAttributes.certifications ?? []).length})
                </Typography>

                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Current Certifications ({(formData.qualityAttributes.certifications ?? []).length})
                    </Typography>
                    
                    {(formData.qualityAttributes.certifications ?? []).length === 0 ? (
                        <Typography variant="body2" color="text.secondary">No certification files uploaded yet.</Typography>
                    ) : (
                        <List dense>
                            {(formData.qualityAttributes.certifications ?? []).map((base64String, index) => (
                                <ListItem
                                    key={index}
                                    secondaryAction={
                                        <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveCert(index)}>
                                            <DeleteIcon color="error" />
                                        </IconButton>
                                    }
                                    sx={{ borderBottom: '1px solid #eee' }}
                                >
                                    <DescriptionIcon sx={{ mr: 2, color: 'info.main' }} />
                                    <ListItemText 
                                        primary={`Certification File ${index + 1}`}
                                        secondary={`Content Type: ${base64String.substring(0, 10)}... (Base64)`}
                                        primaryTypographyProps={{ variant: 'body2' }} 
                                        secondaryTypographyProps={{ variant: 'caption' }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Paper>

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Upload New Certifications (PDF, Image)
                  </Typography>
                  <Grid container spacing={2} alignItems="center">
                    
                    <Grid item xs={12} sm={8}>
                      <input
                          accept=".pdf, image/*, .doc, .docx" 
                          id="cert-upload-button"
                          type="file"
                          multiple
                          onChange={handleCertFileChange}
                          style={{ display: 'none' }}
                      />
                      <label htmlFor="cert-upload-button">
                          <Button 
                              variant="outlined" 
                              component="span" 
                              fullWidth 
                              startIcon={<FileUploadIcon />}
                          >
                              {selectedCertFiles ? `${selectedCertFiles.length} file(s) selected` : 'Select Certification Files'}
                          </Button>
                      </label>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Button
                        onClick={handleUploadCerts}
                        variant="contained"
                        startIcon={<AddIcon />}
                        disabled={!selectedCertFiles || isProcessing}
                        fullWidth
                      >
                        {isProcessing ? <CircularProgress size={24} color="inherit" /> : 'Add Certs'}
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>


            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => (isEdit ? setEditDialogOpen(false) : setCreateDialogOpen(false))}>
            Cancel
          </Button>
          <Button
            onClick={isEdit ? handleUpdateListing : handleCreateListing}
            variant="contained"
            disabled={loading || isProcessing}
          >
            {loading ? <CircularProgress size={24} /> : isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            Marketplace
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadData}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                resetForm();
                setCreateDialogOpen(true);
              }}
            >
              Create Listing
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Paper sx={{ width: '100%' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="My Listings" />
            <Tab label="Ready Crops" />
            <Tab label="Statistics" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : listings.length === 0 ? (
              <Box sx={{ textAlign: 'center', p: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No listings yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Create your first listing to start selling your crops
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {listings.map(renderListingCard)}
              </Grid>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : readyCrops.length === 0 ? (
              <Box sx={{ textAlign: 'center', p: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No ready crops
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Crops in harvest stage will appear here
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {readyCrops.map((crop) => (
                  <Grid item xs={12} sm={6} md={4} key={crop._id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {crop.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Variety: {crop.variety}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Stage: {crop.currentStage}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Expected Yield: {crop.expectedYield} {crop.yieldUnit}
                        </Typography>
                        <Button
                          variant="contained"
                          size="small"
                          sx={{ mt: 2 }}
                          onClick={() => {
                            setFormData({
                              ...formData,
                              cropId: crop._id,
                              title: `${crop.name} - ${crop.variety}`,
                            });
                            setCreateDialogOpen(true);
                          }}
                        >
                          Create Listing
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : statistics ? (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <TrendingUpIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h4">{statistics.totalListings || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Listings
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <VisibilityIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                    <Typography variant="h4">{statistics.activeListings || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Listings
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <ShoppingCartIcon sx={{ fontSize: 48, color: 'info.main', mb: 1 }} />
                    <Typography variant="h4">{statistics.totalInquiries || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Inquiries
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <LocalShippingIcon sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
                    <Typography variant="h4">{statistics.totalOrders || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Orders
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', p: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No statistics available
                </Typography>
              </Box>
            )}
          </TabPanel>
        </Paper>
      </Box>

      {createDialogOpen && renderListingDialog(false)}
      {editDialogOpen && renderListingDialog(true)}
    </Container>
  );
};

export default FarmerMarketplace;