module.exports = {
    PORT: process.env.PORT || 8000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost/on_belay',
    JWT_SECRET: process.env.JWT_SECRET || 'topropeordie',
    JWT_EXPIRY: process.env.JWT_EXPIRY || '30d',
}