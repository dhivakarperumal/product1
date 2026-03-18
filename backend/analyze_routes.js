const express = require('express');
const app = express();

// Mock all dependencies to avoid loading the whole app
const routes = [];

function listRoutes() {
    const fs = require('fs');
    const path = require('path');
    
    // Read server.js to see how routers are registered
    const serverPath = path.join(__dirname, 'src', 'server.js');
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // Find all app.use('/api/...', ...)
    const useRegex = /app\.use\(['"]\/api\/([^'"]+)['"]\s*,\s*([^)]+)\)/g;
    let match;
    const routers = {};
    
    while ((match = useRegex.exec(serverContent)) !== null) {
        const prefix = match[1];
        const routeVar = match[2];
        routers[routeVar] = prefix;
    }
    
    // Find where those routers are required
    const requireRegex = /const\s+([^\s=]+)\s*=\s*require\(['"]\.\/routes\/([^'"]+)['"]\)/g;
    const routerFiles = {};
    while ((match = requireRegex.exec(serverContent)) !== null) {
        const routeVar = match[1];
        const fileName = match[2];
        if (routers[routeVar]) {
            routerFiles[routers[routeVar]] = fileName;
        }
    }
    
    console.log('=== ROUTE ANALYSIS ===');
    for (const [prefix, file] of Object.entries(routerFiles)) {
        console.log(`\nPrefix: /api/${prefix} (from ${file}.js)`);
        const filePath = path.join(__dirname, 'src', 'routes', `${file}.js`);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            const getRegex = /router\.(get|post|put|patch|delete)\(['"]([^'"]+)['"]/g;
            let routeMatch;
            while ((routeMatch = getRegex.exec(content)) !== null) {
                console.log(`  ${routeMatch[1].toUpperCase().padEnd(6)} /api/${prefix}${routeMatch[2] === '/' ? '' : routeMatch[2]}`);
            }
        }
    }
}

listRoutes();
