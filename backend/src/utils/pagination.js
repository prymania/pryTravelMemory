function getPagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function buildOrderBy(query, allowedFields, defaultField = 'created_at', defaultDir = 'DESC') {
  const field = allowedFields.includes(query.sort) ? query.sort : defaultField;
  const dir = query.dir?.toUpperCase() === 'ASC' ? 'ASC' : defaultDir;
  return `${field} ${dir}`;
}

module.exports = { getPagination, buildOrderBy };
