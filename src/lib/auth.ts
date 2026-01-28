import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer, magicLink } from "better-auth/plugins";
import { NextRequest } from 'next/server';
import { headers } from "next/headers";
import { db } from "@/db";
import * as schema from "@/db/schema";
import crypto from "crypto";
import { verifyPassword, makeSignature } from "better-auth/crypto";
import { sendWelcomeEmail, sendMagicLinkEmail, sendOwnerSignupNotification } from "@/lib/email";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite",
		schema: {
			user: schema.user,
			session: schema.session,
			account: schema.account,
			verification: schema.verification,
		}
	}),
	secret: process.env.BETTER_AUTH_SECRET,
	baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined),
	trustedOrigins: [
		"https://www.groupescapehouses.co.uk",
		"https://groupescapehouses.co.uk",
		"https://orchids-escape-houses.vercel.app",
		"http://localhost:3000",
		"http://127.0.0.1:3000",
		"http://192.168.1.232:3000",
		"http://192.168.0.171:3000",
		"http://192.168.1.80:3000",
		"https://appleid.apple.com",
		...(process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",").map(o => o.trim()) || [])
	],
	socialProviders: {
		...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? {
			google: {
				clientId: process.env.GOOGLE_CLIENT_ID,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET,
				prompt: "select_account",
			}
		} : {}),
		...(process.env.APPLE_CLIENT_ID && (process.env.APPLE_CLIENT_SECRET || (process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY)) ? {
			apple: {
				clientId: process.env.APPLE_CLIENT_ID as string,
				clientSecret: process.env.APPLE_CLIENT_SECRET || {
					teamId: process.env.APPLE_TEAM_ID as string,
					keyId: process.env.APPLE_KEY_ID as string,
					privateKey: process.env.APPLE_PRIVATE_KEY as string,
				},
			}
		} : {}),
	} as any,
	session: {
		expiresIn: 60 * 60 * 24 * 30,
		updateAge: 60 * 60 * 24,
		cookieCache: {
			enabled: true,
			maxAge: 60 * 5,
		},
	},
	advanced: {
		trustHost: true,
		useSecureCookies: process.env.NODE_ENV === "production",
		cookieOptions: {
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
		}
	},
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					try {
						await sendWelcomeEmail(user.email, user.name);
					} catch (error) {
						console.error("Failed to send welcome email:", error);
					}
					
					if ((user as any).role === "owner") {
						try {
							await sendOwnerSignupNotification({
								name: user.name || "",
								email: user.email,
								phone: (user as any).phoneNumber ? String((user as any).phoneNumber) : undefined,
								propertyName: (user as any).propertyName ? String((user as any).propertyName) : undefined,
								propertyWebsite: (user as any).propertyWebsite ? String((user as any).propertyWebsite) : undefined,
								planId: (user as any).planId ? String((user as any).planId) : undefined,
							});
						} catch (error) {
							console.error("Failed to send owner signup notification:", error);
						}
					}
				}
			}
		}
	},
	emailAndPassword: {
		enabled: true,
		password: {
			verify: async ({ password, hash }) => {
				console.log("[Auth Debug] Verifying password for hash:", hash.substring(0, 10) + "...");
				// 1. Check if the hash looks like the legacy MD5 format (32 hex characters)
				if (hash.length === 32 && /^[0-9a-f]+$/.test(hash)) {
					const md5Hash = crypto.createHash("md5").update(password).digest("hex");
					const match = md5Hash === hash;
					console.log("[Auth Debug] MD5 comparison:", match ? "Match" : "No match");
					return match;
				}

				// 2. Try standard scrypt verification WITH HMAC (if secret is present)
				const secret = process.env.BETTER_AUTH_SECRET;
				if (secret) {
					try {
						const passwordToVerify = await makeSignature(password, secret);
						const isValid = await verifyPassword({ password: passwordToVerify, hash });
						if (isValid) {
							console.log("[Auth Debug] Scrypt with HMAC: Match");
							return true;
						}
					} catch (e) {
						console.error("[Auth Debug] Scrypt with HMAC error:", e);
					}
				}

				// 3. Try standard scrypt verification WITHOUT HMAC
				try {
					const isValid = await verifyPassword({ password, hash });
					console.log("[Auth Debug] Scrypt without HMAC:", isValid ? "Match" : "No match");
					return isValid;
				} catch (e) {
					console.error("[Auth Debug] Scrypt without HMAC error:", e);
					return false;
				}
			}
		}
	},
	user: {
		additionalFields: {
			role: {
				type: "string",
				defaultValue: "guest",
			},
			phoneNumber: {
				type: "string",
				required: false,
			},
			propertyName: {
				type: "string",
				required: false,
			},
			propertyWebsite: {
				type: "string",
				required: false,
			},
			planId: {
				type: "string",
				required: false,
			},
			paymentStatus: {
				type: "string",
				defaultValue: "pending",
			}
		}
	},
	plugins: [
		bearer(),
		magicLink({
			sendMagicLink: async ({ email, url }) => {
				await sendMagicLinkEmail(email, url);
			},
		})
	]
});


// Session validation helper
export async function getCurrentUser(request: NextRequest) {
	const session = await auth.api.getSession({ headers: await headers() });
	return session?.user || null;
}
