
import crypto from "crypto";

const testPassword = "password123"; // A common test password
const testHash = crypto.createHash("md5").update(testPassword).digest("hex");

console.log("Test Password:", testPassword);
console.log("Test Hash:", testHash);

function verify(password: string, hash: string) {
    if (hash.length === 32 && /^[0-9a-f]+$/.test(hash)) {
        const md5Hash = crypto.createHash("md5").update(password).digest("hex");
        return md5Hash === hash;
    }
    return false;
}

console.log("Verification result:", verify(testPassword, testHash));
