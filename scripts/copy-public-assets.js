const fs = require('fs');
const path = require('path');

const publicDir = path.resolve(__dirname, '..', 'public');
const buildDir = path.resolve(__dirname, '..', 'build');

for (const name of ['automation-report.html']) {
  const source = path.join(publicDir, name);
  if (!fs.existsSync(source)) continue;
  fs.copyFileSync(source, path.join(buildDir, name));
  console.log(`已复制静态资源：${name}`);
}
