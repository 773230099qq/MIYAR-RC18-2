const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "12h";

if (!JWT_SECRET && require.main === module) {
  console.error("JWT_SECRET environment variable is required");
  process.exit(1);
}

const fallbackSecret = JWT_SECRET || "test-only-secret";

module.exports = {
  JWT_SECRET: fallbackSecret,
  JWT_EXPIRES_IN,
  PORT: parseInt(process.env.PORT || "3000", 10),
  DATABASE_URL: process.env.DATABASE_URL || "postgres://miyar:miyar@localhost:5432/miyar",
};
