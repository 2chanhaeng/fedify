import { fedifyMiddleware } from "@fedify/nuxt";
import federation from "../utils/federation";

export default fedifyMiddleware(federation, (_event, _request) => undefined);
