import federation from "#start/federation";
import "#start/logging";
import { fedifyMiddleware } from "@fedify/adonisjs";

export default fedifyMiddleware(federation, () => undefined);
