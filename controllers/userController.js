const Batch = require('../models/Batch');
const User = require('../models/User');
const hashPassword = require('../utils/hash-password');
const { createNewUser } = require('../utils/addUserUtils');
const validator = require('validator');
const expressAsyncHandler = require('express-async-handler');

const addUser = async (req, res, next) => {
    try {
        const { name, email, password, contact, role, location } = req.body;
        if (!name || !email || !contact) {
            return res.status(400).json({
                status: false,
                message: 'All fields are required'
            });
        }
        if (!validator.isEmail(email)) {
            return res.status(400).json({
                status: false,
                message: 'Invalid email format'
            });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                status: false,
                message: 'Email already exists'
            });
        }
        if (password && password.length < 8) {
            return res.status(400).json({
                status: false,
                message: 'Password should be at least 8 characters long'
            });
        }
        if (!validator.isMobilePhone(contact.toString(), 'any', { strictMode: false })) {
            return res.status(400).json({
                status: false,
                message: 'Invalid contact number format'
            });
        }

        const hashedPassword = hashPassword(password || '12345678');

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            location,
            contact,
            role
        });

        const savedUser = await newUser.save();
        return res.status(201).json({
            status: true,
            data: savedUser,
            message: 'User added successfully'
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: 'Error adding user',
            error: JSON.stringify(error)
        });
    }
};

const bulkUploadUsers = expressAsyncHandler(async (req, res) => {
    const { users } = req.body;
    const addedUsers = [];

    for (const user of users) {
        try {
            const existingUser = await User.findOne({ email: user.email });

            if (!existingUser) {
                const newUser = await createNewUser(user);
                addedUsers.push(newUser);
            }
        } catch (error) {
            console.error('Error adding user:', error);
        }
    }

    return res.status(201).json({
        status: true,
        addedUsers,
        skippedUsers,
        message: 'Bulk upload completed with skipped users',
    });
});


const getUsers = async (req, res, next) => {
    try {
        const users = await User.find({ role: { $ne: 'customer' } }, { password: 0 });
        return res.status(200).json({
            status: true,
            data: users,
            message: 'Users fetched successfully'
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: 'Error fetching users',
            error: JSON.stringify(error)
        });
    }
};

const getCustomers = async (req, res, next) => {
    try {
        const users = await User.find({ role: 'customer' }, { password: 0 });
        return res.status(200).json({
            status: true,
            data: users,
            message: 'Customers fetched successfully'
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: 'Error fetching Customers',
            error: JSON.stringify(error)
        });
    }
};

const getUserById = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: false,
                message: 'User not found'
            });
        }
        return res.status(200).json({
            status: true,
            data: user,
            message: 'User fetched successfully'
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: 'Error fetching user',
            error: JSON.stringify(error)
        });
    }
};

const updateUserById = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const updates = req.body;
        if (updates.email) {
            if (!validator.isEmail(updates.email)) {
                return res.status(400).json({
                    status: false,
                    message: 'Invalid email format'
                });
            }

            const existingUser = await User.findOne({ email: updates.email, _id: { $ne: userId } });
            if (existingUser) {
                return res.status(400).json({
                    status: false,
                    message: 'Email already exists'
                });
            }
        }

        if (updates.password) {
            if (updates.password.length < 8) {
                return res.status(400).json({
                    status: false,
                    message: 'Password should be at least 8 characters long'
                });
            }
        }

        if (updates.contact) {
            if (!validator.isMobilePhone(updates.contact.toString(), 'any', { strictMode: false })) {
                return res.status(400).json({
                    status: false,
                    message: 'Invalid contact number format'
                });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true });
        if (!updatedUser) {
            return res.status(404).json({
                status: false,
                message: 'User not found'
            });
        }
        return res.status(200).json({
            status: true,
            data: updatedUser,
            message: 'User updated successfully'
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: 'Error updating user',
            error: JSON.stringify(error)
        });
    }
};

const deleteUserById = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) {
            return res.status(404).json({
                status: false,
                message: 'User not found'
            });
        }
        await Batch.updateMany(
            { user: userId },
            { $pull: { user: userId } }
        );
        return res.status(200).json({
            status: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: 'Error deleting user',
            error: JSON.stringify(error)
        });
    }
};

module.exports = {
    addUser,
    getUsers,
    getUserById,
    updateUserById,
    deleteUserById,
    getCustomers,
    bulkUploadUsers
};
