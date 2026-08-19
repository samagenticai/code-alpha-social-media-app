const { formatUserSnippet } = require('./postFormatter');

const formatFollowRequest = (reqDoc) => ({
  id: reqDoc._id.toString(),
  _id: reqDoc._id.toString(),
  status: reqDoc.status,
  createdAt: reqDoc.createdAt,
  requester: formatUserSnippet(reqDoc.requester),
});

module.exports = { formatFollowRequest };
