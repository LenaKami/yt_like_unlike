export const config = {
    port: process.env.PORT || 8080,
    databaseUrl: process.env.DATABASE_URL || 'mysql://user:pass@localhost/db',
    jwtSecret: process.env.JWT_SECRET || 'defaultsecret'
  };
  