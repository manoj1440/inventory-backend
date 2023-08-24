const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const panelRoutes = require('./panelRoutes');
const batchRoutes = require('./batchRoutes');
module.exports = [
    {
        route: '/api',
        controller: authRoutes
    },
    {
        route: '/api/user',
        controller: userRoutes
    },
    {
        route: '/api/panel',
        controller: panelRoutes
    },
    {
        route: '/api/batch',
        controller: batchRoutes
    },
]