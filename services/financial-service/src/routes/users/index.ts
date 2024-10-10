import { App } from "@/hono/app";
import { registerV1CreateUser } from "./v1_create_user";
import { registerV1DeleteUser } from "./v1_delete_user";
import { registerV1GetUser } from "./v1_get_user";
import { registerV1UpdateUser } from "./v1_update_user";


export const registerUserRoutes = (app: App) => {
  registerV1CreateUser(app);
  registerV1GetUser(app);
  registerV1UpdateUser(app);
  registerV1DeleteUser(app);
};
