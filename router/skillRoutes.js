import express from "express";
import { addNewSkill, getAllSkill, deleteSkill, updateSkill } from "../controller/skillController.js";

import { isAuthenticated } from "../middleware/auth.js"

const router = express.Router();

router.post("/add", isAuthenticated, addNewSkill);
router.get("/getAll", getAllSkill);
router.delete("/delete/:id", isAuthenticated, deleteSkill);
router.put("/update/:id", isAuthenticated, updateSkill);



export default router;