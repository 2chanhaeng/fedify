import { createContextData, federation } from "#fedify/nuxt-config.mjs";
import { integrateFederation } from "@fedify/h3";

export default integrateFederation(federation, createContextData);
