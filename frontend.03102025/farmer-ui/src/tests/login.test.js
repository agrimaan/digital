import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import LoginPage from '../pages/LoginPage';
import { mockApiResponses } from '../test-setup';

// Mock axios
jest.mock('axios', () => ({
  post: jest.fn((url, data) => {
    if (url.includes('/auth/login')) {
      if (data.email === 'farmer@agrimaan.com' && data.password === 'password123') {
        return Promise.resolve({ data: mockApiResponses.login.success });
      } else {
        return Promise.reject({ 
          response: { 
            data: { message: mockApiResponses.login.error.message } 
          } 
        });
      }
    }
    return Promise.reject(new Error('Not found'));
  })
}));

// Configure mock store
const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe('Login Page', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      auth: {
        loading: false,
        error: null,
        isAuthenticated: false
      }
    });
    
    // Mock dispatch
    store.dispatch = jest.fn();
  });

  test('renders login form', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText(/Agrimaan Farmer Service/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  test('handles form input changes', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </Provider>
    );
    
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    
    fireEvent.change(emailInput, { target: { value: 'farmer@agrimaan.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    expect(emailInput.value).toBe('farmer@agrimaan.com');
    expect(passwordInput.value).toBe('password123');
  });

  test('submits form with valid credentials', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </Provider>
    );
    
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    
    fireEvent.change(emailInput, { target: { value: 'farmer@agrimaan.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalled();
    });
  });

  test('shows error message with invalid credentials', async () => {
    // Set up store with error state
    store = mockStore({
      auth: {
        loading: false,
        error: 'Invalid credentials',
        isAuthenticated: false
      }
    });
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </Provider>
    );
    
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    
    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);
    
    // Open snackbar to show error
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });
  });
});