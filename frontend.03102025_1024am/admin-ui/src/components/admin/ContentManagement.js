import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Pagination,
  TablePagination,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  CardMedia,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Visibility as ViewIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchContent, createContent, updateContent, deleteContent } from '../../store/actions/contentActions';

const ContentManagement = () => {
  const dispatch = useDispatch();
  const { content, loading, total, page, limit } = useSelector(state => state.content);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('create');
  const [selectedContent, setSelectedContent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'article',
    status: 'draft',
    tags: [],
    featuredImage: '',
    excerpt: '',
    metaDescription: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    dispatch(fetchContent({ page: 1, limit: 10, search: searchTerm, type: typeFilter, status: statusFilter }));
  }, [dispatch, searchTerm, typeFilter, statusFilter]);

  const handleCreateContent = () => {
    setDialogType('create');
    setSelectedContent(null);
    setFormData({
      title: '',
      content: '',
      type: 'article',
      status: 'draft',
      tags: [],
      featuredImage: '',
      excerpt: '',
      metaDescription: '',
    });
    setOpenDialog(true);
  };

  const handleEditContent = (content) => {
    setDialogType('edit');
    setSelectedContent(content);
    setFormData({
      title: content.title,
      content: content.content,
      type: content.type,
      status: content.status,
      tags: content.tags || [],
      featuredImage: content.featuredImage || '',
      excerpt: content.excerpt || '',
      metaDescription: content.metaDescription || '',
    });
    setOpenDialog(true);
  };

  const handleDeleteContent = async (contentId) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      await dispatch(deleteContent(contentId));
    }
  };

  const handleSubmit = async () => {
    if (dialogType === 'create') {
      await dispatch(createContent(formData));
    } else {
      await dispatch(updateContent(selectedContent._id, formData));
    }
    setOpenDialog(false);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // In a real implementation, you would upload the file to your server
      // For now, we'll create a temporary URL
      const imageUrl = URL.createObjectURL(file);
      setFormData({ ...formData, featuredImage: imageUrl });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'success';
      case 'draft': return 'warning';
      case 'archived': return 'default';
      default: return 'default';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'article': return 'primary';
      case 'page': return 'secondary';
      case 'news': return 'info';
      case 'blog': return 'warning';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const contentTypes = [
    { value: 'article', label: 'Article' },
    { value: 'page', label: 'Page' },
    { value: 'news', label: 'News' },
    { value: 'blog', label: 'Blog Post' },
    { value: 'product', label: 'Product' },
  ];

  const contentStatus = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Content Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateContent}
        >
          Add Content
        </Button>
      </Box>

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label="All Content" />
        <Tab label="Articles" />
        <Tab label="Pages" />
        <Tab label="News" />
        <Tab label="Blog Posts" />
      </Tabs>

      <Card>
        <CardContent>
          <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search content..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
              }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                label="Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                {contentTypes.map(type => (
                  <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All</MenuItem>
                {contentStatus.map(status => (
                  <MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Author</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {content.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {item.featuredImage ? (
                          <CardMedia
                            component="img"
                            image={item.featuredImage}
                            alt={item.title}
                            sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover' }}
                          />
                        ) : (
                          <Box sx={{ width: 40, height: 40, bgcolor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1 }}>
                            <ImageIcon sx={{ color: 'grey.500' }} />
                          </Box>
                        )}
                        <Box>
                          <Typography variant="subtitle2">{item.title}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.excerpt?.substring(0, 50)}...
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={contentTypes.find(t => t.value === item.type)?.label || item.type}
                        color={getTypeColor(item.type)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={contentStatus.find(s => s.value === item.status)?.label || item.status}
                        color={getStatusColor(item.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{item.author?.name || 'Unknown'}</TableCell>
                    <TableCell>{formatDate(item.createdAt)}</TableCell>
                    <TableCell>{formatDate(item.updatedAt)}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEditContent(item)} size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteContent(item._id)} size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={total}
            rowsPerPage={limit}
            page={page - 1}
            onPageChange={(event, newPage) => {
              dispatch(fetchContent({ page: newPage + 1, limit, search: searchTerm }));
            }}
            onRowsPerPageChange={(event) => {
              dispatch(fetchContent({ page: 1, limit: parseInt(event.target.value, 10), search: searchTerm }));
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'create' ? 'Create New Content' : 'Edit Content'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  {contentTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  {contentStatus.map(status => (
                    <MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Excerpt"
                multiline
                rows={2}
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Content"
                multiline
                rows={6}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags (comma separated)"
                value={formData.tags.join(', ')}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Meta Description"
                multiline
                rows={2}
                value={formData.metaDescription}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<ImageIcon />}
              >
                Upload Featured Image
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </Button>
              {formData.featuredImage && (
                <Box sx={{ mt: 2 }}>
                  <img 
                    src={formData.featuredImage} 
                    alt="Featured" 
                    style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: 4 }}
                  />
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {dialogType === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContentManagement;