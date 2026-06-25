const tagModel = require('../models/tag.model');
const { success, created } = require('../utils/response');

async function list(req, res, next) {
  try { success(res, await tagModel.getAll(req.user.id)); } catch (e) { next(e); }
}

async function create(req, res, next) {
  try { created(res, await tagModel.create(req.user.id, req.body)); } catch (e) { next(e); }
}

async function update(req, res, next) {
  try { success(res, await tagModel.update(req.params.id, req.user.id, req.body)); } catch (e) { next(e); }
}

async function remove(req, res, next) {
  try {
    await tagModel.remove(req.params.id, req.user.id);
    success(res, null, 'Tag deleted');
  } catch (e) { next(e); }
}

module.exports = { list, create, update, remove };
