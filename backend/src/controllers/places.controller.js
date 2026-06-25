const placeModel = require('../models/place.model');
const { success, created } = require('../utils/response');
const { AppError } = require('../middleware/error');

async function listAll(req, res, next) {
  try {
    const { rows } = await placeModel.getAllWithGps(req.user.id);
    success(res, rows);
  } catch (e) { next(e); }
}

async function listByTrip(req, res, next) {
  try {
    const places = await placeModel.getByTrip(req.params.tripId, req.user.id);
    success(res, places);
  } catch (e) { next(e); }
}

async function get(req, res, next) {
  try {
    const place = await placeModel.getById(req.params.id, req.user.id);
    if (!place) throw new AppError('Place not found', 404);
    success(res, place);
  } catch (e) { next(e); }
}

async function create(req, res, next) {
  try {
    const place = await placeModel.create(req.user.id, req.body);
    created(res, place);
  } catch (e) { next(e); }
}

async function update(req, res, next) {
  try {
    const place = await placeModel.update(req.params.id, req.user.id, req.body);
    if (!place) throw new AppError('Place not found', 404);
    success(res, place);
  } catch (e) { next(e); }
}

async function remove(req, res, next) {
  try {
    const place = await placeModel.softDelete(req.params.id, req.user.id);
    if (!place) throw new AppError('Place not found', 404);
    success(res, null, 'Place deleted');
  } catch (e) { next(e); }
}

async function nearby(req, res, next) {
  try {
    const { lat, lng, radius = 10 } = req.query;
    if (!lat || !lng) throw new AppError('lat and lng are required');
    const places = await placeModel.getNearby(parseFloat(lat), parseFloat(lng), parseFloat(radius), req.user.id);
    success(res, places);
  } catch (e) { next(e); }
}

module.exports = { listAll, listByTrip, get, create, update, remove, nearby };
