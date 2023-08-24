const Batch = require('../models/Batch');
const Panel = require('../models/Panel');
const User = require('../models/User');

const getDashboardData = async (req, res, next) => {
    try {
        const totalBatches = await Batch.countDocuments();
        const totalPanels = await Panel.countDocuments();
        const totalSentBatches = await Batch.countDocuments({ receivedAt: { $ne: null } });
        const totalUnscheduledBatches = await Batch.countDocuments({ receivedAt: null });

        const userOverview = await User.aggregate([
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
                    username: 1,
                    role: 1,
                    numBatchesCreated: { $size: '$userBatches' }
                },
            },
        ]);

        return res.status(200).json({
            status: true,
            data: {
                totalBatches,
                totalPanels,
                totalSentBatches,
                totalUnscheduledBatches,
                userOverview,
            },
            message: 'Dashboard data retrieved successfully',
        });
    } catch (error) {
        return res.status(500).json({ status: false, data: null, message: 'Error fetching dashboard data' });
    }
};

module.exports = {
    getDashboardData,
};
