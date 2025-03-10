const express = require('express');
const router = express.Router();
const {getAllLocations,updateLocation,getNearbyDeliveryPeople} = require('../Controllers/gps');

router.post('/update_location',updateLocation );
router.get('/get_all_locations',getAllLocations );
router.get('/get_nearby_locations/:latitude/:longitude',getNearbyDeliveryPeople );

module.exports = router;