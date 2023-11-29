const Crate = require('../models/Crate');
const Route = require('../models/Route');
const expressAsyncHandler = require('express-async-handler');

const addCrate = async (req, res, next) => {
    try {
        const { serialNumber, DOE, DOM, PCM } = req.body;

        if (!serialNumber) {
            return res.status(400).json({ status: false, data: null, message: 'Serial number is required' });
        }

        const existingCrate = await Crate.findOne({ serialNumber });

        if (existingCrate) {
            return res.status(400).json({ status: false, data: null, message: 'Serial number already exists' });
        }

        const newCrate = new Crate({
            serialNumber,
            DOE: DOE || null,
            DOM: DOM || null,
            PCM: PCM || null
        });

        const savedCrate = await newCrate.save();
        return res.status(201).json({ status: true, data: savedCrate, message: 'Crate created successfully' });
    } catch (error) {
        return res.status(200).json({ status: false, error: error, data: null, message: 'Error adding crate', error: error });
    }
};

const bulkUploadCrates = expressAsyncHandler(async (req, res) => {
    const { crates } = req.body;

    if (!crates || crates.length === 0) {
        return res.status(400).json({
            status: false,
            message: 'No crates provided for bulk upload.',
        });
    }

    try {
        const serialNumbers = crates.map(crate => crate.serialNumber);
        const existingCrates = await Crate.find({ serialNumber: { $in: serialNumbers } });

        // Create a map of existing crates for quick look-up
        const existingCrateMap = {};
        existingCrates.forEach(existingCrate => {
            existingCrateMap[existingCrate.serialNumber] = existingCrate;
        });

        const newCrates = [];
        const skippedCrates = [];

        for (const crate of crates) {
            if (!existingCrateMap[crate.serialNumber]) {
                newCrates.push(crate);
            } else {
                skippedCrates.push(crate);
            }
        }

        // Insert new crates in bulk
        if (newCrates.length > 0) {
            await Crate.insertMany(newCrates);
        }

        return res.status(201).json({
            status: true,
            addedCrates: newCrates,
            skippedCrates,
            message: 'Bulk upload completed with skipped crates.',
        });
    } catch (error) {
        console.error('Error adding crates:', error);
        return res.status(200).json({
            status: false,
            message: 'Internal Server Error',
            error: error
        });
    }
});

const getCrates = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;

        const nameFilter = req.query.search && req.query.search.trim().length > 0
            ? { serialNumber: { $regex: new RegExp(req.query.search, 'i') } }
            : {};

        const totalCrates = await Crate.countDocuments(nameFilter);

        let crates;
        if (req.query.page && req.query.page.trim().length > 0) {
            crates = await Crate.find(nameFilter)
                .skip((page - 1) * pageSize)
                .limit(pageSize);
        } else {
            crates = await Crate.find(nameFilter);
        }

        const cratesWithAssetNumber = await Promise.all(crates.map(async (crate) => {
            const route = await Route.findOne({ 'DeliveringItems.crateIds': crate._id });
            return {
                ...crate.toObject(),
                Name: route ? route.Name : null,
                Customers: route && route.Customers ? route.Customers.map(customer => customer.name) : [],
            };
        }));

        return res.status(200).json({
            status: true,
            data: cratesWithAssetNumber,
            message: 'Crates fetched successfully',
            total: totalCrates,
        });
    } catch (error) {
        return res.status(200).json({ status: false, error: error, data: null, message: 'Error fetching crates' + error });
    }
};

const getCratesForRoutes = async (req, res, next) => {
    try {
        const crates = await Crate.find({ included: false });
        const crates2 = await Crate.find({ included: true, received: true });
        const cratesData = [...crates, ...crates2].filter(item => item.isActive);
        return res.status(200).json({ status: true, data: cratesData, message: 'Crates fetched successfully' });
    } catch (error) {
        return res.status(200).json({ status: false, error: error, data: null, message: 'Error fetching Crates' });
    }
};

const getCrateById = async (req, res, next) => {
    try {
        const crateId = req.params.id;
        const crate = await Crate.findById(crateId);

        if (!crate) {
            return res.status(404).json({ status: false, data: null, message: 'Crate not found' });
        }

        return res.status(200).json({ status: true, data: crate, message: 'Crate fetched successfully' });
    } catch (error) {
        return res.status(200).json({ status: false, error: error, data: null, message: 'Error fetching crate' });
    }
};

const getCrateByName = async (req, res, next) => {
    try {
        const { crateName } = req.body;

        const parsedCrateName = crateName.replace(/\//g, '/');

        const crate = await Crate.findOne({ serialNumber: parsedCrateName }).lean();

        if (!crate) {
            return res.status(200).json({ status: true, data: null, canScan: true });
        }

        return res.status(200).json({ status: true, data: crate, canScan: !crate.included || !!(crate.included && crate.received), message: 'Crate fetched successfully' });
    } catch (error) {
        return res.status(200).json({ status: false, error: error, data: null, message: 'Error fetching crate' });
    }
};

const updateCrateById = async (req, res, next) => {
    try {
        const crateId = req.params.id;
        const updates = req.body;

        const updatedCrate = await Crate.findByIdAndUpdate(crateId, updates, { new: true });

        if (!updatedCrate) {
            return res.status(404).json({ status: false, data: null, message: 'Crate not found' });
        }

        if (updates.included === false) {
            await Route.updateMany(
                { crates: crateId },
                { $pull: { crates: crateId } }
            );
        }

        return res.status(200).json({ status: true, data: updatedCrate, message: 'Crate updated successfully' });
    } catch (error) {
        return res.status(200).json({ status: false, error: error, data: null, message: 'Error updating crate' });
    }
};

const updateCrateByName = async (req, res, next) => {
    try {
        const { serialNumber } = req.body;

        if (!serialNumber) {
            return res.status(404).json({ status: false, data: null, message: 'Serial number cannot be blank' });
        }

        const updates = req.body;

        const updatedCrate = await Crate.findOneAndUpdate({ serialNumber }, updates, { new: true });

        if (!updatedCrate) {
            return res.status(404).json({ status: false, data: null, message: 'Crate not found' });
        }

        if (updates.included === false) {
            await Route.updateMany(
                { crates: updatedCrate._id },
                { $pull: { crates: updatedCrate._id } }
            );
        }

        return res.status(200).json({ status: true, data: updatedCrate, message: 'Crate updated successfully' });
    } catch (error) {
        return res.status(200).json({ status: false, error: error, data: null, message: 'Error updating crate' });
    }
};

const deleteCrateById = async (req, res, next) => {
    try {
        const crateId = req.params.id;
        const deletedCrate = await Crate.findByIdAndDelete(crateId);

        if (!deletedCrate) {
            return res.status(404).json({ status: false, data: null, message: 'Crate not found' });
        }

        const routesContainingCrate = await Route.find({
            'DeliveringItems.crateIds': crateId
        });

        for (const route of routesContainingCrate) {
            route.DeliveringItems = route.DeliveringItems.map((item) => {
                item.crateIds = item.crateIds.filter((id) => id !== crateId);
                return item;
            });

            await route.save();
        }

        return res.status(200).json({ status: true, data: null, message: 'Crate deleted successfully' });
    } catch (error) {
        return res.status(200).json({ status: false, error: error, data: null, message: 'Error deleting crate' });
    }
};

module.exports = {
    addCrate,
    getCrates,
    getCratesForRoutes,
    getCrateById,
    updateCrateById,
    deleteCrateById,
    bulkUploadCrates,
    updateCrateByName,
    getCrateByName
};
