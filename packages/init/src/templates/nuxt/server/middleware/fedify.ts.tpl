import federation from "../utils/federation";
import { fedifyHandler } from "@fedify/nuxt";

export default fedifyHandler(federation, () => undefined);
