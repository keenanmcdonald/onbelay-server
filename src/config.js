module.exports = {
    PORT: process.env.PORT || 8000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost/onbelay',
    TEST_DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://localhost/onbelay_test',
    JWT_SECRET: process.env.JWT_SECRET || 'topropeordie',
    JWT_EXPIRY: process.env.JWT_EXPIRY || '30d',
    GRADES: ['5.0', '5.1', '5.2', '5.3', '5.4', '5.5', '5.6', '5.7', '5.8', '5.9', '5.10', '5.11-', '5.11+', '5.12-', '5.12+', '5.13-', '5.13+', '5.14-', '5.14+', '5.15'],
    STYLES: ['sport', 'trad']
}