# CropManagement Integration Guide

## Adding Publish to Marketplace Feature

This guide shows how to add the "Publish to Marketplace" button to the existing CropManagement component.

## Step 1: Import Required Components

Add these imports at the top of `CropManagement.tsx`:

```tsx
import PublishCropDialog from '../../components/PublishCropDialog';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
```

## Step 2: Add State Variables

Add these state variables with your other useState declarations:

```tsx
const [publishDialogOpen, setPublishDialogOpen] = useState(false);
const [cropToPublish, setCropToPublish] = useState<Crop | null>(null);
```

## Step 3: Add Handler Function

Add this handler function with your other handlers:

```tsx
const handlePublishClick = (crop: Crop) => {
  // Validate crop is ready for publishing
  if (!['harvested', 'maturity'].includes(crop.growthStage || '')) {
    alert('Crop must be in harvested or maturity stage to publish to marketplace');
    return;
  }
  
  if (!crop.actualYield || crop.actualYield <= 0) {
    alert('Please record actual yield before publishing to marketplace');
    return;
  }
  
  setCropToPublish(crop);
  setPublishDialogOpen(true);
};

const handlePublishSuccess = () => {
  setPublishDialogOpen(false);
  setCropToPublish(null);
  dispatch(getCrops()); // Reload crops to show updated marketplace status
};
```

## Step 4: Add Publish Button to Table Actions

In your table's action column, add the publish button alongside View, Edit, and Delete:

```tsx
<TableCell align="center">
  <Tooltip title="View">
    <IconButton onClick={() => openView(c)}>
      <Visibility />
    </IconButton>
  </Tooltip>
  
  <Tooltip title="Edit">
    <IconButton onClick={() => openEdit(c)}>
      <Edit />
    </IconButton>
  </Tooltip>
  
  {/* NEW: Publish to Marketplace Button */}
  <Tooltip title={
    ['harvested', 'maturity'].includes(c.growthStage || '') && c.actualYield
      ? 'Publish to Marketplace'
      : 'Crop must be harvested with recorded yield'
  }>
    <span>
      <IconButton 
        onClick={() => handlePublishClick(c)}
        disabled={
          !['harvested', 'maturity'].includes(c.growthStage || '') || 
          !c.actualYield || 
          c.actualYield <= 0
        }
        color="primary"
      >
        <CloudUploadIcon />
      </IconButton>
    </span>
  </Tooltip>
  
  <Tooltip title="Delete">
    <IconButton color="error" onClick={() => handleDeleteClick(c)}>
      <Delete />
    </IconButton>
  </Tooltip>
</TableCell>
```

## Step 5: Add Dialog Component

Add the PublishCropDialog at the end of your component, before the closing tag:

```tsx
{/* Existing dialogs... */}

{/* NEW: Publish to Marketplace Dialog */}
<PublishCropDialog
  open={publishDialogOpen}
  onClose={() => {
    setPublishDialogOpen(false);
    setCropToPublish(null);
  }}
  crop={cropToPublish}
  onSuccess={handlePublishSuccess}
/>
```

## Step 6: Optional - Add Marketplace Status Indicator

You can add a visual indicator in the table to show which crops are already published:

```tsx
<TableCell>
  {c.marketplaceListing?.status === 'active' ? (
    <Chip 
      label="Listed" 
      color="success" 
      size="small"
      icon={<CloudUploadIcon />}
    />
  ) : (
    <Chip 
      label="Not Listed" 
      variant="outlined" 
      size="small"
    />
  )}
</TableCell>
```

Add this as a new column in your table header:

```tsx
<TableHead>
  <TableRow>
    <TableCell>Name</TableCell>
    <TableCell>Variety</TableCell>
    <TableCell>Scientific</TableCell>
    <TableCell>Field</TableCell>
    <TableCell>Planting</TableCell>
    <TableCell>Harvest (exp.)</TableCell>
    <TableCell>Marketplace</TableCell> {/* NEW */}
    <TableCell align="center">Actions</TableCell>
  </TableRow>
</TableHead>
```

## Complete Example

Here's a complete example of the action cell with all buttons:

```tsx
<TableCell align="center">
  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
    {/* View */}
    <Tooltip title="View">
      <IconButton size="small" onClick={() => openView(c)}>
        <Visibility fontSize="small" />
      </IconButton>
    </Tooltip>
    
    {/* Edit */}
    <Tooltip title="Edit">
      <IconButton size="small" onClick={() => openEdit(c)}>
        <Edit fontSize="small" />
      </IconButton>
    </Tooltip>
    
    {/* Publish to Marketplace */}
    <Tooltip title={
      ['harvested', 'maturity'].includes(c.growthStage || '') && c.actualYield
        ? c.marketplaceListing?.status === 'active'
          ? 'Already published to marketplace'
          : 'Publish to Marketplace'
        : 'Crop must be harvested with recorded yield'
    }>
      <span>
        <IconButton 
          size="small"
          onClick={() => handlePublishClick(c)}
          disabled={
            !['harvested', 'maturity'].includes(c.growthStage || '') || 
            !c.actualYield || 
            c.actualYield <= 0 ||
            c.marketplaceListing?.status === 'active'
          }
          color={c.marketplaceListing?.status === 'active' ? 'success' : 'primary'}
        >
          <CloudUploadIcon fontSize="small" />
        </IconButton>
      </span>
    </Tooltip>
    
    {/* Delete */}
    <Tooltip title="Delete">
      <IconButton 
        size="small" 
        color="error" 
        onClick={() => handleDeleteClick(c)}
      >
        <Delete fontSize="small" />
      </IconButton>
    </Tooltip>
  </Box>
</TableCell>
```

