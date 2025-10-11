// --- Mocked Versions of Your Shared Library for Browser ---
// NOTE: These are simplified mocks to simulate the behavior of your backend
// utilities in a browser environment for this test component.

const mockServer = {
  failureCount: 0,
  maxFailures: 5,
  async request() {
    if (this.failureCount < this.maxFailures) {
      this.failureCount++;
      throw new Error(`Service unavailable (${this.failureCount}/${this.maxFailures})`);
    }
    return { success: true, message: 'Service is now available' };
  },
  reset() {
    this.failureCount = 0;
  }
};

class MockResilientHttpClient {
  // This mock simulates the request but doesn't have a real circuit breaker.
  // It just calls the mock server directly to show the flow.
  async request(config, fallback) {
    try {
      return await mockServer.request();
    } catch (error) {
      // In a real scenario, the circuit breaker would handle this.
      // Here, we'll just use the fallback if provided.
      if (fallback) {
        return fallback();
      }
      throw error;
    }
  }
}

class MockUserServiceClient {
  // Simulates the user service client, always returning a fallback.
  async getUserById(id) {
    console.log(`Attempting to get user ${id}, but will use fallback.`);
    return { id, name: 'Fallback User', message: 'Could not connect to the real service.' };
  }
}

const mockRetry = async (asyncFn, options = { retries: 3, delay: 100 }) => {
  let lastError;
  for (let i = 0; i < options.retries; i++) {
    try {
      return await asyncFn();
    } catch (error) {
      lastError = error;
      await new Promise(res => setTimeout(res, options.delay * (i + 1)));
    }
  }
  throw lastError;
};

// --- The React Component ---

const CircuitBreakerTester = () => {
  const [logs, setLogs] = useState(['Test logs will appear here.']);
  const [isRunning, setIsRunning] = useState(false);

  const logToState = (message) => {
    console.log(message);
    setLogs(prevLogs => [...prevLogs, message]);
  };

  const runAllTests = useCallback(async () => {
    setIsRunning(true);
    setLogs(['🚀 Starting resilience tests...']);
    
    // Helper function to add delays
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    try {
      // --- 1. Test ResilientHttpClient ---
      logToState('--- 1. Testing ResilientHttpClient ---');
      const client = new MockResilientHttpClient();
      mockServer.reset();
      mockServer.maxFailures = 5;

      logToState('\nFirst set of requests (should fail and open circuit):');
      for (let i = 0; i < 5; i++) {
        try {
          const result = await client.request({ url: '/test' }, () => ({ fallback: true }));
          logToState(`Request ${i + 1} result: ${JSON.stringify(result)}`);
        } catch (error) {
          logToState(`Request ${i + 1} error: ${error.message}`);
        }
      }

      logToState('\nWaiting for circuit to transition to half-open...');
      await sleep(2500);

      mockServer.reset(); // Service is now "healthy"
      
      logToState('\nSecond set of requests (should succeed and close circuit):');
      for (let i = 0; i < 3; i++) {
        try {
          const result = await client.request({ url: '/test' });
          logToState(`Request ${i + 1} result: ${JSON.stringify(result)}`);
        } catch (error) {
          logToState(`Request ${i + 1} error: ${error.message}`);
        }
      }

      // --- 2. Test UserServiceClient ---
      logToState('\n--- 2. Testing UserServiceClient ---');
      const userClient = new MockUserServiceClient();
      const user = await userClient.getUserById('123');
      logToState(`User result: ${JSON.stringify(user)}`);
      
      // --- 3. Test Retry Utility ---
      logToState('\n--- 3. Testing retry utility ---');
      mockServer.reset();
      mockServer.maxFailures = 2; // Will fail twice before succeeding
      const retryResult = await mockRetry(mockServer.request.bind(mockServer), { retries: 3, delay: 500 });
      logToState(`Retry result: ${JSON.stringify(retryResult)}`);

      logToState('\n✅ All tests completed!');
    } catch (error) {
      logToState(`❌ Test suite failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  }, []);

  const styles = {
    container: {
      fontFamily: 'sans-serif',
      padding: '20px',
      border: '1px solid #ccc',
      borderRadius: '8px',
      maxWidth: '800px',
      margin: '20px auto',
    },
    button: {
      padding: '10px 20px',
      fontSize: '16px',
      cursor: 'pointer',
      marginBottom: '20px',
    },
    logBox: {
      backgroundColor: '#f4f4f4',
      border: '1px solid #ddd',
      padding: '15px',
      height: '400px',
      overflowY: 'scroll',
      whiteSpace: 'pre-wrap', // Allows text to wrap
      fontFamily: 'monospace',
      fontSize: '14px',
    }
  };

  
};

