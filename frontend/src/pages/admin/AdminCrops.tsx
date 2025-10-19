import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  Avatar,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  Grass as GrassIcon,
} from "@mui/icons-material";
import { RootState } from "../../store";
import axios from "axios";
import { API_BASE_URL } from "../../config/apiConfig";

// Types
interface CropOwner {
  _id: string;
  name: string;
}

interface CropField {
  _id: string;
  name: string;
  owner?: CropOwner;
}

interface Crop {
  _id: string;
  name: string;
  variety: string;
  Fields?: CropField;
  farmId?: {
    _id: string;
    name: string;
    owner?: CropOwner;
  };
  farmerId?: string;
  plantingDate: string;
  harvestDate?: string | null;
  status: "growing" | "harvested" | "sold" | "failed";
  quantity: {
    expected: number;
    actual?: number | null;
    unit: string;
  };
  healthStatus: "excellent" | "good" | "fair" | "poor";
  notes?: string;
  createdAt?: string;
}

const AdminCrops: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const [crops, setCrops] = useState<Crop[]>([]);
  const [filteredCrops, setFilteredCrops] = useState<Crop[]>([]);
  const [fieldsOwners, setFieldsOwners] = useState<
    Array<{ id: string; name: string }>
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterHealth, setFilterHealth] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cropToDelete, setCropToDelete] = useState<string | null>(null);

  // Fetch crops
  useEffect(() => {
    const fetchCrops = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/admin/crops`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const cropsData =
          response.data?.data?.crops || response.data?.crops || [];

        // Extract unique owners safely
        const uniqueOwners = Array.from(
          new Set(
            cropsData
              .map(
                (crop: any) =>
                  crop?.farmId?.owner?._id ?? crop?.Fields?.owner?._id ?? ""
              )
              .filter((id: string) => id !== "")
          )
        ).map((ownerId: any) => {
          const owner =
            cropsData.find(
              (crop: any) =>
                crop?.farmId?.owner?._id === ownerId ||
                crop?.Fields?.owner?._id === ownerId
            )?.farmId?.owner ||
            cropsData.find(
              (crop: any) => crop?.Fields?.owner?._id === ownerId
            )?.Fields?.owner;

          return { id: ownerId, name: owner?.name || "Unknown" };
        });

        setCrops(cropsData);
        setFilteredCrops(cropsData);
        setFieldsOwners(uniqueOwners);
        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching crops:", err);
        setError(err.response?.data?.message || err.message || "Fetch failed");
        setLoading(false);
      }
    };

    fetchCrops();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = [...crops];

    // Search
    if (searchTerm.trim()) {
      result = result.filter((crop) => {
        const name = crop?.name?.toLowerCase() || "";
        const variety = crop?.variety?.toLowerCase() || "";
        const field = crop?.Fields?.name?.toLowerCase() || "";
        const owner = crop?.Fields?.owner?.name?.toLowerCase() || "";
        return (
          name.includes(searchTerm.toLowerCase()) ||
          variety.includes(searchTerm.toLowerCase()) ||
          field.includes(searchTerm.toLowerCase()) ||
          owner.includes(searchTerm.toLowerCase())
        );
      });
    }

    if (filterStatus !== "all") {
      result = result.filter((crop) => crop.status === filterStatus);
    }

    if (filterHealth !== "all") {
      result = result.filter((crop) => crop.healthStatus === filterHealth);
    }

    setFilteredCrops(result);
  }, [searchTerm, filterStatus, filterHealth, crops]);

  const formatDate = (date: string | null | undefined) =>
    date ? new Date(date).toLocaleDateString() : "N/A";

  const getStatusColor = (status: string) => {
    const map: Record<string, any> = {
      growing: "success",
      harvested: "info",
      sold: "primary",
      failed: "error",
    };
    return map[status] || "default";
  };

  const getHealthColor = (health: string) => {
    const map: Record<string, any> = {
      excellent: "success",
      good: "info",
      fair: "warning",
      poor: "error",
    };
    return map[health] || "default";
  };

  const handleDeleteCrop = (id: string) => {
    setCropToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCrop = () => {
    if (cropToDelete) {
      setCrops((prev) => prev.filter((c) => c._id !== cropToDelete));
      setFilteredCrops((prev) => prev.filter((c) => c._id !== cropToDelete));
    }
    setDeleteDialogOpen(false);
    setCropToDelete(null);
  };

  if (loading)
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress />
        </Box>
      </Container>
    );

  if (error)
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h4">Crop Management</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={RouterLink}
            to="/admin/crops/create"
          >
            Add New Crop
          </Button>
        </Box>

        {/* Filters */}
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
          <TextField
            placeholder="Search crops..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="growing">Growing</MenuItem>
              <MenuItem value="harvested">Harvested</MenuItem>
              <MenuItem value="sold">Sold</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Health</InputLabel>
            <Select
              value={filterHealth}
              label="Health"
              onChange={(e) => setFilterHealth(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="excellent">Excellent</MenuItem>
              <MenuItem value="good">Good</MenuItem>
              <MenuItem value="fair">Fair</MenuItem>
              <MenuItem value="poor">Poor</MenuItem>
            </Select>
          </FormControl>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, val) => val && setViewMode(val)}
            size="small"
          >
            <ToggleButton value="table">
              <ViewListIcon />
            </ToggleButton>
            <ToggleButton value="grid">
              <ViewModuleIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Showing {filteredCrops.length} of {crops.length} crops
        </Typography>

        {/* Table view */}
        {viewMode === "table" && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Crop</TableCell>
                  <TableCell>Variety</TableCell>
                  <TableCell>Field</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Health</TableCell>
                  <TableCell>Planting Date</TableCell>
                  <TableCell>Expected Yield</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCrops.map((crop) => (
                  <TableRow key={crop._id}>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <GrassIcon color="primary" />
                        {crop.name}
                      </Box>
                    </TableCell>
                    <TableCell>{crop.variety}</TableCell>
                    <TableCell>{crop.Fields?.name || "N/A"}</TableCell>
                    <TableCell>{crop.Fields?.owner?.name || "Unknown"}</TableCell>
                    <TableCell>
                      <Chip
                        label={crop.status}
                        color={getStatusColor(crop.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={crop.healthStatus}
                        color={getHealthColor(crop.healthStatus)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(crop.plantingDate)}</TableCell>
                    <TableCell>
                      {crop.quantity.expected} {crop.quantity.unit}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton
                          component={RouterLink}
                          to={`/admin/crops/${crop._id}/edit`}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          onClick={() => handleDeleteCrop(crop._id)}
                          size="small"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Grid view */}
        {viewMode === "grid" && (
          <Grid container spacing={3}>
            {filteredCrops.map((crop) => (
              <Grid item xs={12} sm={6} md={4} key={crop._id}>
                <Card>
                  <CardHeader
                    avatar={
                      <Avatar sx={{ bgcolor: "primary.main" }}>
                        <GrassIcon />
                      </Avatar>
                    }
                    title={crop.name}
                    subheader={crop.variety}
                  />
                  <CardContent>
                    <Typography variant="body2">
                      Field: {crop.Fields?.name || "N/A"}
                    </Typography>
                    <Typography variant="body2">
                      Owner: {crop.Fields?.owner?.name || "Unknown"}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, my: 1 }}>
                      <Chip
                        label={crop.status}
                        color={getStatusColor(crop.status)}
                        size="small"
                      />
                      <Chip
                        label={crop.healthStatus}
                        color={getHealthColor(crop.healthStatus)}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2">
                      Planting: {formatDate(crop.plantingDate)}
                    </Typography>
                    <Typography variant="body2">
                      Expected: {crop.quantity.expected} {crop.quantity.unit}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      component={RouterLink}
                      to={`/admin/crops/${crop._id}/edit`}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDeleteCrop(crop._id)}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Empty */}
        {filteredCrops.length === 0 && (
          <Box sx={{ textAlign: "center", py: 5 }}>
            <GrassIcon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No crops found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your filters or search
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Delete confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action cannot be undone. Do you really want to delete this crop?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" onClick={confirmDeleteCrop}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminCrops;
