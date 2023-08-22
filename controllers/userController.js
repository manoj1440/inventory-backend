const User = require('../models/User');
const addUser = async (req, res, next) => {
    try {
        const { name, email, password, contact, role } = req.body;
        if (!name || !email || !password || !contact) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        if (password.length < 8) {
            return res.status(400).json({ message: 'Password should be at least 8 characters long' });
        }
        if (!validator.isMobilePhone(contact.toString(), 'any', { strictMode: false })) {
            return res.status(400).json({ message: 'Invalid contact number format' });
        }

        const newUser = new User({
            name,
            email,
            password,
            contact,
            role
        });

        const savedUser = await newUser.save();
        return res.status(201).json(savedUser);
    } catch (error) {
        return res.status(500).json({ message: 'Error adding user', error });
    }
};

const getUsers = async (req, res, next) => {
    try {
        const users = await User.find();
        return res.status(200).json(users);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching users', error });
    }
};

const getUserById = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching user', error });
    }
};

const updateUserById = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const updates = req.body;
        if (updates.email) {
            if (!validator.isEmail(updates.email)) {
                return res.status(400).json({ message: 'Invalid email format' });
            }

            const existingUser = await User.findOne({ email: updates.email, _id: { $ne: userId } });
            if (existingUser) {
                return res.status(400).json({ message: 'Email already exists' });
            }
        }

        if (updates.password) {
            if (updates.password.length < 8) {
                return res.status(400).json({ message: 'Password should be at least 8 characters long' });
            }
        }

        if (updates.contact) {
            if (!validator.isMobilePhone(updates.contact.toString(), 'any', { strictMode: false })) {
                return res.status(400).json({ message: 'Invalid contact number format' });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json(updatedUser);
    } catch (error) {
        return res.status(500).json({ message: 'Error updating user', error });
    }
};

const deleteUserById = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({ message: 'User deleted' });
    } catch (error) {
        return res.status(500).json({ message: 'Error deleting user', error });
    }
};

module.exports = {
    addUser,
    getUsers,
    getUserById,
    updateUserById,
    deleteUserById
};
