import router from "@adonisjs/core/services/router";

router.get("/", async () => "It works!");

router.get("/users/:identifier", ({ params, response }) => {
  response.type("html");
  return `<p>Hello, ${params.identifier}!</p>`;
});
