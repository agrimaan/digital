import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  Alert,
  FormControlLabel,
  Checkbox,
  Chip,
  IconButton,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Add as AddIcon
} from '@mui/icons-material';
import marketplaceService from '../services/marketplaceService';
import { Crop } from '../features/crops/cropSlice';

interface PublishCropDialogProps {
  open: boolean;
  onClose: () => void;
  crop: Crop | null;
  onSuccess?: () => void;
}

const PublishCropDialog: React.FC<PublishCropDialogProps> = ({
  open,
  onClose,
  crop,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    pricePerUnit: '',
    quantity: '',
    description: '',
    isOrganic: false,
    certifications: [] as string[],
    images: [] as string[]
  });
  const [newCertification, setNewCertification] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddCertification = () => {
    if (newCertification.trim()) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()]
      }));
      setNewCertification('');
    }
  };

  const handleRemoveCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImageUrl.trim()]
      }));
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!crop) {
      setError('No crop selected');
      return;
    }

    // Validation
    if (!formData.pricePerUnit || parseFloat(formData.pricePerUnit) <= 0) {
      setError('Please enter a valid price per unit');
      return;
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    if (parseFloat(formData.quantity) > (crop.actualYield || 0)) {
      setError(`Quantity cannot exceed actual yield (${crop.actualYield} ${crop.unit})`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await marketplaceService.publishCrop(crop._id!, {
        pricePerUnit: parseFloat(formData.pricePerUnit),
        quantity: parseFloat(formData.quantity),
        description: formData.description || `Fresh ${crop.name} - ${crop.variety}`,
        images: formData.images,
        isOrganic: formData.isOrganic,
        certifications: formData.certifications
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to publish crop to marketplace');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        pricePerUnit: '',
        quantity: '',
        description: '',
        isOrganic: false,
        certifications: [],
        images: []
      });
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  if (!crop) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Publish Crop to Marketplace</Typography>
          <IconButton onClick={handleClose} disabled={loading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Crop published to marketplace successfully!
            </Alert>
          )}

          {/* Crop Information */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Crop Details
            </Typography>
            <Typography variant="body1">
              <strong>Name:</strong> {crop.name} {crop.variety && `- ${crop.variety}`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Available Yield:</strong> {crop.actualYield || 0} {crop.unit}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Status:</strong> {crop.growthStage}
            </Typography>
          </Box>

          <Grid container spacing={2}>
            {/* Price Per Unit */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Price Per Unit"
                name="pricePerUnit"
                type="number"
                value={formData.pricePerUnit}
                onChange={handleChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  endAdornment: <InputAdornment position="end">/{crop.unit}</InputAdornment>
                }}
                inputProps={{ min: 0, step: 0.01 }}
                disabled={loading}
              />
            </Grid>

            {/* Quantity */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Quantity to List"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange}
                InputProps={{
                  endAdornment: <InputAdornment position="end">{crop.unit}</InputAdornment>
                }}
                inputProps={{ 
                  min: 0, 
                  max: crop.actualYield || 0,
                  step: 0.01 
                }}
                helperText={`Maximum: ${crop.actualYield || 0} ${crop.unit}`}
                disabled={loading}
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={3}
                placeholder={`Fresh ${crop.name} - ${crop.variety || 'Premium quality'}`}
                disabled={loading}
              />
            </Grid>

            {/* Organic Checkbox */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="isOrganic"
                    checked={formData.isOrganic}
                    onChange={handleChange}
                    disabled={loading}
                  />
                }
                label="This is an organic product"
              />
            </Grid>

            {/* Certifications */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Certifications (Optional)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Add certification (e.g., Organic India, USDA Organic)"
                  value={newCertification}
                  onChange={(e) => setNewCertification(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCertification();
                    }
                  }}
                  disabled={loading}
                />
                <Button
                  variant="outlined"
                  onClick={handleAddCertification}
                  startIcon={<AddIcon />}
                  disabled={loading}
                >
                  Add
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.certifications.map((cert, index) => (
                  <Chip
                    key={index}
                    label={cert}
                    onDelete={() => handleRemoveCertification(index)}
                    disabled={loading}
                  />
                ))}
              </Box>
            </Grid>

            {/* Images */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Product Images (Optional)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Add image URL"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddImage();
                    }
                  }}
                  disabled={loading}
                />
                <Button
                  variant="outlined"
                  onClick={handleAddImage}
                  startIcon={<CloudUploadIcon />}
                  disabled={loading}
                >
                  Add
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.images.map((img, index) => (
                  <Chip
                    key={index}
                    label={`Image ${index + 1}`}
                    onDelete={() => handleRemoveImage(index)}
                    disabled={loading}
                  />
                ))}
              </Box>
            </Grid>

            {/* Total Price Preview */}
            {formData.pricePerUnit && formData.quantity && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                  <Typography variant="h6" color="primary.contrastText">
                    Total Value: ₹{(parseFloat(formData.pricePerUnit) * parseFloat(formData.quantity)).toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
          >
            {loading ? 'Publishing...' : 'Publish to Marketplace'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PublishCropDialog;