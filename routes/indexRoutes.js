const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const panelRoutes = require('./panelRoutes');
const crateRoutes = require('./crateRoutes');
const batchRoutes = require('./batchRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const routeRoutes = require('./routeRoutes');
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
        route: '/api/crate',
        controller: crateRoutes
    },
    {
        route: '/api/batch',
        controller: batchRoutes
    },
    {
        route: '/api/route',
        controller: routeRoutes
    },
    {
        route: '/api/dashboard',
        controller: dashboardRoutes
    },
]