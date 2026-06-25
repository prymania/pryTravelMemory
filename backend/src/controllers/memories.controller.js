const memoryModel = require('../models/memory.model');
const tagModel    = require('../models/tag.model');
const { success, paginated, created } = require('../utils/response');
const { getPagination } = require('../utils/pagination');
const { AppError } = require('../middleware/error');

async function list(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { rows, total } = await memoryModel.getAll(req.user.id, {
      limit, offset,
      search:      req.query.q,
      mood:        req.query.mood,
      is_favorite: req.query.is_favorite,
      visibility:  req.query.visibility,
      trip_id:     req.query.trip_id,
      place_id:    req.query.place_id,
    });
    paginated(res, rows, total, page, limit);
  } catch (e) { next(e); }
}

async function listByPlace(req, res, next) {
  try {
    const memories = await memoryModel.getByPlace(req.params.placeId, req.user.id);
    success(res, memories);
  } catch (e) { next(e); }
}

async function get(req, res, next) {
  try {
    const memory = await memoryModel.getById(req.params.id, req.user.id);
    if (!memory) throw new AppError('Memory not found', 404);
    success(res, memory);
  } catch (e) { next(e); }
}

async function create(req, res, next) {
  try {
    const memory = await memoryModel.create(req.user.id, req.body);
    if (req.body.tags?.length) await tagModel.setMemoryTags(memory.id, req.body.tags);
    created(res, memory);
  } catch (e) { next(e); }
}

async function update(req, res, next) {
  try {
    const memory = await memoryModel.update(req.params.id, req.user.id, req.body);
    if (!memory) throw new AppError('Memory not found', 404);
    if (req.body.tags !== undefined) await tagModel.setMemoryTags(memory.id, req.body.tags || []);
    success(res, memory);
  } catch (e) { next(e); }
}

async function remove(req, res, next) {
  try {
    const memory = await memoryModel.softDelete(req.params.id, req.user.id);
    if (!memory) throw new AppError('Memory not found', 404);
    success(res, null, 'Memory deleted');
  } catch (e) { next(e); }
}

async function versions(req, res, next) {
  try {
    const data = await memoryModel.getVersions(req.params.id, req.user.id);
    success(res, data);
  } catch (e) { next(e); }
}

async function onThisDay(req, res, next) {
  try {
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const day   = parseInt(req.query.day)   || now.getDate();
    const memories = await memoryModel.getOnThisDay(req.user.id, month, day);
    success(res, memories);
  } catch (e) { next(e); }
}

module.exports = { list, listByPlace, get, create, update, remove, versions, onThisDay };
