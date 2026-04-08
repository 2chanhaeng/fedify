import { fedifyMiddleware } from "@fedify/nuxt";
import federation from "../federation";

export default fedifyMiddleware(
  federation,
  (event, request) => undefined,
);
