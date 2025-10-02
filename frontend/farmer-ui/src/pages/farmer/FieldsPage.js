import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const FieldsPage = () => {
  const { t } = useTranslation();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/fields`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFields(response.data.data || response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch fields');
      console.error('Error fetching fields:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fieldId) => {
    if (!window.confirm(t('fields.confirmDelete'))) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/fields/${fieldId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFields(fields.filter(field => field._id !== fieldId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete field');
    }
  };

  const filteredFields = fields.filter(field => {
    const matchesSearch = field.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         field.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || field.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>{t('fields.title')}</h1>
        <Link to="/farmer/fields/add" style={styles.addButton}>
          + {t('fields.addField')}
        </Link>
      </div>

      {error && (
        <div style={styles.error}>{error}</div>
      )}

      <div style={styles.filters}>
        <input
          type="text"
          placeholder={t('fields.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">{t('fields.allStatus')}</option>
          <option value="active">{t('fields.active')}</option>
          <option value="inactive">{t('fields.inactive')}</option>
          <option value="fallow">{t('fields.fallow')}</option>
        </select>
      </div>

      {filteredFields.length === 0 ? (
        <div style={styles.emptyState}>
          <p>{t('fields.noFields')}</p>
          <Link to="/farmer/fields/add" style={styles.addButton}>
            {t('fields.addFirstField')}
          </Link>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredFields.map(field => (
            <div key={field._id} style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>{field.name}</h3>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: getStatusColor(field.status)
                }}>
                  {field.status}
                </span>
              </div>
              
              <div style={styles.cardBody}>
                <div style={styles.infoRow}>
                  <span style={styles.label}>{t('fields.area')}:</span>
                  <span style={styles.value}>{field.area} {field.areaUnit || 'acres'}</span>
                </div>
                
                <div style={styles.infoRow}>
                  <span style={styles.label}>{t('fields.location')}:</span>
                  <span style={styles.value}>{field.location || 'N/A'}</span>
                </div>
                
                <div style={styles.infoRow}>
                  <span style={styles.label}>{t('fields.soilType')}:</span>
                  <span style={styles.value}>{field.soilType || 'N/A'}</span>
                </div>
                
                {field.currentCrop && (
                  <div style={styles.infoRow}>
                    <span style={styles.label}>{t('fields.currentCrop')}:</span>
                    <span style={styles.value}>{field.currentCrop}</span>
                  </div>
                )}
              </div>
              
              <div style={styles.cardFooter}>
                <Link to={`/farmer/fields/${field._id}`} style={styles.viewButton}>
                  {t('common.view')}
                </Link>
                <Link to={`/farmer/fields/${field._id}/edit`} style={styles.editButton}>
                  {t('common.edit')}
                </Link>
                <button
                  onClick={() => handleDelete(field._id)}
                  style={styles.deleteButton}
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case 'active': return '#4caf50';
    case 'inactive': return '#f44336';
    case 'fallow': return '#ff9800';
    default: return '#9e9e9e';
  }
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0,
  },
  addButton: {
    padding: '12px 24px',
    backgroundColor: '#4caf50',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: '500',
    transition: 'background-color 0.3s',
    border: 'none',
    cursor: 'pointer',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    color: '#666',
  },
  error: {
    padding: '12px',
    backgroundColor: '#ffebee',
    color: '#c62828',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  filters: {
    display: 'flex',
    gap: '15px',
    marginBottom: '30px',
  },
  searchInput: {
    flex: 1,
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
  },
  filterSelect: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    minWidth: '150px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#f5f5f5',
    borderRadius: '12px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  cardHeader: {
    padding: '20px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    color: 'white',
    textTransform: 'capitalize',
  },
  cardBody: {
    padding: '20px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  label: {
    fontWeight: '500',
    color: '#666',
  },
  value: {
    color: '#333',
  },
  cardFooter: {
    padding: '15px 20px',
    backgroundColor: '#f9f9f9',
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
  },
  viewButton: {
    padding: '8px 16px',
    backgroundColor: '#2196f3',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    border: 'none',
    cursor: 'pointer',
  },
  editButton: {
    padding: '8px 16px',
    backgroundColor: '#ff9800',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    border: 'none',
    cursor: 'pointer',
  },
  deleteButton: {
    padding: '8px 16px',
    backgroundColor: '#f44336',
    color: 'white',
    borderRadius: '6px',
    fontSize: '14px',
    border: 'none',
    cursor: 'pointer',
  },
};

export default FieldsPage;