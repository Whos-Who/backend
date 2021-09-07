export const handleError = (err) => {
  const { name, statusCode, message } = err;

  return {
    name,
    statusCode,
    message
  };
};
