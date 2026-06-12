const success = (res, data, message = 'OK', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

const error = (res, message = 'Internal server error', statusCode = 500, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

module.exports = { success, error };
