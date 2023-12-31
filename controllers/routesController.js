const expressAsyncHandler = require('express-async-handler');
const Routes = require('../models/Route');
const Crate = require('../models/Crate');
const OldRoute = require('../models/OldRoute');
const Route = require('../models/Route');

const addRoute = expressAsyncHandler(async (req, res) => {
    try {
        const { Name, DeliveringItems, receivedAt, received, Dispatched } = req.body;

        if (!Name) {
            return res.status(400).json({ status: false, data: null, message: 'Route Name is required' });
        }

        const existingRoute = await Routes.findOne({ Name });
        if (existingRoute) {
            return res.status(400).json({ status: false, data: null, message: 'Name already exists' });
        }

        const newRoute = new Routes({
            Name,
            DeliveringItems: DeliveringItems && Array.isArray(DeliveringItems) && DeliveringItems.length > 0 ? DeliveringItems : [],
            receivedAt,
            received,
            Dispatched,
        });

        const savedRoute = await newRoute.save();

        if (DeliveringItems && Array.isArray(DeliveringItems) && DeliveringItems.length > 0) {
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
        }

        return res.status(201).json({ status: true, data: savedRoute, message: 'Route created successfully' });
    } catch (error) {
        console.error('Error adding route:', error);
        return res.status(500).json({ status: false, data: null, message: 'Error adding route', error: error });
    }
});

const addNewDelivery = expressAsyncHandler(async (req, res) => {
    try {
        const { Name, DeliveringItems, fromApp, receivedAt, received, Dispatched, oldData } = req.body;

        if (!Name || !DeliveringItems || DeliveringItems.length === 0) {
            return res.status(400).json({ status: false, data: null, message: 'Name and DeliveringItems are required' });
        }

        let deliveringItemIds = [];

        if (fromApp) {
            deliveringItemIds = [];

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

                await Crate.updateMany(
                    { _id: { $in: crateIds } },
                    { $set: { included: true, received: null, receivedAt: null } }
                );

                deliveringItemIds.push({ customerId, crateIds });
            }

        } else {
            const createIds = DeliveringItems.reduce((acc, cur) => {
                acc.push(...cur.crateIds);
                return acc;
            }, []);

            await Crate.updateMany(
                { _id: { $in: createIds } },
                { $set: { included: true, received: null, receivedAt: null } }
            );
            deliveringItemIds = DeliveringItems;
        }


        const updatedRoute = await Routes.findByIdAndUpdate(oldData._id, { DeliveringItems: deliveringItemIds, Dispatched: null, dispatchedBy: null }, { new: true }).populate('DeliveringItems.crateIds DeliveringItems.customerId dispatchedBy');
        if (!updatedRoute) {
            return res.status(404).json({ status: false, data: null, message: 'Route not found' });
        }

        const existingOldRoute = await OldRoute.findOne({ Name });
        if (!existingOldRoute) {
            const newOldRoute = new OldRoute({
                Name,
                DeliverdItems: [oldData]
            });

            await newOldRoute.save();
        } else {
            existingOldRoute.DeliverdItems.push(oldData);
            await existingOldRoute.save();
        }

        const currentCrateIds = oldData.DeliveringItems.reduce((crateIds, item) => {
            crateIds.push(...item.crateIds.map(crate => crate._id));
            return crateIds;
        }, []);

        await Crate.updateMany(
            { _id: { $in: currentCrateIds } },
            { $set: { included: false, received: null, receivedAt: null } }
        );

        return res.status(201).json({ status: true, data: updatedRoute, message: 'Route created successfully' });
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

                if (crate && !crate.included && crate.isActive) {
                    crateIds.push(crate._id);
                }

                if (!crate) {
                    crate = new Crate({
                        serialNumber: crateName,
                        included: true, received: null, receivedAt: null
                    });

                    await crate.save();
                    crateIds.push(crate._id);
                }
            }

            await Crate.updateMany(
                { _id: { $in: crateIds } },
                { $set: { included: true, received: null, receivedAt: null } }
            );


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
            const newCrates = item?.DeliveringItems?.reduce((acc, cur) => {
                acc.push(...cur.crateIds);
                return acc;
            }, []);

            const newCustomers = item?.DeliveringItems?.reduce((acc, cur) => {
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

const getOldRoutes = expressAsyncHandler(async (req, res) => {
    try {
        const routes = await OldRoute.find();

        return res.status(200).json({ status: true, data: routes, message: 'Old Routes fetched successfully' });
    } catch (error) {
        console.log('error===', error);
        return res.status(500).json({ status: false, error: error, data: null, message: 'Error fetching old routes' });
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

        const updates = { ...req.body };
        updates['dispatchedBy'] = req.userData.user._id;
        delete updates['Name'];

        const NameArray = Array.isArray(Name) && Name.length > 0 ? Name : [Name];

        let runOnce = 1;

        if (DeliveringItems && DeliveringItems.length > 0 && runOnce <= 1) {
            runOnce += 1;
            const routeData = await Route.findOne({ Name }).lean()

            const deliveringItemIds = routeData ? [...routeData.DeliveringItems] : [];

            const processCratesPromises = DeliveringItems.map(async item => {
                return {
                    customerId: item.customerId,
                    crateIds: await processCrates(item.crates)
                }
            });

            const processedCratesResults = await Promise.all(processCratesPromises);

            console.log('processedCratesResults==', processedCratesResults);
            console.log('deliveringItemIds==', deliveringItemIds);

            processedCratesResults.forEach(({ customerId, crateIds }) => {
                const existingItem = deliveringItemIds.find(item => item.customerId.toString() === customerId);
                console.log('existingItem==', existingItem);
                if (!existingItem) {
                    deliveringItemIds.push({ customerId, crateIds });
                }
            });

            if (deliveringItemIds && deliveringItemIds.length > 0) {
                updates['DeliveringItems'] = deliveringItemIds;
            }
        }

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

async function processCrates(crates) {
    const cratePromises = crates.map(async crateName => {
        const crate = Crate.findOneAndUpdate(
            { serialNumber: crateName },
            { $set: { included: true, received: null, receivedAt: null } },
            { upsert: true, new: true }
        );

        return crate
    });

    const crateIds = await Promise.all(cratePromises);

    console.log('crateIds===', crateIds);
    return crateIds.map(item => item._id.toString());
}


const dispatchRouteByName = expressAsyncHandler(async (req, res, next) => {
    try {
        const { Name } = req.body;

        if (!Name) {
            return res.status(404).json({ status: false, data: null, message: 'Name cannot be blank' });
        }

        const bodyUpdate = {
            dispatchedBy: req.userData.user._id,
            Dispatched: new Date().toISOString()
        }

        const updatedRoutes = await Routes.findOneAndUpdate(
            { Name },
            bodyUpdate,
            { new: true }
        ).populate('DeliveringItems.crateIds DeliveringItems.customerId dispatchedBy');

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
    getMyRoutes,
    addNewDelivery,
    getOldRoutes,
    dispatchRouteByName
};
