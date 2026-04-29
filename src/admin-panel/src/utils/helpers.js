/**
 * Extract data from API response
 * Backend returns: { success, message, data }
 * This helper extracts the actual data
 */
export const getResponseData = (response) => {
  return response.data?.data || response.data;
};

/**
 * Extract error message from error response
 */
export const getErrorMessage = (error, defaultMessage = 'An error occurred') => {
  return error.response?.data?.message || error.message || defaultMessage;
};
