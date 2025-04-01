import { toNextJsHandler } from "better-auth/next-js";

/*import { auth as localAuth } from "@/lib/auth-local";
export const { GET, POST } = toNextJsHandler(localAuth.handler);*/

import { auth } from "@/lib/auth";
export const { GET, POST } = toNextJsHandler(auth.handler);