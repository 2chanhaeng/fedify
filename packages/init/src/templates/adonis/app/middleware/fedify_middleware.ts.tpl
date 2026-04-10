import { fedifyMiddleware } from "@fedify/adonis";
import federation from "#start/federation";

export default fedifyMiddleware(federation, () => undefined);
