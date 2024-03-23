const pool = require('./database');
const { usersTableSchema, refreshTokensTableSchema } = require('./dbSchemas');

const runMigrations = async () => {
    try {
        await pool.query(usersTableSchema);
        console.log("Users table migration completed successfully.");
        
        await pool.query(refreshTokensTableSchema);
        console.log("Refresh tokens table migration completed successfully.");

        console.log("All database migrations completed successfully.");
    } catch (error) {
        console.error('Failed to complete migrations:', error);
        throw error; 
    }
};

if (require.main === module) {
    runMigrations().catch(error => {
        console.error("Migration script encountered an error:", error);
        process.exit(1); 
    });
}

module.exports = { runMigrations };
