const express = require("express");
const {
    getPlaceById,
    getPlacesByUser,
    createPlace,
    updatePlace,
    deletePlace,
} = require("../controllers/places-controller");
const router = express.Router();
const { check } = require("express-validator");
const fileUpload = require("../middleware/file-upload");
const checkAuth = require('../middleware/check-auth');

router.get("/:pid", getPlaceById);

router.get("/user/:uid", getPlacesByUser);

router.use(checkAuth);

router.post(
    "/",
    fileUpload.single("image"), [
        check("title").not().isEmpty(),
        check("description").isLength({ min: 5 }),
        check("address").not().isEmpty(),
    ],
    createPlace
);

router.patch(
    "/:pid", [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
    updatePlace
);
router.delete("/:pid", deletePlace);

module.exports = router;