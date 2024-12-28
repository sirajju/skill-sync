const { connect } = require("./config/prisma");
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const organizationRouter = require("./routes/organization");
const roleRouter = require("./routes/role");
const employeeRouter = require("./routes/employee");
const departmentRouter = require("./routes/department");
const managerRouter = require("./routes/manager");

const app = express();

connect();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/organization", organizationRouter);
app.use("/role", roleRouter);
app.use("/employee", employeeRouter);
app.use("/department", departmentRouter);
app.use("/manager", managerRouter);

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.status(err.status || 500).json({ message: err.message });
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`SERVER IS LISTENING : http://localhost:${PORT}`);
});

module.exports = app;
