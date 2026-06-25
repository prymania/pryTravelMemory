function success(res, data, message = 'Success', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

function created(res, data, message = 'Created') {
  return success(res, data, message, 201);
}

function paginated(res, data, total, page, limit) {
  return res.json({
    success: true,
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
}

module.exports = { success, created, paginated };
