const db = require('./src/config/db');
async function run() {
    try {
        const [users] = await db.query('SELECT id, username FROM users WHERE username = "thenuga"');
        if (users.length === 0) {
            console.log('User thenuga not found');
            return;
        }
        const userId = users[0].id;
        console.log('User ID:', userId);

        // Get staff id for this trainer
        const [staff] = await db.query(
            "SELECT s.id FROM staff s JOIN users u ON (s.email = u.email OR s.username = u.username) WHERE u.id = ?",
            [userId]
        );
        if (staff.length === 0) {
            console.log('Staff entry not found');
            return;
        }
        const staffId = staff[0].id;
        console.log('Staff ID:', staffId);

        // Get assignments
        const [assignments] = await db.query(
            "SELECT count(*) as count FROM trainer_assignments WHERE trainer_id = ?",
            [staffId]
        );
        console.log('Assignments count:', assignments[0].count);
        
        // Let's also check all assignments
        const [allAssign] = await db.query("SELECT * FROM trainer_assignments WHERE trainer_id = ?", [staffId]);
        console.log('All assignments:', allAssign);

    } catch (e) {
        console.error(e);
    }
}
run().then(() => process.exit());
