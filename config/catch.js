const catchError = (func) => {
  return async (req, res, next) => {
    try {
      await func(req, res, next);
    } catch (error) {
      res
        .status(500)
        .json({ message: error.message || "Internal server error" });
    }
  };
};

module.exports = catchError;
