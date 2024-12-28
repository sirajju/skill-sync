const { getPrismaClient } = require("../config/prisma");
const jwt = require("jsonwebtoken");

const Prisma = getPrismaClient();

module.exports = async (req, res, next) => {
  try {
    const token = req.headers["authorization"];
    if (!token) return res.json({ message: "Invalid token" });
    const bearer = token.split("Bearer ").pop();
    const { Department } = jwt.verify(bearer, process.env.JWT_SECRET);
    const organizationData = await Prisma.organization.findUnique({
      where: {
        id: Department.orgId,
      },
    });
    if (organizationData) {
      req.auth = {
        orgId: organizationData.id,
      };
      return next();
    }
    res.status(400).json({ message: "Session ended" });
  } catch (error) {
    console.log(error);
    res.status(403).json({ message: "Err access denied.." });
  }
};
