const fs = require('fs');
const path = require('path');

// simple CLI to scaffold a new migration file
const migrationsDir = path.join(__dirname, 'migrations');
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

const args = process.argv.slice(2);
let name = 'new_migration';
for (const arg of args) {
  if (arg.startsWith('--name=')) {
    name = arg.split('=')[1];
  }
}

const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0,14);
const filename = `${timestamp}_${name}.sql`;
const filepath = path.join(migrationsDir, filename);

fs.writeFileSync(filepath, `-- migration ${filename}\n\n`);
console.log('Created migration:', filepath);
