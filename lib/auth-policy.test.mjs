import assert from "node:assert/strict";
import { isEmailAllowed } from "./auth-policy.js";

console.log("=== AUTH ACCESS POLICY ===");
assert.equal(isEmailAllowed("owner@example.com", "owner@example.com", ""), true, "Open mode should allow the owner");
assert.equal(isEmailAllowed("coworker@example.com", "owner@example.com", ""), true, "Open mode should allow other Google users even when ALLOWED_EMAILS is populated");
assert.equal(isEmailAllowed("owner@example.com", "owner@example.com", "true"), true, "Restricted mode should allow listed users");
assert.equal(isEmailAllowed("coworker@example.com", "owner@example.com", "true"), false, "Restricted mode should reject unlisted users");
assert.equal(isEmailAllowed("USER@EXAMPLE.COM", " user@example.com ", "true"), true, "Restricted matching should be case-insensitive and trimmed");
console.log("auth policy tests passed");
