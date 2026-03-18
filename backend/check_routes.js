const express = require('express');
const app = require('./src/server');

const routes = [];

function print(path, layer) {
  if (layer.route) {
    layer.route.stack.forEach(print.bind(null, path + (layer.route.path || '')));
  } else if (layer.name === 'router' && layer.handle.stack) {
    layer.handle.stack.forEach(print.bind(null, path + (layer.regexp.source.replace('\\/?(?=\\/|$)', '').replace('^\\/', '').replace('\\/', '/'))));
  } else if (layer.method) {
    routes.push(`${layer.method.toUpperCase()} ${path}`);
  }
}

app._router.stack.forEach(print.bind(null, ''));

console.log('=== REGISTERED ROUTES ===');
routes.sort().forEach(r => console.log(r));
console.log('=========================');
process.exit(0);
