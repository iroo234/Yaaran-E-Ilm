import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import tutorsRouter from "./tutors";
import videosRouter from "./videos";
import classesRouter from "./classes";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(tutorsRouter);
router.use(videosRouter);
router.use(classesRouter);
router.use(statsRouter);

export default router;
