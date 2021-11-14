// const app = require("./app");
import express from "express";
import cors from "cors";
import connectDB from "./db/mongoose.js";
import swaggerUI from "swagger-ui-express";
import { specs } from "./utils/docs.js";

//import routers
import policyRoutes from "./routers/policy.routers.js";
import topicRoutes from "./routers/topic.routers.js";
import reportRoutes from "./routers/report.routers.js";
import testRoutes from "./routers/test.routers.js";
import authRoutes from "./routers/auth.routers.js";

const app = express();
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));
app.use(express.json({ limit: "50mb", extended: true }));
app.use(cors());

//connect DB
connectDB();

app.use("/policy", policyRoutes);
app.use("/topic", topicRoutes);
app.use("/report", reportRoutes);
app.use("/test", testRoutes);
app.use("/auth", authRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server API listening at http://localhost:${port}`);
});

app.get("/", function (req, res) {
  res.send("Active");
});
