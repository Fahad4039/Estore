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
import { requireAdmin, requireAuth, requireSeller } from "../middlewares/auth";

const router: IRouter = Router();

router.use(healthRouter);
// Product browsing and review browsing are public. Mutating product data and
// creating/helping reviews require an authenticated session.
router.use("/products", (req, res, next) => {
  if (req.method === "GET") return next();
  if (req.method === "POST" && req.path.endsWith("/view")) return next();
  return requireAuth(req, res, (error?: unknown) => {
    if (error) return next(error);
    if (req.user?.role !== "admin" && req.user?.is_seller !== true) {
      return res.status(403).json({ error: "Seller or admin access required" });
    }
    return next();
  });
});
router.use("/reviews", (req, res, next) => {
  if (req.method === "GET") return next();
  return requireAuth(req, res, next);
});
router.use(productsRouter);
router.use(authRouter);

router.use("/cart", requireAuth);
router.use("/wishlist", requireAuth);
router.use("/orders", requireAuth);
router.use("/wallet", requireAuth);
router.use("/checkin", requireAuth);
router.use("/referral", requireAuth);
router.use("/users", requireAuth);
router.use("/admin", requireAuth, requireAdmin);
// Seller registration needs authentication; seller dashboards add the
// stricter requireSeller middleware in the seller router.
router.use("/seller", (req, res, next) => {
  if (req.path.startsWith("/profile/")) return next();
  return requireAuth(req, res, (error?: unknown) => {
    if (error) return next(error);
    if (req.path === "/register") return next();
    return requireSeller(req, res, next);
  });
});

router.use(cartRouter);
router.use(wishlistRouter);
router.use(ordersRouter);
router.use(reviewsRouter);
router.use(walletRouter);
router.use(adminRouter);
router.use(sellerRouter);
router.use(usersRouter);

export default router;
