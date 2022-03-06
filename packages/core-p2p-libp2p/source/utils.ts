import { TextDecoder } from "util";

import { IMessage } from "./contracts";

export const decodeMessage = <T>(message: IMessage): T => JSON.parse(new TextDecoder().decode(message.data));
