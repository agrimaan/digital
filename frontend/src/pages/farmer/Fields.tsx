// Fields.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  CircularProgress
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { getFields, deleteFields } from '../../features/fields/fieldSlice';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import OpacityIcon from '@mui/icons-material/Opacity';
import TerrainIcon from '@mui/icons-material/Terrain';
import { useTranslation } from 'react-i18next';

const Fields: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation();

  const { fields = [], loading, error } = useSelector((state: RootState) => state.fields);

  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedField, setSelectedField] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  useEffect(() => {
    dispatch(getFields());
  }, [dispatch]);

  // Safe filter to prevent errors if name, crops, or location is undefined
  const filteredFields = (fields || []).filter(field =>
    field.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.crops?.some((crop: string) => crop?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    field.location?.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, field: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedField(field);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    // Do not clear selectedField here, it’s needed for delete
  };

  const handleEdit = () => {
    if (selectedField) {
      navigate(`${selectedField._id}/edit`);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    setAnchorEl(null); // just close the menu
    // Do NOT clear selectedField
  };

  const handleDeleteConfirm = async () => {
    if (selectedField) {
      try {
        await dispatch(deleteFields(selectedField._id) as any);
        setDeleteSuccess(true);
        setTimeout(() => setDeleteSuccess(false), 3000);
      } catch (err) {
        console.error('Error deleting field:', err);
      }
    }
    setDeleteDialogOpen(false);
    setSelectedField(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedField(null);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="div">
          {t('fields.fieldManagement')}
        </Typography>
        <Button
          component={Link}
          to="/farmer/fields/new"
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
        >
          {t('fields.addField')}
        </Button>
      </Box>

      {deleteSuccess && <Alert severity="success" sx={{ mb: 3 }}>{t('fields.FieldsDeletedSuccessfully')}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={t('fields.SearchFieldsByNameCropOrLocation') as string}
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

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {t('fields.fieldsCount')} {filteredFields.length}
          </Typography>

          <Grid container spacing={3}>
            {filteredFields.map((field) => (
              <Grid item xs={12} sm={6} md={4} key={field._id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  {/* Menu Button */}
                  <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, field)}
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.9)' }
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  <CardMedia
                    component="img"
                    height="140"
                    image="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1350&q=80"
                    alt={field.name || 'Field Image'}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography gutterBottom variant="h6" component="div">
                        {field.name || 'Unnamed Field'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <LocationOnIcon fontSize="small" />
                        <OpacityIcon fontSize="small" />
                        <TerrainIcon fontSize="small" />
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {field.name || ''}
                    </Typography>
                  </CardContent>
                  <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button size="small" component={Link} to={`${field._id}`}>View</Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Menu for edit/delete */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this field?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button
            onClick={() => {
              handleDeleteConfirm();
            }}
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Fields;
