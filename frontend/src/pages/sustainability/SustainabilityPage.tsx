import React, { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../storeHooks';
import { fetchPoints, logAction } from '../../features/sustainability/sustainabilitySlice';
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  MenuItem,
  TextField,
  CircularProgress, // Added for loading states
  Box,              // Added for layout adjustments
  Alert             // Added for error messages
} from '@mui/material';
import type { SustainabilityAction } from '../../types/agrimaan';

// Define the shape of an action item for better type safety and clarity
interface ActionItem {
  value: string;
  label: string;
  points: number;
}

const ACTIONS: ActionItem[] = [
  { value: 'reduced_water_use', label: 'Reduced Water Use', points: 50 },
  { value: 'organic_input', label: 'Organic Input', points: 80 },
  { value: 'crop_rotation', label: 'Crop Rotation', points: 60 },
  { value: 'soil_test', label: 'Soil Test', points: 40 },
  { value: 'solar_pump', label: 'Solar Pump', points: 150 },
  { value: 'low_emission_transport', label: 'Low Emission Transport', points: 70 },
  { value: 'reduced_plastic_use', label: 'Reduced Plastic Use', points: 30 },
  { value: 'tree_planting', label: 'Tree Planting', points: 100 },
  { value: 'composting', label: 'Composting', points: 45 },
  { value: 'biodiversity_practices', label: 'Biodiversity Practices', points: 55 },
  { value: 'energy_efficient_machinery', label: 'Energy Efficient Machinery', points: 120 },
  { value: 'water_harvesting', label: 'Water Harvesting', points: 90 },
  { value: 'cover_cropping', label: 'Cover Cropping', points: 65 },
  { value: 'reduced_tillage', label: 'Reduced Tillage', points: 75 },
  { value: 'integrated_pest_management', label: 'Integrated Pest Management', points: 85 },
  { value: 'renewable_energy_use', label: 'Renewable Energy Use', points: 130 },
  { value: 'waste_reduction', label: 'Waste Reduction', points: 35 },
  { value: 'sustainable_packaging', label: 'Sustainable Packaging', points: 95 },
  { value: 'local_market_sales', label: 'Local Market Sales', points: 25 },
  { value: 'efficient_irrigation', label: 'Efficient Irrigation', points: 110 },
  { value: 'precision_farming', label: 'Precision Farming', points: 140 },
  { value: 'climate_resilient_crops', label: 'Climate Resilient Crops', points: 115 },
  { value: 'community_engagement', label: 'Community Engagement', points: 20 },
  { value: 'sustainable_fertilizers', label: 'Sustainable Fertilizers', points: 105 },
  { value: 'eco_friendly_pest_control', label: 'Eco-friendly Pest Control', points: 125 },
  { value: 'carbon_sequestration', label: 'Carbon Sequestration', points: 150 },
  { value: 'water_conservation', label: 'Water Conservation', points: 60 },
  { value: 'soil_health_management', label: 'Soil Health Management', points: 80 },
  { value: 'renewable_energy_installation', label: 'Renewable Energy Installation', points: 200 },
  { value: 'sustainable_land_management', label: 'Sustainable Land Management', points: 90 },
  { value: 'biodiversity_enhancement', label: 'Biodiversity Enhancement', points: 70 },
  { value: 'sustainable_harvesting', label: 'Sustainable Harvesting', points: 55 },
  { value: 'eco_friendly_transport', label: 'Eco-friendly Transport', points: 65 },
  { value: 'sustainable_water_management', label: 'Sustainable Water Management', points: 85 },
  { value: 'green_building_practices', label: 'Green Building Practices', points: 95 },
  { value: 'sustainable_supply_chain', label: 'Sustainable Supply Chain', points: 100 },
  { value: 'environmental_education', label: 'Environmental Education', points: 40 },
  { value: 'sustainable_fishing_practices', label: 'Sustainable Fishing Practices', points: 120 },
  { value: 'wildlife_conservation', label: 'Wildlife Conservation', points: 130 },
  { value: 'sustainable_forest_management', label: 'Sustainable Forest Management', points: 150 },
  { value: 'renewable_energy_research', label: 'Renewable Energy Research', points: 160 },
  { value: 'sustainable_agriculture_research', label: 'Sustainable Agriculture Research', points: 170 },
  { value: 'climate_change_mitigation', label: 'Climate Change Mitigation', points: 180 },
  { value: 'sustainable_urban_farming', label: 'Sustainable Urban Farming', points: 190 },
  { value: 'sustainable_rural_development', label: 'Sustainable Rural Development', points: 200 },
  { value: 'green_technology_adoption', label: 'Green Technology Adoption', points: 210 },
  { value: 'sustainable_transport_infrastructure', label: 'Sustainable Transport Infrastructure', points: 220 },
  { value: 'sustainable_energy_policy_advocacy', label: 'Sustainable Energy Policy Advocacy', points: 230 },
  { value: 'sustainable_water_policy_advocacy', label: 'Sustainable Water Policy Advocacy', points: 240 },
  { value: 'sustainable_land_use_policy_advocacy', label: 'Sustainable Land Use Policy Advocacy', points: 250 },
  { value: 'sustainable_forest_policy_advocacy', label: 'Sustainable Forest Policy Advocacy', points: 260 },
  { value: 'sustainable_biodiversity_policy_advocacy', label: 'Sustainable Biodiversity Policy Advocacy', points: 270 },
  { value: 'sustainable_climate_policy_advocacy', label: 'Sustainable Climate Policy Advocacy', points: 280 },
  { value: 'sustainable_development_goals_advocacy', label: 'Sustainable Development Goals Advocacy', points: 300 },
];

