import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import App from '../App';
import ProtectedRoute from '../utils/ProtectedRoute';

// Configure mock store
const middlewares = [thunk];
const mockStore = configureStore(middlewares);

// Mock components
const MockComponent = () => <div>Protected Content</div>;

describe('Protected Routes', () => {
  let authenticatedStore;
  let unauthenticatedStore;
  let loadingStore;

  beforeEach(() => {
    authenticatedStore = mockStore({
      auth: {
        isAuthenticated: true,
        loading: false,
        user: {
          id: '1',
          firstName: 'Test',
          lastName: 'Farmer',
          email: 'farmer@agrimaan.com',
          role: 'farmer'
        }
      }
    });
    
    unauthenticatedStore = mockStore({
      auth: {
        isAuthenticated: false,
        loading: false,
        user: null
      }
    });
    
    loadingStore = mockStore({
      auth: {
        isAuthenticated: false,
        loading: true,
        user: null
      }
    });
  });

  test('renders protected component when authenticated', () => {
    render(
      <Provider store={authenticatedStore}>
        <BrowserRouter>
          <ProtectedRoute component={MockComponent} allowedRoles={['farmer']} />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText(/Protected Content/i)).toBeInTheDocument();
  });

  test('redirects to login when not authenticated', () => {
    render(
      <Provider store={unauthenticatedStore}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <ProtectedRoute component={MockComponent} allowedRoles={['farmer']} />
        </MemoryRouter>
      </Provider>
    );
    
    // Should not render protected content
    expect(screen.queryByText(/Protected Content/i)).not.toBeInTheDocument();
  });

  test('shows loading indicator when authentication is being checked', () => {
    render(
      <Provider store={loadingStore}>
        <BrowserRouter>
          <ProtectedRoute component={MockComponent} allowedRoles={['farmer']} />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  test('shows unauthorized message when user role is not allowed', () => {
    const wrongRoleStore = mockStore({
      auth: {
        isAuthenticated: true,
        loading: false,
        user: {
          id: '2',
          firstName: 'Test',
          lastName: 'User',
          email: 'user@agrimaan.com',
          role: 'buyer' // Different role than allowed
        }
      }
    });
    
    render(
      <Provider store={wrongRoleStore}>
        <BrowserRouter>
          <ProtectedRoute component={MockComponent} allowedRoles={['farmer', 'admin']} />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText(/Unauthorized/i)).toBeInTheDocument();
    expect(screen.getByText(/You do not have permission to access this page./i)).toBeInTheDocument();
  });

  test('authenticated user can access dashboard', () => {
    render(
      <Provider store={authenticatedStore}>
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      </Provider>
    );
    
    // Should render the dashboard content
    expect(screen.getByText(/Welcome, Test!/i)).toBeInTheDocument();
  });

  test('unauthenticated user is redirected to login', () => {
    render(
      <Provider store={unauthenticatedStore}>
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      </Provider>
    );
    
    // Should render login page
    expect(screen.getByText(/Sign in/i)).toBeInTheDocument();
  });
});