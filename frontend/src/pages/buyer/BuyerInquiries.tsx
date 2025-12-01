
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
  DialogActions
} from '@mui/material';
import {
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as PendingIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import inquiryService, { Inquiry } from '../../services/inquiryService';

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

const BuyerInquiries: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    loadInquiries();
  }, [tabValue]);

  const loadInquiries = async () => {
    setLoading(true);
    setError(null);
    try {
      const statusFilter = tabValue === 0 ? undefined : tabValue === 1 ? 'pending' : 'responded';
      const response = await inquiryService.getBuyerInquiries({ status: statusFilter });
      
      if (response.success) {
        setInquiries(response.data.inquiries);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setDetailsDialogOpen(true);
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
          My Inquiries
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadInquiries}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ width: '100%', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="All Inquiries" />
          <Tab label="Pending" icon={<PendingIcon />} iconPosition="start" />
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
              ? "You haven't sent any inquiries yet"
              : tabValue === 1
              ? "No pending inquiries"
              : "No responded inquiries"}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {inquiries.map((inquiry) => (
            <Grid item xs={12} key={inquiry._id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {inquiry.cropName} {inquiry.variety && `- ${inquiry.variety}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        To: {inquiry.farmerName || 'Farmer'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Sent: {formatDate(inquiry.createdAt)}
                      </Typography>
                    </Box>
                    <Chip
                      icon={getStatusIcon(inquiry.status)}
                      label={inquiry.status.toUpperCase()}
                      color={getStatusColor(inquiry.status)}
                      size="small"
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Your Message:</strong>
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {inquiry.message.length > 150 
                      ? `${inquiry.message.substring(0, 150)}...` 
                      : inquiry.message}
                  </Typography>

                  {inquiry.interestedQuantity && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Interested Quantity: {inquiry.interestedQuantity} {inquiry.quantityUnit}
                    </Typography>
                  )}

                  {inquiry.status === 'responded' && inquiry.response && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                      <Typography variant="body2" color="success.dark" gutterBottom>
                        <strong>Farmer's Response:</strong>
                      </Typography>
                      <Typography variant="body1" color="success.dark">
                        {inquiry.response.message.length > 150 
                          ? `${inquiry.response.message.substring(0, 150)}...` 
                          : inquiry.response.message}
                      </Typography>
                      <Typography variant="caption" color="success.dark" sx={{ mt: 1, display: 'block' }}>
                        Responded: {formatDate(inquiry.response.respondedAt)}
                      </Typography>
                      {!inquiry.isResponseRead && (
                        <Chip label="New Response" color="error" size="small" sx={{ mt: 1 }} />
                      )}
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
                  To: {selectedInquiry.farmerName || 'Farmer'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sent: {formatDate(selectedInquiry.createdAt)}
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
                <strong>Your Message:</strong>
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                {selectedInquiry.message}
              </Typography>

              {selectedInquiry.interestedQuantity && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  <strong>Interested Quantity:</strong> {selectedInquiry.interestedQuantity} {selectedInquiry.quantityUnit}
                </Typography>
              )}

              {selectedInquiry.buyerPhone && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  <strong>Your Contact:</strong> {selectedInquiry.buyerPhone}
                </Typography>
              )}

              {selectedInquiry.status === 'responded' && selectedInquiry.response && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                    <Typography variant="body2" color="success.dark" gutterBottom>
                      <strong>Farmer's Response:</strong>
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
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BuyerInquiries;
