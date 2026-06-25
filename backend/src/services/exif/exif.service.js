async function extract(filePath) {
  try {
    // exifr is an ES module — use dynamic import
    const exifrModule = await import('exifr');
    const exifr = exifrModule.default || exifrModule;
    const data = await exifr.parse(filePath, {
      tiff: true, gps: true, exif: true, iptc: false,
      reviveValues: true, translateKeys: true, translateValues: true,
    });
    return data || {};
  } catch (err) {
    // Non-fatal: return empty if EXIF fails
    console.warn('EXIF extraction skipped:', err.message);
    return {};
  }
}

module.exports = { extract };
