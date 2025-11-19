import Autocomplete from '@mui/material/Autocomplete';
import { searchNominatim, type GeoSuggestion } from '../../services/field';
import React, { useState, useEffect } from 'react';
import { TextField, CircularProgress } from '@mui/material';

function useDebouncedValue<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
const AddressAutocomplete: React.FC<{
  value: string;
  onPicked: (address: string, lat: number, lon: number) => void;
  label?: string;
  placeholder?: string;
}> = ({ value, onPicked, label = 'Field Location', placeholder }) => {
  const [input, setInput] = React.useState(value || '');
  const debounced = useDebouncedValue(input, 350);
  const [options, setOptions] = React.useState<GeoSuggestion[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => setInput(value || ''), [value]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!debounced.trim()) {
        setOptions([]);
        return;
      }
      try {
        setLoading(true);
        const results = await searchNominatim(debounced, 7);
        if (!cancelled) setOptions(results);
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const commitFreeText = async () => {
    if (!input.trim()) return;
    try {
      const [first] = await searchNominatim(input, 1);
      if (first) onPicked(first.display_name, Number(first.lat), Number(first.lon));
      else onPicked(input, 0, 0);
    } catch {
      onPicked(input, 0, 0);
    }
  };

  return (
    <Autocomplete
      freeSolo
      options={options}
      loading={loading}
      getOptionLabel={(o) => (typeof o === 'string' ? o : o.display_name)}
      filterOptions={(x) => x}
      inputValue={input}
      onInputChange={(_, v) => setInput(v)}
      onChange={(_, v) => {
        if (!v) return;
        if (typeof v === 'string') {
          commitFreeText();
          return;
        }
        onPicked(v.display_name, Number(v.lat), Number(v.lon));
        setInput(v.display_name);
      }}
      onBlur={commitFreeText}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder || 'Start typing address, village, city…'}
          fullWidth
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress size={18} /> : null}
                {params.InputProps.endAdornment}
              </>
            )
          }}
        />
      )}
    />
  );
};

export default AddressAutocomplete;