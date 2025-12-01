
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Badge
} from '@mui/material';
import {
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as PendingIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Reply as ReplyIcon
} from '@mui/icons-material';
import inquiryService, { Inquiry, InquiryStats } from '../../services/inquiryService';

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
      id={`inquiries-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const FarmerInquiries: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [stats, setStats] = useState<InquiryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    loadInquiries();
    loadStats();
  }, [tabValue]);

  const loadInquiries = async () => {
    setLoading(true);
    setError(null);
    try {
      const statusFilter = tabValue === 0 ? undefined : tabValue === 1 ? 'pending' : 'responded';
      const response = await inquiryService.getFarmerInquiries({ status: statusFilter });
      
      if (response.success) {
        setInquiries(response.data.inquiries);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await inquiryService.getFarmerStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleViewDetails = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setDetailsDialogOpen(true);
  };

  const handleOpenResponse = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setResponseMessage('');
    setResponseDialogOpen(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedInquiry || !responseMessage.trim()) {
      setError('Please provide a response message');
      return;
    }

    setResponding(true);
    setError(null);
    try {
      await inquiryService.respondToInquiry(selectedInquiry._id, responseMessage);
      
      setSuccess('Response sent successfully!');
      setResponseDialogOpen(false);
      setResponseMessage('');
      loadInquiries();
      loadStats();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to send response');
    } finally {
      setResponding(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'responded':
        return 'success';
      case 'closed':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <PendingIcon />;
      case 'responded':
        return <CheckCircleIcon />;
      case 'closed':
        return <CloseIcon />;
      default:
        return <EmailIcon />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Buyer Inquiries
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => {
            loadInquiries();
            loadStats();
          }}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Inquiries
                </Typography>
                <Typography variant="h4">
                  {stats.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Pending
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {stats.pending}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Responded
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.responded}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Unread
                </Typography>
                <Typography variant="h4" color="error.main">
                  {stats.unread}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

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

      {/* Tabs */}
      <Paper sx={{ width: '100%', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab 
            label={
              <Badge badgeContent={stats?.unread || 0} color="error">
                All Inquiries
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={stats?.pending || 0} color="warning">
                Pending
              </Badge>
            }
            icon={<PendingIcon />} 
            iconPosition="start" 
          />
          <Tab label="Responded" icon={<CheckCircleIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : inquiries.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No inquiries found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {tabValue === 0 
              ? "You haven't received any inquiries yet"
              : tabValue === 1
              ? "No pending inquiries"
              : "No responded inquiries"}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {inquiries.map((inquiry) => (
            <Grid item xs={12} key={inquiry._id}>
              <Card sx={{ bgcolor: !inquiry.isRead ? 'action.hover' : 'background.paper' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {inquiry.cropName} {inquiry.variety && `- ${inquiry.variety}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        From: {inquiry.buyerName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Email: {inquiry.buyerEmail}
                      </Typography>
                      {inquiry.buyerPhone && (
                        <Typography variant="body2" color="text.secondary">
                          Phone: {inquiry.buyerPhone}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        Received: {formatDate(inquiry.createdAt)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
                      <Chip
                        icon={getStatusIcon(inquiry.status)}
                        label={inquiry.status.toUpperCase()}
                        color={getStatusColor(inquiry.status)}
                        size="small"
                      />
                      {!inquiry.isRead && (
                        <Chip label="New" color="error" size="small" />
                      )}
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Buyer's Message:</strong>
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {inquiry.message.length > 150 
                      ? `${inquiry.message.substring(0, 150)}...` 
                      : inquiry.message}
                  </Typography>

                  {inquiry.interestedQuantity && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      <strong>Interested Quantity:</strong> {inquiry.interestedQuantity} {inquiry.quantityUnit}
                    </Typography>
                  )}

                  {inquiry.status === 'responded' && inquiry.response && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                      <Typography variant="body2" color="success.dark" gutterBottom>
                        <strong>Your Response:</strong>
                      </Typography>
                      <Typography variant="body1" color="success.dark">
                        {inquiry.response.message.length > 150 
                          ? `${inquiry.response.message.substring(0, 150)}...` 
                          : inquiry.response.message}
                      </Typography>
                      <Typography variant="caption" color="success.dark" sx={{ mt: 1, display: 'block' }}>
                        Responded: {formatDate(inquiry.response.respondedAt)}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleViewDetails(inquiry)}
                    >
                      View Full Details
                    </Button>
                    {inquiry.status === 'pending' && (
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        startIcon={<ReplyIcon />}
                        onClick={() => handleOpenResponse(inquiry)}
                      >
                        Respond
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Inquiry Details</DialogTitle>
        <DialogContent>
          {selectedInquiry && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedInquiry.cropName} {selectedInquiry.variety && `- ${selectedInquiry.variety}`}
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>From:</strong> {selectedInquiry.buyerName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Email:</strong> {selectedInquiry.buyerEmail}
                </Typography>
                {selectedInquiry.buyerPhone && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Phone:</strong> {selectedInquiry.buyerPhone}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                  <strong>Received:</strong> {formatDate(selectedInquiry.createdAt)}
                </Typography>
                <Chip
                  icon={getStatusIcon(selectedInquiry.status)}
                  label={selectedInquiry.status.toUpperCase()}
                  color={getStatusColor(selectedInquiry.status)}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Buyer's Message:</strong>
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                {selectedInquiry.message}
              </Typography>

              {selectedInquiry.interestedQuantity && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  <strong>Interested Quantity:</strong> {selectedInquiry.interestedQuantity} {selectedInquiry.quantityUnit}
                </Typography>
              )}

              {selectedInquiry.status === 'responded' && selectedInquiry.response && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                    <Typography variant="body2" color="success.dark" gutterBottom>
                      <strong>Your Response:</strong>
                    </Typography>
                    <Typography variant="body1" color="success.dark" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedInquiry.response.message}
                    </Typography>
                    <Typography variant="caption" color="success.dark" sx={{ mt: 2, display: 'block' }}>
                      Responded: {formatDate(selectedInquiry.response.respondedAt)}
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedInquiry && selectedInquiry.status === 'pending' && (
            <Button
              variant="contained"
              startIcon={<ReplyIcon />}
              onClick={() => {
                setDetailsDialogOpen(false);
                handleOpenResponse(selectedInquiry);
              }}
            >
              Respond
            </Button>
          )}
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Response Dialog */}
      <Dialog
        open={responseDialogOpen}
        onClose={() => !responding && setResponseDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Respond to Inquiry</DialogTitle>
        <DialogContent>
          {selectedInquiry && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Buyer:</strong> {selectedInquiry.buyerName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Crop:</strong> {selectedInquiry.cropName} {selectedInquiry.variety && `- ${selectedInquiry.variety}`}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Buyer's Message:</strong>
              </Typography>
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.100' }}>
                <Typography variant="body2">
                  {selectedInquiry.message}
                </Typography>
              </Paper>

              <TextField
                label="Your Response"
                multiline
                rows={6}
                fullWidth
                required
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                placeholder="Type your response to the buyer..."
                helperText="Provide details about availability, pricing, delivery, or any other relevant information"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResponseDialogOpen(false)} disabled={responding}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitResponse}
            disabled={responding || !responseMessage.trim()}
          >
            {responding ? <CircularProgress size={24} /> : 'Send Response'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default FarmerInquiries;
