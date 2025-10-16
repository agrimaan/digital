const User = require('../models/User'); // adjust path if different

// build a Mongo filter from query params
function buildFilter({ search, role }) {
    console.log("within buildFilter of user-service");

  const filter = {};
  if (role) filter.role = role;

  if (search) {
    const rx = new RegExp(search, 'i');
    // adapt fields to your schema (firstName/lastName/email)
    filter.$or = [
      { firstName: rx },
      { lastName: rx },
      { email: rx },
    ];
  }
  return filter;
}

function sanitize(userDoc) {
    console.log("within sanitize of user-service");

  const u = userDoc.toObject ? userDoc.toObject() : userDoc;
  // helpful computed name for UIs that expect `name`
  return {
    ...u,
    name: (u.firstName && u.lastName) ? `${u.firstName} ${u.lastName}` : (u.firstName || u.lastName || u.name),
  };
}

// GET /internal/users?page=&limit=&search=&role=&sort=
exports.listInternal = async (req, res) => {
    console.log("within listInternal of user-service");

    console.log("within listInternal of user-service");
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
  const sort = req.query.sort || '-createdAt';
  const filter = buildFilter({ search: req.query.search, role: req.query.role });

  const skip = (page - 1) * limit;
  const [docs, total] = await Promise.all([
    User.find(filter, '-passwordHash').sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  const items = docs.map(sanitize);

  res.json({
    items,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  });
};

// GET /internal/users/:id
exports.getInternal = async (req, res) => {
    console.log("within getInternal of user-service");

  const doc = await User.findById(req.params.id, '-passwordHash');
  if (!doc) return res.status(404).json({ message: 'User not found' });
  res.json({ user: sanitize(doc) });
};

// DELETE /internal/users/:id
exports.deleteInternal = async (req, res) => {
  const doc = await User.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ message: 'User not found' });
  res.json({ ok: true });
};

// GET /internal/users/search?q=
exports.searchInternal = async (req, res) => {
    console.log("within searchInternal of user-service");

  const q = (req.query.q || '').trim();
  if (!q) return res.status(400).json({ message: 'q is required' });

  const rx = new RegExp(q, 'i');
  const docs = await User.find(
    { $or: [{ firstName: rx }, { lastName: rx }, { email: rx }] },
    '-passwordHash'
  )
    .sort('-createdAt')
    .limit(50);

  res.json({ users: docs.map(sanitize) });
};

