test("env is available in test runtime", () => {
  process.env.TEST_KEY = "ok";
  expect(process.env.TEST_KEY).toBe("ok");
});


