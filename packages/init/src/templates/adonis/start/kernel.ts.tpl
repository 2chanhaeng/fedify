/*
|--------------------------------------------------------------------------
| HTTP kernel file
|--------------------------------------------------------------------------
|
| The HTTP kernel file is used to register the middleware with the server
| or the router.
|
*/

import router from "@adonisjs/core/services/router";
import server from "@adonisjs/core/services/server";

server.errorHandler(() => import("#exceptions/handler"));

server.use([
  () => import("#middleware/container_bindings_middleware"),
  () => import("#middleware/fedify_middleware"),
]);

router.use([() => import("@adonisjs/core/bodyparser_middleware")]);