export default function SustainabilityPage() {
  const dispatch = useAppDispatch();
  // Improved type assertion for userId and sustainability state
  const userId = useAppSelector((state) => state.auth.user?.id) as string | undefined;
  // Assuming 'error' state is also available in sustainabilitySlice for better error handling
  const { summary, loading, error } = useAppSelector((state) => state.sustainability);
  const [selectedActionValue, setSelectedActionValue] = useState<string>(ACTIONS[0].value);
  const [isLogging, setIsLogging] = useState<boolean>(false); // State to manage logging button loading

  // Fetch points only when userId is available
  useEffect(() => {
    if (userId) {
      dispatch(fetchPoints(userId));
    }
  }, [dispatch, userId]);

  // Use useCallback for event handlers to prevent unnecessary re-renders
  const handleActionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedActionValue(e.target.value);
  }, []); // No dependencies needed as it only uses `e.target.value`

  const handleSubmit = useCallback(async () => {
    if (!userId) {
      console.error("User not logged in. Cannot log action.");
      // You might want to display a user-facing error here (e.g., using a Snackbar or Alert)
      return;
    }
    setIsLogging(true); // Start loading state for button

    const meta = ACTIONS.find(a => a.value === selectedActionValue);

    if (!meta) {
      console.error("Selected action not found:", selectedActionValue);
      setIsLogging(false);
      // Display a user-facing error message
      return;
    }

    try {
      // logAction is an async thunk. Use .unwrap() to catch rejections directly.
      await dispatch(logAction({ userId, action: selectedActionValue as any, points: meta.points })).unwrap();
      // Optional: show a success message to the user (e.g., a green Snackbar)
    } catch (err) {
      console.error("Failed to log action:", err);
      // Optional: show a user-facing error message (e.g., a red Snackbar/Alert)
    } finally {
      setIsLogging(false); // End loading state for button
    }
  }, [dispatch, userId, selectedActionValue]); // Dependencies for useCallback

  // --- Loading and Error States ---
  if (loading && !summary) { // Only show full-page loader on initial load or if summary is empty
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading sustainability data...</Typography>
      </Box>
    );
  }

  if (error) { // Display a prominent error message if fetching failed
    return (
      <Box mt={4} sx={{ p: 2 }}>
        <Alert severity="error">
          Failed to load sustainability data. Please try again later.
          {/* You could add a retry button here */}
        </Alert>
      </Box>
    );
  }

  // If summary is null/undefined after loading (e.g., new user, no data yet)
  if (!summary) {
    return (
      <Box mt={4} sx={{ p: 2 }}>
        <Typography variant="h6" color="text.secondary">
          No sustainability data available for this user.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Log your first action to get started!
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={3} sx={{ p: 2, maxWidth: 600, margin: 'auto' }}> {/* Added max width and auto margin for better centering on larger screens */}
      <Card raised> {/* Added raised prop for better visual separation */}
        <CardContent>
          <Typography variant="h6" gutterBottom>Green Points</Typography> {/* Added gutterBottom for spacing */}
          <Typography variant="h3" color="primary">{summary.totalPoints}</Typography> {/* Highlight totalPoints */}
          <Typography variant="body2">Carbon Credits: {summary.carbonCredits}</Typography>
        </CardContent>
      </Card>

      <Card raised>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>Log Sustainability Action</Typography>
          <TextField
            select
            value={selectedActionValue}
            onChange={handleActionChange}
            label="Select Action" // Added a label for better UX
            fullWidth // Makes the select fill available width
            sx={{ mt: 1 }}
            SelectProps={{
              MenuProps: {
                PaperProps: {
                  style: {
                    maxHeight: 300, // Limit dropdown height for a large number of items
                  },
                },
              },
            }}
          >
            {ACTIONS.map(a => (
              <MenuItem key={a.value} value={a.value}>
                {a.label} (+{a.points})
              </MenuItem>
            ))}
          </TextField>
          <Button
            sx={{ mt: 2 }} // Adjusted margin top
            variant="contained"
            onClick={handleSubmit}
            disabled={isLogging || !userId} // Disable button during logging or if no user
            fullWidth // Makes the button fill available width
            startIcon={isLogging ? <CircularProgress size={20} color="inherit" /> : null} // Icon for loading
          >
            {isLogging ? 'Adding Action...' : 'Add Action'}
          </Button>
          {/* You could add a small success/error message here after submit */}
        </CardContent>
      </Card>

      <Card raised>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>Recent Actions</Typography>
          {summary.actions && summary.actions.length > 0 ? ( // Check if actions exist and not empty
            <Stack spacing={1}> {/* Use Stack for consistent spacing of actions */}
              {summary.actions.slice(0, 10).map((a: SustainabilityAction) => (
                <Typography key={a.id} variant="body2">
                  <strong>{a.action.replace(/_/g, ' ')}</strong> &bull; +{a.points} &bull; {new Date(a.createdAt).toLocaleString()}
                </Typography>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">No recent actions logged.</Typography>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}