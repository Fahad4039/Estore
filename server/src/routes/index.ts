import { Router, type IRouter } from "express";
import healthRouter    from "./health";
import productsRouter  from "./products";
import authRouter      from "./auth";
import cartRouter      from "./cart";
import wishlistRouter  from "./wishlist";
import ordersRouter    from "./orders";
import reviewsRouter   from "./reviews";
import walletRouter    from "./wallet";
import adminRouter     from "./admin";
import sellerRouter    from "./seller";
import usersRouter     from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(authRouter);
router.use(cartRouter);
router.use(wishlistRouter);
router.use(ordersRouter);
router.use(reviewsRouter);
router.use(walletRouter);
router.use(adminRouter);
router.use(sellerRouter);
router.use(usersRouter);

export default router;
