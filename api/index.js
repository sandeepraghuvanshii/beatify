// api/index.js
import server from "../server.js";
import serverless from "serverless-http";

const handler = serverless(server);
export default async function (req, res) {
  return handler(req, res);
}
