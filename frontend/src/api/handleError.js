/**
 * Processes API errors and returns user-friendly messages.
 * 
 * @param {object} error - The error object thrown by axios/network
 * @returns {string} User-friendly error message
 */
export function handleApiError(error) {
  if (!error || !error.response) {
    return 'No internet connection. Please check your network.';
  }

  const { status, data } = error.response;

  if (status === 401) {
    return 'Session expired. Please log in again.';
  }
  if (status === 403) {
    return 'You need to study this group first.';
  }
  if (status === 404) {
    return 'Content not found.';
  }
  if (status >= 500) {
    return 'Server error. Please try again in a moment.';
  }

  return data?.error || 'Something went wrong.';
}
