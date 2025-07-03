import { integrateFederation } from "@fedify/express";
import express from "express";
import { federation } from "./federation.ts";

export const app = express();

app.set("trust proxy", true);

app.use(integrateFederation(federation, () => undefined));

app.get("/users/:handle", (req, res) => {
  res.type("html").send(`<p>Hello, ${req.params.handle}!</p>`);
});

app.listen(3000, () => {
  console.log("Listening on http://localhost:3000");
});
