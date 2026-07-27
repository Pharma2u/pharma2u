import { Router } from "express";
import { getCompanyBranding } from "../controllers/company-branding.controller";

const router = Router();
router.get("/branding", getCompanyBranding);

export default router;
