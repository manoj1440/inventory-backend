const Panel = require("../models/Panel");

const createNewPanel = async (panelData) => {
    const { serialNumber, receivedAt, received, DOM, DOE, included } = panelData;

    if (!serialNumber) {
        throw new Error('Serial number is required');
    }

    const newPanelData = new Panel({
        serialNumber,
        receivedAt: receivedAt || null,
        received: received !== undefined ? received : false,
        DOM: DOM || null,
        DOE: DOE || null,
        included: included !== undefined ? included : false,
    });

    return await newPanelData.save();
};
module.exports = {
    createNewPanel,
};
