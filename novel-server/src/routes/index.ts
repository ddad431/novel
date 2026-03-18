import { Router } from "express";
import novelRouter from "./novel.routes";
import uploadRouter from "./upload.routes";

const route = Router();
route.use('/novel', novelRouter);
route.use('/upload', uploadRouter);

export default route;