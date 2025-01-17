const dotenv = require("dotenv");
dotenv.config();
const { connect } = require("./config/prisma");
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const { connect: initRabbitMq } = require("./config/rabbitmq");
const { create, clear } = require("./temp/demo");
const cors = require("cors");
create();

const organizationRouter = require("./routes/organization");
const roleRouter = require("./routes/role");
const employeeRouter = require("./routes/employee");
const departmentRouter = require("./routes/department");
const managerRouter = require("./routes/manager");
const assesmentsRouter = require("./routes/assesments");
const jiraRouter = require("./routes/jira");
const buddyRouter = require("./routes/buddy");

const { onTrigger } = require("./webhook/events");
const { generate } = require("./config/gemini");
const expressListRoutes = require("express-list-routes");

const app = express();
connect();

// initRabbitMq();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

console.clear();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/organization", organizationRouter);
app.use("/role", roleRouter);
app.use("/employee", employeeRouter);
app.use("/department", departmentRouter);
app.use("/manager", managerRouter);
app.use("/assesment", assesmentsRouter);
app.use("/jira", jiraRouter);
app.use("/buddy", buddyRouter);

app.use("/webhook/*", onTrigger);

app.use("*", (req, res) => {
  let routes = expressListRoutes(app, { logger: false });
  if (routes.length)
    routes = routes.map((route) => {
      return `${route.method.toUpperCase()} : ${route.path.replaceAll(
        "\\",
        "/"
      )}`;
    });
  res.status(200).json({ message: "Server is working , Nothing here", routes });
});

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
