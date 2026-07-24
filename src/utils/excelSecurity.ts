export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_SHEETS = 10;
export const MAX_ROWS = 1000;
export const MAX_COLS = 50;
export const MAX_ARCHIVE_ENTRIES = 1000;
export const MAX_UNCOMPRESSED_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_COMPRESSION_RATIO = 100;

export interface ExcelValidationError {
  valid: boolean;
  error?: string;
}

export function validateExcelFile(file: { name: string; size: number }): ExcelValidationError {
  if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
    return { valid: false, error: '请上传 Excel 文件（.xlsx 或 .xls 格式）' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: '文件大小超过限制（单文件最大支持 10MB）' };
  }
  return { valid: true };
}

export function validateExcelArchive(
  data: Uint8Array,
  fileName: string,
): ExcelValidationError {
  if (!fileName.toLowerCase().endsWith('.xlsx')) {
    return { valid: true };
  }

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const minimumEocdSize = 22;
  const maximumCommentSize = 0xffff;
  const searchStart = Math.max(0, data.byteLength - minimumEocdSize - maximumCommentSize);
  let eocdOffset = -1;

  for (let offset = data.byteLength - minimumEocdSize; offset >= searchStart; offset--) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      eocdOffset = offset;
      break;
    }
  }

  if (eocdOffset < 0) {
    return { valid: false, error: '无效的 .xlsx 文件结构' };
  }

  const entryCount = view.getUint16(eocdOffset + 10, true);
  const centralDirectorySize = view.getUint32(eocdOffset + 12, true);
  const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);

  if (
    entryCount > MAX_ARCHIVE_ENTRIES ||
    centralDirectoryOffset + centralDirectorySize > data.byteLength
  ) {
    return { valid: false, error: 'Excel 压缩包结构异常或文件条目过多' };
  }

  let offset = centralDirectoryOffset;
  let totalCompressedSize = 0;
  let totalUncompressedSize = 0;

  for (let index = 0; index < entryCount; index++) {
    if (offset + 46 > data.byteLength || view.getUint32(offset, true) !== 0x02014b50) {
      return { valid: false, error: 'Excel 压缩包目录损坏' };
    }

    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const fileNameLength = view.getUint16(offset + 28, true);
    const extraFieldLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);

    totalCompressedSize += compressedSize;
    totalUncompressedSize += uncompressedSize;

    if (
      totalUncompressedSize > MAX_UNCOMPRESSED_SIZE ||
      (totalCompressedSize > 0 &&
        totalUncompressedSize / totalCompressedSize > MAX_COMPRESSION_RATIO)
    ) {
      return { valid: false, error: 'Excel 文件解压后体积异常，已拒绝解析' };
    }

    offset += 46 + fileNameLength + extraFieldLength + commentLength;
  }

  return { valid: true };
}

export function validateWorksheetData(
  sheetNames: string[],
  jsonData: Record<string, any>[],
): ExcelValidationError {
  if (!sheetNames || sheetNames.length === 0) {
    return { valid: false, error: '文件不包含有效工作表' };
  }
  if (sheetNames.length > MAX_SHEETS) {
    return { valid: false, error: `Excel 文件工作表过多（最多允许 ${MAX_SHEETS} 个工作表）` };
  }
  if (jsonData.length > MAX_ROWS) {
    return { valid: false, error: `Excel 数据行数超过限制（最多允许 ${MAX_ROWS} 行数据）` };
  }
  if (jsonData.length > 0) {
    const colCount = Object.keys(jsonData[0] || {}).length;
    if (colCount > MAX_COLS) {
      return { valid: false, error: `Excel 列数过多（最多允许 ${MAX_COLS} 列）` };
    }
  }
  return { valid: true };
}

export function parsePlayerRows(jsonData: Record<string, any>[]) {
  const players = jsonData.map((row) => {
    const rawName = row['姓名'] ?? row['name'] ?? '';
    const rawStudentId = row['学号'] ?? row['studentId'] ?? row['student_id'] ?? '';
    const rawJerseyNumber =
      row['球衣号码'] !== undefined && row['球衣号码'] !== null
        ? row['球衣号码']
        : row['jerseyNumber'] !== undefined && row['jerseyNumber'] !== null
          ? row['jerseyNumber']
          : row['jersey_number'] !== undefined && row['jersey_number'] !== null
            ? row['jersey_number']
            : '';

    return {
      name: String(rawName).trim(),
      studentId: String(rawStudentId).trim(),
      jerseyNumber: String(rawJerseyNumber).trim(),
      photo: null,
      teamId: '',
    };
  });

  return players.filter((p) => p.name && p.studentId && p.jerseyNumber !== '');
}
