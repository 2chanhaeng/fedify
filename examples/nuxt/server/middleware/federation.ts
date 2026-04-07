import { fedifyMiddleware } from "@fedify/nuxt";
import federation from "../lib/federation";

export default fedifyMiddleware(federation, (_event) => undefined);
