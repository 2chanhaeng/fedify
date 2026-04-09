router.get("/users/:identifier", ({ params, response }) => {
  response.type("html");
  return `<p>Hello, ${params.identifier}!</p>`;
});
