export const api = async (endpoint, options = {}) => {
  let baseUrl = import.meta.env.VITE_API_URL || '/api';
  if (baseUrl.includes('localhost')) baseUrl = '/api';
  // Ensure it points to /api
  if (baseUrl === '/') baseUrl = '/api';
  const url = `${baseUrl}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    // Required to send and receive cookies securely
    credentials: 'include',
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  
  return data;
};
