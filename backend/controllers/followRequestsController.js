const FollowRequest = require('../models/FollowRequest');
const { handleFollowToggle, followPair } = require('../services/followService');
const { formatFollowRequest } = require('../utils/followRequestFormatter');
const { createNotification } = require('./notificationsController');
const { areUsersBlocked } = require('../utils/moderation');

exports.sendFollowRequest = async (req, res) => {
  try {
    const result = await handleFollowToggle(req.user._id, req.params.userId);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Send follow request error:', error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to process follow request.',
    });
  }
};

exports.getFollowRequests = async (req, res) => {
  try {
    const requests = await FollowRequest.find({
      recipient: req.user._id,
      status: 'pending',
    })
      .sort({ createdAt: -1 })
      .populate('requester', 'fullName username profileImage title');

    res.json({
      success: true,
      requests: requests.map(formatFollowRequest),
      count: requests.length,
    });
  } catch (error) {
    console.error('Get follow requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to load follow requests.' });
  }
};

exports.getFollowRequestCount = async (req, res) => {
  try {
    const count = await FollowRequest.countDocuments({
      recipient: req.user._id,
      status: 'pending',
    });

    res.json({ success: true, count });
  } catch (error) {
    console.error('Get follow request count error:', error);
    res.status(500).json({ success: false, message: 'Failed to load follow request count.' });
  }
};

exports.acceptFollowRequest = async (req, res) => {
  try {
    const request = await FollowRequest.findById(req.params.requestId).populate(
      'requester',
      'fullName username profileImage title'
    );

    if (!request) {
      return res.status(404).json({ success: false, message: 'Follow request not found.' });
    }

    if (request.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to accept this request.' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This request has already been processed.' });
    }

    if (await areUsersBlocked(request.requester._id, request.recipient)) {
      request.status = 'rejected';
      await request.save();
      return res.status(403).json({ success: false, message: 'Cannot accept follow request due to block settings.' });
    }

    request.status = 'accepted';
    await request.save();

    const result = await followPair(request.requester._id, request.recipient);

    await createNotification({
      recipient: request.requester._id,
      sender: req.user._id,
      type: 'follow_accepted',
      text: 'accepted your follow request',
    });

    res.json({
      success: true,
      message: 'Follow request accepted.',
      request: formatFollowRequest(request),
      ...result,
    });
  } catch (error) {
    console.error('Accept follow request error:', error);
    res.status(500).json({ success: false, message: 'Failed to accept follow request.' });
  }
};

exports.rejectFollowRequest = async (req, res) => {
  try {
    const request = await FollowRequest.findById(req.params.requestId).populate(
      'requester',
      'fullName username profileImage title'
    );

    if (!request) {
      return res.status(404).json({ success: false, message: 'Follow request not found.' });
    }

    if (request.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to reject this request.' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This request has already been processed.' });
    }

    request.status = 'rejected';
    await request.save();

    res.json({
      success: true,
      message: 'Follow request rejected.',
      request: formatFollowRequest(request),
    });
  } catch (error) {
    console.error('Reject follow request error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject follow request.' });
  }
};
