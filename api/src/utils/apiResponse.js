export const successResponse = (data, meta = {}) => ({
  success: true,
  data,
  meta
});

export const errorResponse = (code, message, details = []) => ({
  success: false,
  error: {
    code,
    message,
    details
  }
});
