const expressAsyncHandler = require('express-async-handler');
const Routes = require('../models/Route');
const Panel = require('../models/Panel');

const addRoute = expressAsyncHandler(async (req, res) => {
    try {
        const { Name, Customers, Crates, receivedAt, received, Dispatched } = req.body;

        if (!Name || !Customers) {
            return res.status(400).json({ status: false, data: null, message: 'Name and Customers are required' });
        }

        const existingRoute = await Routes.findOne({ Name });
        if (existingRoute) {
            return res.status(400).json({ status: false, data: null, message: 'Name already exists' });
        }

        const newRoute = new Routes({
            Name,
            Customers,
            Crates,
            receivedAt,
            received,
            Dispatched,
        });

        const savedRoute = await newRoute.save();
        if (savedRoute) {
            await Panel.updateMany(
                { _id: { $in: Crates } },
                { $set: { included: true, received: null, receivedAt: null } }
            );
        }

        return res.status(201).json({ status: true, data: savedRoute, message: 'Route created successfully' });
    } catch (error) {
        console.error('Error adding route:', error);
        return res.status(500).json({ status: false, data: null, message: 'Error adding route', error: error });
    }
});

const scanToCreateRoute = expressAsyncHandler(async (req, res) => {
    try {
        const { Name, Crates } = req.body;

        if (!Name || !Crates || !Array.isArray(Crates) || Crates.length === 0) {
            return res.status(400).json({
                status: false,
                data: null,
                message: 'Name and a non-empty array of Crates are required',
            });
        }

        const existingRoute = await Name.findOne({ Name });
        if (existingRoute) {
            return res.status(400).json({
                status: false,
                data: null,
                message: 'Name already exists',
            });
        }
        const uniqueCrates = Array.from(new Set(Crates));

        const crateObjects = await Panel.find({ _id: { $in: uniqueCrates } });
        const activeCrateObjects = crateObjects.filter(item => item.isActive);

        const crateIds = crateObjects.map((crate) => crate._id);
        const activeCrateIds = activeCrateObjects.map((crate) => crate._id);

        const CratesToPush = [...activeCrateIds];

        if (crateIds.length !== uniqueCrates.length) {
            const missingCrates = uniqueCrates.filter((serialNumber) =>
                !crateIds.includes(crateObjects.find((crate) => crate.serialNumber === serialNumber)?._id)
            );


            const newCrates = await Panel.insertMany(
                missingCrates.map((serialNumber) => ({ serialNumber, included: true }))
            );

            CratesToPush.push(...newCrates.map((crate) => crate._id));
        }

        const newRoute = new Routes({
            Name,
            Customers,
            Crates: CratesToPush,
            receivedAt,
            received,
            Dispatched,
        });

        const savedRoute = await newRoute.save();
        if (savedRoute) {
            await Panel.updateMany(
                { _id: { $in: CratesToPush } },
                { $set: { received: null, receivedAt: null, included: true } }
            );
        }

        return res.status(201).json({
            status: true,
            data: savedBatch,
            message: 'Route created successfully',
        });
    } catch (error) {
        console.error('Error creating Route:', error);
        return res.status(200).json({
            status: false,
            data: null,
            message: 'Error creating Route', error: JSON.stringify(error)
        });
    }
});


const getRoutes = async (req, res) => {
    try {
        const routes = await Routes.find().populate('Customers Crates dispatchedBy');
        return res.status(200).json({ status: true, data: routes, message: 'Routes fetched successfully' });
    } catch (error) {
        return res.status(500).json({ status: false, error: error, data: null, message: 'Error fetching routes' });
    }
};

const getMyRoutes = async (req, res, next) => {
    try {
        const userId = req.userData.user._id;
        const routes = await Routes.find({ dispatchedBy: userId }).populate({
            path: 'Crates Customers dispatchedBy',
            select: '-password',
        });
        return res.status(200).json({ status: true, data: routes, message: 'routes fetched successfully' });
    } catch (error) {
        return res.status(200).json({ status: false, error: error, data: null, message: 'Error fetching routes' });
    }
};

const getRouteById = async (req, res) => {
    try {
        const routeId = req.params.id;
        const route = await Routes.findById(routeId).populate('Customers Crates dispatchedBy');
        if (!route) {
            return res.status(404).json({ status: false, data: null, message: 'Route not found' });
        }
        return res.status(200).json({ status: true, data: route, message: 'Route fetched successfully' });
    } catch (error) {
        return res.status(500).json({ status: false, error: error, data: null, message: 'Error fetching route' });
    }
};

const updateRouteById = async (req, res) => {
    try {
        const routeId = req.params.id;
        const updates = req.body;
        updates['dispatchedBy'] = req.userData.user._id;

        const updatedRoute = await Routes.findByIdAndUpdate(routeId, updates, { new: true }).populate('Customers Crates dispatchedBy');
        if (!updatedRoute) {
            return res.status(404).json({ status: false, data: null, message: 'Route not found' });
        }

        if (updatedRoute && updates.Crates && updates.Crates.length > 0) {
            await Panel.updateMany(
                { _id: { $in: updates.Crates } },
                { $set: { included: true } }
            );
        }
        if (updatedRoute && updates.diffCrates && updates.diffCrates.length > 0) {
            await Panel.updateMany(
                { _id: { $in: updates.diffCrates } },
                { $set: { included: false } }
            );
        }

        return res.status(200).json({ status: true, data: updatedRoute, message: 'Route updated successfully' });
    } catch (error) {
        return res.status(500).json({ status: false, error: error, data: null, message: 'Error updating route' });
    }
};

const updateRouteByName = async (req, res, next) => {
    try {
        const { Name } = req.body;

        if (!Name || (Array.isArray(Name) && Name.length === 0)) {
            return res.status(404).json({ status: false, data: null, message: 'Name can not be blank' });
        }

        const updates = req.body;
        updates['dispatchedBy'] = req.userData.user._id;
        delete updates['Name'];
        const NameArray = Array.isArray(Name)
            && Name.length > 0 ? Name : [Name]
        const updatedCrates = await Routes.updateMany(
            { Name: { $in: NameArray } },
            updates,
            { new: true }
        ).populate('Crates user');
        if (updatedCrates.matchedCount === 0) {
            return res.status(404).json({ status: false, data: null, message: 'Crates not found' });
        }

        return res.status(200).json({ status: true, data: updatedCrates, message: 'Crates updated successfully' });
    } catch (error) {
        return res.status(200).json({ status: false, error: error, data: null, message: 'Error updating Crates' + error });
    }
};

const deleteRouteById = async (req, res) => {
    try {
        const routeId = req.params.id;
        const route = await Routes.findById(routeId);

        if (!route) {
            return res.status(404).json({ status: false, data: null, message: 'Route not found' });
        }

        const deletedRoute = await Routes.findByIdAndDelete(routeId);

        if (!deletedRoute) {
            return res.status(404).json({ status: false, data: null, message: 'Route not found' });
        }

        await Panel.updateMany(
            { _id: { $in: route.Crates } },
            { $set: { included: false, received: null, receivedAt: null } }
        );

        return res.status(200).json({ status: true, data: null, message: 'Route deleted successfully' });
    } catch (error) {
        return res.status(500).json({ status: false, error: error, data: null, message: 'Error deleting route' });
    }
};


module.exports = {
    addRoute,
    getRoutes,
    getRouteById,
    updateRouteById,
    deleteRouteById,
    scanToCreateRoute,
    updateRouteByName,
    getMyRoutes
};