## Visual Feedback

Add visual feedback for published crops by updating the table row styling:

```tsx
<TableRow 
  key={c._id}
  sx={{
    bgcolor: c.marketplaceListing?.status === 'active' 
      ? 'success.light' 
      : 'inherit',
    opacity: c.marketplaceListing?.status === 'active' ? 0.9 : 1
  }}
>
```

## Filter for Marketplace Status

Add a filter to show only published or unpublished crops:

```tsx
// Add to filter state
const [filterMarketplace, setFilterMarketplace] = useState('');

// Add to filter UI
<FormControl size="small" sx={{ minWidth: 180 }}>
  <InputLabel>Marketplace</InputLabel>
  <Select 
    value={filterMarketplace} 
    label="Marketplace" 
    onChange={(e) => setFilterMarketplace(e.target.value)}
  >
    <MenuItem value="">All</MenuItem>
    <MenuItem value="listed">Listed</MenuItem>
    <MenuItem value="not-listed">Not Listed</MenuItem>
  </Select>
</FormControl>

// Add to filter logic
const matchesMarketplace = !filterMarketplace || 
  (filterMarketplace === 'listed' && c.marketplaceListing?.status === 'active') ||
  (filterMarketplace === 'not-listed' && c.marketplaceListing?.status !== 'active');
```

## Testing the Integration

1. **Create a test crop:**
   - Add a new crop with all required fields
   - Set planting date and expected harvest date

2. **Update to harvested:**
   - Edit the crop
   - Change growth stage to "harvested"
   - Add actual yield value
   - Save changes

3. **Publish to marketplace:**
   - Click the publish button (cloud upload icon)
   - Fill in the publish dialog:
     - Price per unit
     - Quantity to list
     - Description (optional)
     - Mark as organic (optional)
     - Add certifications (optional)
   - Click "Publish to Marketplace"

4. **Verify in buyer marketplace:**
   - Navigate to buyer marketplace
   - Search for your crop
   - Verify all details are correct

5. **Test unlisting:**
   - Go back to crop management
   - The crop should show as "Listed"
   - You can add an unlist button if needed

## Troubleshooting

### Button is disabled
- Check crop growth stage is 'harvested' or 'maturity'
- Verify actualYield is set and > 0
- Check if crop is already published

### Dialog doesn't open
- Verify PublishCropDialog is imported correctly
- Check state variables are defined
- Ensure handler function is called

### Publishing fails
- Check backend services are running
- Verify authentication token is valid
- Check browser console for errors
- Review backend logs for detailed errors

### Product doesn't appear in marketplace
- Verify product was created in database
- Check isActive is true
- Ensure buyer marketplace is fetching from API
- Clear browser cache and reload

## Additional Features

### Unlist Button

Add an unlist button for published crops:

```tsx
{c.marketplaceListing?.status === 'active' && (
  <Tooltip title="Unlist from Marketplace">
    <IconButton 
      size="small"
      onClick={() => handleUnlistClick(c)}
      color="warning"
    >
      <CloudOffIcon fontSize="small" />
    </IconButton>
  </Tooltip>
)}
```

With handler:

```tsx
const handleUnlistClick = async (crop: Crop) => {
  if (window.confirm(`Unlist ${crop.name} from marketplace?`)) {
    try {
      await marketplaceService.unlistCrop(crop._id!);
      alert('Crop unlisted successfully');
      dispatch(getCrops());
    } catch (error: any) {
      alert(`Failed to unlist: ${error.message}`);
    }
  }
};
```

### Quick Publish Button

Add a quick publish button in the crop detail view:

```tsx
{viewingCrop && ['harvested', 'maturity'].includes(viewingCrop.growthStage || '') && (
  <Button
    variant="contained"
    startIcon={<CloudUploadIcon />}
    onClick={() => {
      setDialogOpen(false);
      handlePublishClick(viewingCrop);
    }}
    disabled={!viewingCrop.actualYield}
  >
    Publish to Marketplace
  </Button>
)}
```

## Summary

After completing these steps, farmers will be able to:
- See which crops are eligible for publishing
- Publish harvested crops with one click
- Set pricing and quantity
- Track marketplace status
- Unlist crops when needed

The integration is seamless and follows the existing UI patterns in CropManagement.