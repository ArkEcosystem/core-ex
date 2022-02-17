import { Ajv } from "ajv";

import { ConfigManager } from "../config";
import { maxVendorFieldLength } from "../utils";

export const createFormats = (configManager: ConfigManager) => {
    const vendorField = (ajv: Ajv) => {
        ajv.addFormat("vendorField", (data) => {
            try {
                return Buffer.from(data, "utf8").length <= maxVendorFieldLength(configManager);
            } catch {
                return false;
            }
        });
    };

    return [vendorField];
};
