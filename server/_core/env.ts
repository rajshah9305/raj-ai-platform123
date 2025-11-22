export const ENV = {
  groqApiKey: process.env.GROQ_API_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
};