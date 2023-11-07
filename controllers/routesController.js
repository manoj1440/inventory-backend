const expressAsyncHandler = require('express-async-handler');
const Routes = require('../models/Route');
const Crate = require('../models/Crate');

const addRoute = expressAsyncHandler(async (req, res) => {
    try {
        const { Name, DeliveringItems, receivedAt, received, Dispatched } = req.body;

        if (!Name || !DeliveringItems || DeliveringItems.length === 0) {
            return res.status(400).json({ status: false, data: null, message: 'Name and DeliveringItems are required' });
        }

        const existingRoute = await Routes.findOne({ Name });
        if (existingRoute) {
            return res.status(400).json({ status: false, data: null, message: 'Name already exists' });
        }

        const newRoute = new Routes({
            Name,
            DeliveringItems,
            receivedAt,
            received,
            Dispatched,
        });

        const savedRoute = await newRoute.save();

        const createIds = DeliveringItems.reduce((acc, cur) => {
            acc.push(...cur.crateIds);
            return acc;
        }, []);

        if (savedRoute) {
            await Crate.updateMany(
                { _id: { $in: createIds } },
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
        const { Name, DeliveringItems } = req.body;

        if (!Name || !DeliveringItems || DeliveringItems.length === 0) {
            return res.status(400).json({
                status: false,
                data: null,
                message: 'Name and a non-empty array of DeliveringItems are required',
            });
        }

        const existingRoute = await Routes.findOne({ Name });
        if (existingRoute) {
            return res.status(400).json({
                status: false,
                data: null,
                message: 'Name already exists',
            });
        }

        const deliveringItemIds = [];

        for (const item of DeliveringItems) {
            const { customerId, crates } = item;

            const crateIds = [];

            for (const crateName of crates) {
                let crate = await Crate.findOne({ serialNumber: crateName });
                if (!crate) {
                    crate = new Crate({
                        serialNumber: crateName,
                        included: true, received: null, receivedAt: null
                    });

                    await crate.save();
                }

                if (crate.isActive) {
                    crateIds.push(crate._id);
                }
            }

            deliveringItemIds.push({ customerId, crateIds });
        }

        const newRoute = new Routes({
            Name,
            DeliveringItems: deliveringItemIds,
        });

        const savedRoute = await newRoute.save();

        return res.status(201).json({
            status: true,
            data: savedRoute,
            message: 'Route created successfully',
        });
    } catch (error) {
        console.error('Error creating Route:', error);
        return res.status(500).json({
            status: false,
            data: null,
            message: 'Error creating Route',
            error: JSON.stringify(error),
        });
    }
});

const getRoutes = expressAsyncHandler(async (req, res) => {
    try {
        const routes = await Routes.find()
            .populate('DeliveringItems.customerId dispatchedBy')
            .populate({
                path: 'DeliveringItems.crateIds',
                model: 'Crate',
            }).lean();

        const newoutes = routes.map(item => {
            const newObj = { ...item };
            const newCrates = item.DeliveringItems.reduce((acc, cur) => {
                acc.push(...cur.crateIds);
                return acc;
            }, []);

            const newCustomers = item.DeliveringItems.reduce((acc, cur) => {
                acc.push(cur.customerId);
                return acc;
            }, []);

            newObj['Crates'] = newCrates;
            newObj['Customers'] = newCustomers;
            return newObj;
        });

        return res.status(200).json({ status: true, data: newoutes, message: 'Routes fetched successfully' });
    } catch (error) {
        console.log('error===', error);
        return res.status(500).json({ status: false, error: error, data: null, message: 'Error fetching routes' });
    }
});


const getMyRoutes = expressAsyncHandler(async (req, res, next) => {
    try {
        const userId = req.userData.user._id;
        const routes = await Routes.find({ dispatchedBy: userId }).populate({
            path: 'DeliveringItems.crateIds DeliveringItems.customerId dispatchedBy',
            select: '-password',
        });
        return res.status(200).json({ status: true, data: routes, message: 'Routes fetched successfully' });
    } catch (error) {
        return res.status(200).json({ status: false, error: error, data: null, message: 'Error fetching routes' });
    }
});

const getRouteById = expressAsyncHandler(async (req, res) => {
    try {
        const routeId = req.params.id;
        const route = await Routes.findById(routeId).populate('DeliveringItems.crateIds DeliveringItems.customerId dispatchedBy');
        if (!route) {
            return res.status(404).json({ status: false, data: null, message: 'Route not found' });
        }
        return res.status(200).json({ status: true, data: route, message: 'Route fetched successfully' });
    } catch (error) {
        return res.status(500).json({ status: false, error: error, data: null, message: 'Error fetching route' });
    }
});

const updateRouteById = expressAsyncHandler(async (req, res) => {
    try {
        const routeId = req.params.id;
        const updates = req.body;
        updates['dispatchedBy'] = req.userData.user._id;

        const updatedRoute = await Routes.findByIdAndUpdate(routeId, updates, { new: true }).populate('DeliveringItems.crateIds DeliveringItems.customerId dispatchedBy');
        if (!updatedRoute) {
            return res.status(404).json({ status: false, data: null, message: 'Route not found' });
        }

        if (updatedRoute && updates.newlyAddedCrates && updates.newlyAddedCrates.length > 0) {
            await Crate.updateMany(
                { _id: { $in: updates.newlyAddedCrates } },
                { $set: { included: true } }
            );
        }
        if (updatedRoute && updates.removedCrates && updates.removedCrates.length > 0) {
            await Crate.updateMany(
                { _id: { $in: updates.removedCrates } },
                { $set: { included: false } }
            );
        }

        return res.status(200).json({ status: true, data: updatedRoute, message: 'Route updated successfully' });
    } catch (error) {
        console.log('error===', error)
        return res.status(500).json({ status: false, error: error, data: null, message: 'Error updating route' });
    }
});

const updateRouteByName = expressAsyncHandler(async (req, res, next) => {
    try {
        const { Name, DeliveringItems } = req.body;

        if (!Name || (Array.isArray(Name) && Name.length === 0)) {
            return res.status(404).json({ status: false, data: null, message: 'Name cannot be blank' });
        }

        const updates = req.body;
        updates['dispatchedBy'] = req.userData.user._id;
        delete updates['Name'];
        const NameArray = Array.isArray(Name) && Name.length > 0 ? Name : [Name];
        const updatedRoutes = await Routes.updateMany(
            { Name: { $in: NameArray } },
            updates,
            { new: true }
        ).populate('DeliveringItems.crateIds DeliveringItems.customerId dispatchedBy');

        if (updatedRoutes.matchedCount === 0) {
            return res.status(404).json({ status: false, data: null, message: 'Routes not found' });
        }

        return res.status(200).json({ status: true, data: updatedRoutes, message: 'Routes updated successfully' });
    } catch (error) {
        return res.status(200).json({ status: false, error: error, data: null, message: 'Error updating Routes' + error });
    }
});

const deleteRouteById = expressAsyncHandler(async (req, res) => {
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

        const currentCrateIds = deletedRoute.DeliveringItems.reduce((crateIds, item) => {
            crateIds.push(...item.crateIds.map(crate => crate._id));
            return crateIds;
        }, []);

        await Crate.updateMany(
            { _id: { $in: currentCrateIds } },
            { $set: { included: false, received: null, receivedAt: null } }
        );


        return res.status(200).json({ status: true, data: null, message: 'Route deleted successfully' });
    } catch (error) {
        return res.status(500).json({ status: false, error: error, data: null, message: 'Error deleting route' });
    }
});

module.exports = {
    addRoute,
    scanToCreateRoute,
    getRoutes,
    getRouteById,
    updateRouteById,
    deleteRouteById,
    updateRouteByName,
    getMyRoutes
};
