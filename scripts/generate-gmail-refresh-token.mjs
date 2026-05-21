import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const rl = createInterface({ input, output });
const redirectUri = "http://localhost";
const scope = "https://www.googleapis.com/auth/gmail.send";

const clientId =
  process.env.GMAIL_CLIENT_ID ||
  (await rl.question("Paste OAuth Desktop Client ID: "));

const clientSecret =
  process.env.GMAIL_CLIENT_SECRET ||
  (await rl.question("Paste OAuth Desktop Client Secret: "));

const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", clientId.trim());
authUrl.searchParams.set("redirect_uri", redirectUri);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", scope);
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent");

console.log("\nOpen this URL and sign in as info@magiclandfunpark.com:\n");
console.log(authUrl.toString());
console.log(
  "\nAfter approving, Google will redirect to a localhost URL. Copy the full code= value from that URL.",
);

const pastedCode = await rl.question("\nPaste authorization code or full localhost URL: ");
rl.close();

function extractCode(value) {
  const trimmed = value.trim();
  if (!trimmed.includes("code=")) {
    return trimmed;
  }

  const parsed = new URL(trimmed);
  return parsed.searchParams.get("code") || trimmed;
}

const code = extractCode(pastedCode);

const response = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    code: code.trim(),
    client_id: clientId.trim(),
    client_secret: clientSecret.trim(),
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  }),
});

const token = await response.json();

if (!response.ok) {
  console.error("\nGoogle token exchange failed:\n", token);
  process.exit(1);
}

console.log("\nRefresh token generated successfully.\n");
console.log("GMAIL_REFRESH_TOKEN=");
console.log(token.refresh_token);
console.log("\nStore these Firebase secrets:\n");
console.log("firebase functions:secrets:set GMAIL_CLIENT_ID --project magic-land-fun-park");
console.log("firebase functions:secrets:set GMAIL_CLIENT_SECRET --project magic-land-fun-park");
console.log("firebase functions:secrets:set GMAIL_REFRESH_TOKEN --project magic-land-fun-park");
console.log("firebase functions:secrets:set GMAIL_SENDER_EMAIL --project magic-land-fun-park");
