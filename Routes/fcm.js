const express = require("express");
const { saveFcmToken, getFcmToken } = require("../Firebase/fmc_token_service");
const router = express.Router();

router.post("/save", saveFcmToken);

router.get("/getToken/:id", async (req, res) => {
const token=await  getFcmToken(req.params.id);
  token? res.json({token}):res.json({token:"No token"});
});

module.exports = router;
