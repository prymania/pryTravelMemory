const diaryModel = require('../models/diary.model');
const { success, paginated, created } = require('../utils/response');
const { getPagination } = require('../utils/pagination');
const { AppError } = require('../middleware/error');

async function list(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { rows, total } = await diaryModel.getAll(req.user.id, {
      limit, offset,
      search: req.query.q,
      mood:   req.query.mood,
    });
    paginated(res, rows, total, page, limit);
  } catch (e) { next(e); }
}

async function get(req, res, next) {
  try {
    const entry = await diaryModel.getById(req.params.id, req.user.id);
    if (!entry) throw new AppError('Diary entry not found', 404);
    success(res, entry);
  } catch (e) { next(e); }
}

async function create(req, res, next) {
  try {
    const entry = await diaryModel.create(req.user.id, req.body);
    created(res, entry);
  } catch (e) { next(e); }
}

async function update(req, res, next) {
  try {
    const entry = await diaryModel.update(req.params.id, req.user.id, req.body);
    if (!entry) throw new AppError('Diary entry not found', 404);
    success(res, entry);
  } catch (e) { next(e); }
}

async function remove(req, res, next) {
  try {
    const entry = await diaryModel.softDelete(req.params.id, req.user.id);
    if (!entry) throw new AppError('Diary entry not found', 404);
    success(res, null, 'Entry deleted');
  } catch (e) { next(e); }
}

module.exports = { list, get, create, update, remove };
