const express = require('express');
const router = express.Router();
const {getAllLocations,updateLocation} = require('../Controllers/gps');

router.post('/update_location',updateLocation );
router.get('/get_all_locations',getAllLocations );

module.exports = router;