import { integrateFederation } from "@fedify/nuxt";
import federation from "../federation";

export default integrateFederation(federation, () => undefined);
