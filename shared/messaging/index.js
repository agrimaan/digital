/**
 * Messaging Module
 * 
 * This module exports all messaging components.
 */

const messageBroker = require('./message-broker');
const EventPublisher = require('./event-publisher');
const EventSubscriber = require('./event-subscriber');
const TaskQueue = require('./task-queue');

module.exports = {
  messageBroker,
  EventPublisher,
  EventSubscriber,
  TaskQueue
};