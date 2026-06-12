const Module = require('../models/Module');
const { success, error } = require('../utils/response');

// GET /api/modules/:id
const getModule = async (req, res, next) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) return error(res, 'Module not found', 404);
    return success(res, { module });
  } catch (err) {
    next(err);
  }
};

// POST /api/modules  (instructor/admin)
const createModule = async (req, res, next) => {
  try {
    const module = await Module.create(req.body);
    return success(res, { module }, 'Module created', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { getModule, createModule };
