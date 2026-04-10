import router from "@adonisjs/core/services/router";

router.get("/", async () => {
  return "Hello, Fedify!";
});

router.get("/users/:identifier", async ({ params }) => {
  return `<p>Hello, ${params.identifier}!</p>`;
});
