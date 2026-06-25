const tripModel = require('../models/trip.model');
const { success, paginated, created } = require('../utils/response');
const { getPagination } = require('../utils/pagination');
const { AppError } = require('../middleware/error');

async function list(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { rows, total } = await tripModel.getAll(req.user.id, {
      limit, offset, status: req.query.status, search: req.query.q,
    });
    paginated(res, rows, total, page, limit);
  } catch (e) { next(e); }
}

async function get(req, res, next) {
  try {
    const trip = await tripModel.getById(req.params.id, req.user.id);
    if (!trip) throw new AppError('Trip not found', 404);
    const [tags, stats] = await Promise.all([
      tripModel.getTags(trip.id),
      tripModel.getStats(trip.id),
    ]);
    success(res, { ...trip, tags, stats });
  } catch (e) { next(e); }
}

async function create(req, res, next) {
  try {
    const trip = await tripModel.create(req.user.id, req.body);
    if (req.body.tags?.length) await tripModel.setTags(trip.id, req.body.tags);
    created(res, trip);
  } catch (e) { next(e); }
}

async function update(req, res, next) {
  try {
    const trip = await tripModel.update(req.params.id, req.user.id, req.body);
    if (!trip) throw new AppError('Trip not found', 404);
    if (req.body.tags !== undefined) await tripModel.setTags(trip.id, req.body.tags || []);
    success(res, trip);
  } catch (e) { next(e); }
}

async function remove(req, res, next) {
  try {
    const trip = await tripModel.softDelete(req.params.id, req.user.id);
    if (!trip) throw new AppError('Trip not found', 404);
    success(res, null, 'Trip deleted');
  } catch (e) { next(e); }
}

async function stats(req, res, next) {
  try {
    const data = await tripModel.getStats(req.params.id);
    success(res, data);
  } catch (e) { next(e); }
}

module.exports = { list, get, create, update, remove, stats };
