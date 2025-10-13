import React from 'react';
import { useTranslation } from 'react-i18next';
import { FormControl, Select, MenuItem, ListItemIcon, ListItemText, Box } from '@mui/material';
import { SelectChangeEvent } from '@mui/material';
import { languages } from '../../i18n';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (e: SelectChangeEvent) => {
    const languageCode = e.target.value as string;
    i18n.changeLanguage(languageCode);
    localStorage.setItem('preferredLanguage', languageCode);
  };

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  return (
    <FormControl size="small" sx={{ m: 1, minWidth: 140 }}>
      <Select
        value={currentLang.code}
        onChange={handleLanguageChange}
        sx={{
          color: 'white',
          '& .MuiSvgIcon-root': { color: 'white' },
        }}
        renderValue={(selected) => {
          const lang = languages.find((l) => l.code === selected) || currentLang;
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ fontSize: '1.2rem' }}>{lang.flag}</span>
              <span>{lang.name}</span>
            </Box>
          );
        }}
      >
        {languages.map((lang) => (
          <MenuItem key={lang.code} value={lang.code}>
            <ListItemIcon>
              <span style={{ fontSize: '1.2rem' }}>{lang.flag}</span>
            </ListItemIcon>
            <ListItemText primary={lang.name} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default LanguageSwitcher;
