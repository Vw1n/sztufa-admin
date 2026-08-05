const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.resolve(__dirname, '../build');
const MAIN_BUNDLE_MAX_BYTES = 350 * 1024; // 350 KiB
const TOTAL_JS_MAX_BYTES = 1.5 * 1024 * 1024; // 1.5 MiB

if (!fs.existsSync(BUILD_DIR)) {
  console.error(`❌ 构建产物目录不存在: ${BUILD_DIR}，请先运行 npm run build。`);
  process.exit(1);
}

const files = fs.readdirSync(BUILD_DIR);
const jsFiles = files.filter((file) => file.endsWith('.js'));

if (jsFiles.length === 0) {
  console.error(`❌ 构建产物目录中未找到任何 JS 文件: ${BUILD_DIR}`);
  process.exit(1);
}

let totalJsBytes = 0;
let mainBundleBytes = 0;
let mainBundleName = '';

jsFiles.forEach((file) => {
  const filePath = path.join(BUILD_DIR, file);
  const stat = fs.statSync(filePath);
  totalJsBytes += stat.size;

  if (file.startsWith('main.')) {
    mainBundleBytes = stat.size;
    mainBundleName = file;
  }
});

if (!mainBundleName || mainBundleBytes === 0) {
  console.error('❌ 门禁异常：构建产物中未定位到主入口 Bundle (main.*.js)。');
  process.exit(1);
}

const formatSize = (bytes) => `${(bytes / 1024).toFixed(2)} KiB`;

console.log('📊 性能包体积门禁检查:');
console.log(
  ` - 主入口 Bundle (${mainBundleName}): ${formatSize(mainBundleBytes)} / 上限 ${formatSize(
    MAIN_BUNDLE_MAX_BYTES,
  )}`,
);
console.log(
  ` - 所有 JS Bundle 总计: ${formatSize(totalJsBytes)} / 上限 ${formatSize(TOTAL_JS_MAX_BYTES)}`,
);

let hasError = false;

if (mainBundleBytes > MAIN_BUNDLE_MAX_BYTES) {
  console.error(
    `❌ 主入口 Bundle 超出性能预算限制 (${formatSize(mainBundleBytes)} > ${formatSize(
      MAIN_BUNDLE_MAX_BYTES,
    )})`,
  );
  hasError = true;
}

if (totalJsBytes > TOTAL_JS_MAX_BYTES) {
  console.error(
    `❌ 所有 JS Bundle 总计超出性能预算限制 (${formatSize(totalJsBytes)} > ${formatSize(
      TOTAL_JS_MAX_BYTES,
    )})`,
  );
  hasError = true;
}

if (hasError) {
  process.exit(1);
} else {
  console.log('✅ 包体积符合性能预算限制！');
}
