import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { languages, isRTL } from '../i18n';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const changeLanguage = (languageCode) => {
    i18n.changeLanguage(languageCode);
    
    // Update document direction for RTL languages
    if (isRTL(languageCode)) {
      document.documentElement.setAttribute('dir', 'rtl');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
    }
    
    setIsOpen(false);
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <div className="language-switcher" style={styles.container}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        style={styles.button}
        aria-label="Select Language"
      >
        <span style={styles.flag}>{currentLanguage.flag}</span>
        <span style={styles.languageName}>{currentLanguage.nativeName}</span>
        <span style={styles.arrow}>{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {isOpen && (
        <div style={styles.dropdown}>
          <div style={styles.dropdownContent}>
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => changeLanguage(language.code)}
                style={{
                  ...styles.languageOption,
                  ...(i18n.language === language.code ? styles.activeLanguage : {})
                }}
              >
                <span style={styles.flag}>{language.flag}</span>
                <span style={styles.languageText}>
                  <span style={styles.nativeName}>{language.nativeName}</span>
                  <span style={styles.englishName}>{language.name}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    display: 'inline-block',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  flag: {
    fontSize: '20px',
  },
  languageName: {
    color: '#333',
  },
  arrow: {
    fontSize: '10px',
    color: '#666',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: '0',
    marginTop: '8px',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 1000,
    minWidth: '250px',
    maxHeight: '400px',
    overflow: 'auto',
  },
  dropdownContent: {
    padding: '8px',
  },
  languageOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '12px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background-color 0.2s',
  },
  activeLanguage: {
    backgroundColor: '#e3f2fd',
  },
  languageText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  nativeName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  },
  englishName: {
    fontSize: '12px',
    color: '#666',
  },
};

export default LanguageSwitcher;