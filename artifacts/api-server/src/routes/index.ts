import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import tutorsRouter from "./tutors";
import videosRouter from "./videos";
import classesRouter from "./classes";
import statsRouter from "./stats";
import adminRouter from "./admin";
import setupRouter from "./setup";
import bookingsRouter from "./bookings";
import reviewsRouter from "./reviews";
import messagesRouter from "./messages";
import notificationsRouter from "./notifications";
import resourcesRouter from "./resources";
import availabilityRouter from "./availability";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(tutorsRouter);
router.use(videosRouter);
router.use(classesRouter);
router.use(statsRouter);
router.use(adminRouter);
router.use(setupRouter);
router.use(bookingsRouter);
router.use(reviewsRouter);
router.use(messagesRouter);
router.use(notificationsRouter);
router.use(resourcesRouter);
router.use(availabilityRouter);

export default router;
