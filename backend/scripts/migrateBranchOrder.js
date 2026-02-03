/**
 * One-time migration: Set order field on existing branches that don't have it.
 * Run: node backend/scripts/migrateBranchOrder.js
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
}

const Branch = require('../models/Branch');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const result = await Branch.updateMany(
        { order: { $exists: false } },
        { $set: { order: 0 } }
    );
    console.log('Branches updated (order set to 0 where missing):', result.modifiedCount);
    await mongoose.disconnect();
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
