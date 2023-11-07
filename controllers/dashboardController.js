const Batch = require('../models/Batch');
const Panel = require('../models/Panel');
const User = require('../models/User');
const Route = require('../models/Route');
const Crate = require('../models/Crate');

const getDashboardData = async (req, res, next) => {
    try {
        const [batchCount, panelCount, totalPanelsInBatch, totalReceivedPanels, totalReceivedBatches] = await Promise.all([
            Batch.countDocuments(),
            Panel.countDocuments(),
            Panel.countDocuments({ included: true }),
            Panel.countDocuments({ received: true }),
            Batch.countDocuments({ received: true }),
        ]);

        const [totalRoutes, totalCrates, totalCratesInRoute, totalReceivedCrates, totalReceivedRoutes] = await Promise.all([
            Route.countDocuments(),
            Crate.countDocuments(),
            Crate.countDocuments({ included: true }),
            Crate.countDocuments({ received: true }),
            Route.countDocuments({ received: true }),
        ]);

        const userOverviewPromise = User.aggregate([
            {
                $match: {
                    role: 'customer'
                }
            },
            {
                $lookup: {
                    from: 'batches',
                    localField: '_id',
                    foreignField: 'user',
                    as: 'userBatches',
                },
            },
            {
                $project: {
                    name: 1,
                    role: 1,
                    userBatches: 1,
                    numBatchesCreated: { $size: '$userBatches' }
                },
            },
        ]);

        const customerOverviewPromise = User.aggregate([
            {
                $match: {
                    role: 'customer'
                }
            },
            {
                $lookup: {
                    from: 'routes',
                    localField: '_id',
                    foreignField: 'Customers',
                    as: 'userRoutes',
                },
            },
            {
                $project: {
                    name: 1,
                    role: 1,
                    userRoutes: 1,
                    numRoutesCreated: { $size: '$userRoutes' }
                },
            },
        ]);

        const [userOverview, customerOverview] = await Promise.all([userOverviewPromise, customerOverviewPromise]);

        return res.status(200).json({
            status: true,
            data: {
                batches: {
                    totalBatches: batchCount,
                    totalPanels: panelCount,
                    totalPanelsInBatch,
                    totalReceivedBatches,
                    totalReceivedPanels,
                },
                routes: {
                    totalRoutes,
                    totalCrates,
                    totalCratesInRoute,
                    totalReceivedRoutes,
                    totalReceivedCrates,
                },
                userOverview,
                customerOverview,
            },
            message: 'Dashboard data retrieved successfully',
        });
    } catch (error) {
        return res.status(200).json({ status: false, error: error, data: null, message: 'Error fetching dashboard data' });
    }
};

module.exports = {
    getDashboardData,
};
