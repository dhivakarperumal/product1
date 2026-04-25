const db = require('./src/config/db');

const migrationsToMark = [
  '0034_add_member_weight_to_diet_plans.sql',
  '0035_add_google_auth_to_users.sql',
  '0036_add_admin_id_to_users_products.sql',
  '0039_create_auth_tables.sql',
  '0040_add_login_fields_to_members.sql',
  '0041_add_created_updated_by_to_gym_members.sql',
  '0041_drop_member_auth_columns_from_members.sql',
  '0042_add_admin_id_to_workouts_diets.sql',
  '0043_change_created_updated_by_to_uuid.sql',
  '0044_rename_gym_members_to_members.sql',
  '0045_add_created_updated_by_to_products_remove_admin_fields.sql',
  '0046_add_created_updated_by_to_enquiries.sql',
  '0047_add_audit_fields_to_remaining_tables.sql',
  '0048_add_health_metrics_to_enquiries.sql',
  '0049_make_member_contact_unique_per_admin.sql',
  '0050_make_enquiry_contact_unique_per_admin.sql',
  '0051_add_created_updated_by_to_memberships.sql',
  '0052_change_member_id_to_uuid.sql',
  '0052_fix_gym_plans_audit_uuid.sql',
  '0053_add_memberid_to_memberships.sql',
  '0053_change_plan_id_to_uuid.sql',
  '0054_add_admin_fields_to_staff.sql',
  '0055_remove_staff_fk_constraints.sql',
  '0056_change_employee_id_to_uuid.sql',
  '0057_update_memberships_member_link.sql',
  '0058_add_plan_id_to_memberships.sql',
  '0059_add_billing_to_orders.sql',
  '0060_add_admin_isolation_to_orders_memberships.sql',
  '0060_add_member_uuid_to_orders.sql',
  '0061_fix_orders_nullable_user_id.sql',
  '0062_add_password_to_staff.sql',
  '0064_add_user_id_to_gym_members.sql'
];

(async () => {
  try {
    console.log('Checking current migrations...');
    const [existing] = await db.query('SELECT filename FROM schema_migrations ORDER BY filename');
    console.log('Current migrations:', existing.map(m => m.filename));

    console.log('\nMarking migrations as applied...');
    for (const migration of migrationsToMark) {
      const [rows] = await db.query('SELECT * FROM schema_migrations WHERE filename = ?', [migration]);
      if (rows.length === 0) {
        await db.query('INSERT INTO schema_migrations (filename) VALUES (?)', [migration]);
        console.log(`✓ Marked ${migration}`);
      } else {
        console.log(`• Already marked: ${migration}`);
      }
    }

    console.log('\nDone!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
