/**
 * Request auth — verifyRequest() checks the Firebase ID token.
 *
 * Reads `Authorization: Bearer <idToken>`, verifies via Admin SDK
 * (`verifyIdToken`), and returns the trusted identity. The verified uid is the
 * source of identity — never trust a userId from the body (CONVENTIONS §7).
 *
 * TODO: implement verifyRequest(req). Verify verifyIdToken signature against the
 * installed `firebase-admin` version before use (AGENTS §4).
 */

export {};
