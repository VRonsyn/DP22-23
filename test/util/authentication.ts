// eslint-disable-next-line node/no-unpublished-import
import supertest from "supertest";
import { app } from "../../src/application";
import { HttpHeader } from "../../src/util/consts";

// Valid, unregistered token with fake auth0 id "auth0|test"
export const TEST_ACCESS_TOKEN =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik1wbmRZVkVRaFAwX2hyM3JsSUNKXyJ9.eyJpc3MiOiJodHRwczovL2V4YW1wbGUuY29tLyIsInN1YiI6ImF1dGgwfHRlc3QiLCJhdWQiOiJhcy1wbGFubmVkL2VuZHBvaW50IiwiaWF0IjoxNjc4NTU1MTY3LCJleHAiOjIwOTk2NDE1NjcsImF6cCI6ImF6cF90ZXN0IiwiZ3R5IjoicGFzc3dvcmQifQ.oXtXhja1l3hqyAd3QetKKmwqKnvC8HWKHpZnZCyv6WTtBiW0tXm0qUhwPlL-RIIbJ82jv1FJM1GYVUWYIOiO3zZeTyp3OasoeYMvqD76FL7znk7qvYuGOJoFwBQcrX8RFu3vV0V5SycxOZ3l4GPnoh6zg5GgS-IbvrmavYm7Kt-t4z5FWNpLcDjUtznOBHz7lsNkRSJL5eGLuN2Lc5HOOUu-oTM3hNk8cWMWb6CQKkKqgVrpblJlmryqm6RFozMv13TGFfXuJ-6Q-iBn9_S8IcWqClzLmROta9LSf7SCZoTeZ-A4Oq5jbQvd6pVii9_V9njqqkVpvT0oxO4rvf3jJw";
export const TEST_AUTH0_ID = "auth0|test";

/**
 * Helper function to make an authenticated GET request.
 * @param url - URL to send the request to
 */
export function authGet(url: string) {
  return supertest(app)
    .get(url)
    .set(HttpHeader.auth, `Bearer ${TEST_ACCESS_TOKEN}`);
}

/**
 * Helper function to make an authenticated PUT request.
 * @param url - URL to send the request to
 * @param body - Body of the request
 */
export function _authPut(url: string, body: object) {
  //TODO: remove underscore
  return supertest(app)
    .put(url)
    .set(HttpHeader.auth, `Bearer ${TEST_ACCESS_TOKEN}`)
    .send(body);
}

/**
 * Helper function to make an authenticated POST request.
 * @param url - URL to send the request to
 * @param body - Body of the request
 */
export function authPost(url: string, body: object) {
  return supertest(app)
    .post(url)
    .set(HttpHeader.auth, `Bearer ${TEST_ACCESS_TOKEN}`)
    .send(body);
}

/**
 * Helper function to make an authenticated PATCH request.
 * @param url - URL to send the request to
 * @param body - Body of the request
 */
export function authPatch(url: string, body: object) {
  return supertest(app)
    .patch(url)
    .set(HttpHeader.auth, `Bearer ${TEST_ACCESS_TOKEN}`)
    .send(body);
}

/**
 * Helper function to make an authenticated DELETE request.
 * @param url - URL to send the request to
 */
export function authDelete(url: string) {
  return supertest(app)
    .delete(url)
    .set(HttpHeader.auth, `Bearer ${TEST_ACCESS_TOKEN}`);
}
