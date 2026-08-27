function normalizeList(rawList = "") {
  return String(rawList)
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowed(email, rawList = "", restrictedFlag = "") {
  const restricted = String(restrictedFlag).trim().toLowerCase() === "true";
  if (!restricted) return true;

  const allowed = normalizeList(rawList);
  if (!allowed.length) return false;

  return allowed.includes(String(email || "").trim().toLowerCase());
}
