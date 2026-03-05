// Database configuration file
// Add your database connection details here

module.exports = {
    // Example database config
    development: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'website_db',
        user: process.env.DB_USER || 'user',
        password: process.env.DB_PASSWORD || 'password'
    }
};
