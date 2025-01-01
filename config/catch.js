const catchError = (func) => {
  return async (req, res, next) => {
    try {
      await func(req, res, next);
    } catch (error) {
      console.log(error.message);
      res
        .status(500)
        .json({ message: error.message || "Internal server error" });
    }
  };
};

module.exports = catchError;
