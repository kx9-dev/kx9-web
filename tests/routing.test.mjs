import {test} from "node:test";
import assert from "node:assert/strict";
import {hostnameFromHeaders, resolveSiteFile} from "../scripts/routing.mjs";

test("landing and app use separate root documents", () => {
  assert.equal(resolveSiteFile("/site", "kx9.tech", "/"), "/site/index.html");
  assert.equal(resolveSiteFile("/site", "app.kx9.tech", "/"), "/site/app/index.html");
  assert.equal(resolveSiteFile("/site", "preview.example.test", "/"), "/site/index.html");
});
test("app assets and legacy preview routes resolve correctly", () => {
  assert.equal(resolveSiteFile("/site", "preview.example.test", "/app"), "/site/app/index.html");
  assert.equal(resolveSiteFile("/site", "kx9.tech", "/app?source=launch"), "/site/app/index.html");
  assert.equal(resolveSiteFile("/site", "app.kx9.tech", "/app"), "/site/app/index.html");
  assert.equal(resolveSiteFile("/site", "app.kx9.tech", "/robot.js"), "/site/app/robot.js");
  assert.equal(resolveSiteFile("/site", "app.kx9.tech", "/app/"), "/site/app/index.html");
  assert.equal(resolveSiteFile("/site", "kx9.tech", "/app/"), "/site/app/index.html");
  assert.equal(resolveSiteFile("/site", "kx9.tech", "/docs.html"), "/site/docs.html");
});
test("proxy host parsing uses exact hostname matching", () => {
  assert.equal(hostnameFromHeaders({host: "APP.KX9.TECH:443"}), "app.kx9.tech");
  assert.equal(hostnameFromHeaders({host: "localhost", "x-forwarded-host": "app.kx9.tech, proxy"}), "app.kx9.tech");
  assert.equal(resolveSiteFile("/site", "app.kx9.tech.evil.com", "/"), "/site/index.html");
});
test("private files and encoded traversal cannot escape document roots", () => {
  for (const url of ["/.env", "/%2e%2e%2fsecret", "/%00", "/a%5cb"]) {
    assert.equal(resolveSiteFile("/site", "app.kx9.tech", url), null);
  }
  assert.throws(() => resolveSiteFile("/site", "app.kx9.tech", "/%zz"), URIError);
});
