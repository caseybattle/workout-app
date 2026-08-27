const required = [
  "AUTH_SECRET",
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
  "DATABASE_URL",
  "NEXTAUTH_URL",
  "OPENAI_API_KEY",
];

const missing = [];

for (const name of required) {
  const configured = Boolean(process.env[name]?.trim());
  console.log(`${name}: ${configured ? "SET" : "MISSING"}`);
  if (!configured) missing.push(name);
}

if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exitCode = 1;
}
