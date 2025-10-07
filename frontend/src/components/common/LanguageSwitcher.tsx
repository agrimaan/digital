import React from 'react';
import { useTranslation } from 'react-i18next';
import { FormControl, Select, MenuItem } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { languages } from '../../i18n';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (e: SelectChangeEvent) => {
    const languageCode = e.target.value as string;
    i18n.changeLanguage(languageCode);
    localStorage.setItem('preferredLanguage', languageCode);
  };

  return (
    <FormControl size="small" sx={{ m: 1, minWidth: 120 }}>
      <Select
        value={i18n.language}
        onChange={handleLanguageChange}
        sx={{ color: 'white', '& .MuiSvgIcon-root': { color: 'white' } }}
      >
        {languages.map((lang) => (
          <MenuItem key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default LanguageSwitcher;