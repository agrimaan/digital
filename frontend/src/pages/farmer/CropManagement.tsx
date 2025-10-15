import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import {
  createCrop,
  updateCrop,
  deleteCrop,
  getCrops,
  Crop,
} from '../../features/crops/cropSlice';
import SearchIcon from '@mui/icons-material/Search';

interface CropFormData {
  name: string;
  variety: string;
  plantingDate: string;
  harvestDate: string;
  status: 'planned' | 'planted' | 'growing' | 'harvested' | 'failed';
  health: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  image: string;
}

const CropManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { crops, loading, error } = useSelector(
    (state: RootState) => state.crop
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null);
  const [formData, setFormData] = useState<CropFormData>({
    name: '',
    variety: '',
    plantingDate: '',
    harvestDate: '',
    status: 'planned',
    health: 'good',
    image: '',
  });

  useEffect(() => {
    dispatch(getCrops());
  }, [dispatch]);

  const filteredCrops =
    Array.isArray(crops)
      ? crops.filter(
          (crop) =>
            crop.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            crop.variety?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : [];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value as CropFormData[keyof CropFormData],
    }));
  };

  const handleOpenDialog = (crop?: Crop) => {
    if (crop) {
      setEditingCrop(crop);
      setFormData({
        name: crop.name ?? '',
        variety: crop.variety ?? '',
        plantingDate: crop.plantingDate
          ? new Date(crop.plantingDate).toISOString().split('T')[0]
          : '',
        harvestDate: crop.harvestDate
          ? new Date(crop.harvestDate).toISOString().split('T')[0]
          : '',
        status: crop.status ?? 'planned',
        health: crop.healthStatus ?? 'good',
        image: crop.images?.[0]?.url ?? '',
      });
    } else {
      setEditingCrop(null);
      setFormData({
        name: '',
        variety: '',
        plantingDate: '',
        harvestDate: '',
        status: 'planned',
        health: 'good',
        image: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCrop(null);
  };

  const isFormValid = () =>
    formData.name.trim() !== '' &&
    formData.variety.trim() !== '' &&
    formData.plantingDate.trim() !== '';

  const handleSubmit = async () => {
    if (!isFormValid()) return;

    try {
      if (editingCrop) {
        await dispatch(
          updateCrop({
            id: editingCrop._id,
            formData: {
              name: formData.name,
              variety: formData.variety,
              plantingDate: new Date(formData.plantingDate),
              harvestDate: new Date(formData.harvestDate),
              status: formData.status,
              healthStatus: formData.health,
              notes: '',
            },
          })
        ).unwrap();
      } else {
        await dispatch(
          createCrop({
            name: formData.name,
            variety: formData.variety,
            plantingDate: new Date(formData.plantingDate),
            harvestDate: new Date(formData.harvestDate),
            status: formData.status,
            healthStatus: formData.health,
            pestIssues: [],
            diseaseIssues: [],
            fertilizers: [],
            irrigationEvents: [],
            images: formData.image
              ? [{ url: formData.image, date: new Date() }]
              : [],
          })
        ).unwrap();
      }

      handleCloseDialog();
      dispatch(getCrops());
    } catch (err) {
      console.error('Error saving crop:', err);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Crop Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ mb: 2 }}
        >
          Add Crop
        </Button>
      </Box>

      {/* Search bar styled like Field Management */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Search Crops"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" py={3}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Typography color="error" mb={2}>
          Error: {error}
        </Typography>
      )}

      {!loading && filteredCrops.length > 0 ? (
        <Grid container spacing={2}>
          {filteredCrops.map((crop) => (
            <Grid item xs={12} sm={6} md={4} key={crop._id}>
              <Box
                border="1px solid #ddd"
                borderRadius={2}
                p={2}
                display="flex"
                flexDirection="column"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h6">{crop.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {crop.variety}
                  </Typography>
                  <Typography variant="body2">
                    🌱{' '}
                    {crop.plantingDate
                      ? new Date(crop.plantingDate).toLocaleDateString()
                      : 'N/A'}{' '}
                    → 🌾{' '}
                    {crop.harvestDate
                      ? new Date(crop.harvestDate).toLocaleDateString()
                      : 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    Health: {crop.healthStatus}
                  </Typography>
                </Box>
                <Box mt={2} display="flex" justifyContent="flex-end">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleOpenDialog(crop)}
                  >
                    <EditIcon />
                  </IconButton>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      ) : (
        !loading && <Typography>No crops found.</Typography>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth>
        <DialogTitle>{editingCrop ? 'Edit Crop' : 'Add New Crop'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={12}>
              <TextField
                label="Crop Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Variety"
                name="variety"
                value={formData.variety}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Planting Date"
                type="date"
                name="plantingDate"
                value={formData.plantingDate}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Harvest Date"
                type="date"
                name="harvestDate"
                value={formData.harvestDate}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                fullWidth
              >
                <MenuItem value="planned">Planned</MenuItem>
                <MenuItem value="planted">Planted</MenuItem>
                <MenuItem value="growing">Growing</MenuItem>
                <MenuItem value="harvested">Harvested</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                label="Health"
                name="health"
                value={formData.health}
                onChange={handleInputChange}
                fullWidth
              >
                <MenuItem value="excellent">Excellent</MenuItem>
                <MenuItem value="good">Good</MenuItem>
                <MenuItem value="fair">Fair</MenuItem>
                <MenuItem value="poor">Poor</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Image URL (optional)"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!isFormValid()}
          >
            {editingCrop ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CropManagement;
