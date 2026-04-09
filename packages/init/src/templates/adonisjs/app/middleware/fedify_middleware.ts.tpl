import { fedifyMiddleware } from "@fedify/adonisjs";
import federation from "#start/federation";
import "#start/logging";

export default fedifyMiddleware(federation, () => undefined);
