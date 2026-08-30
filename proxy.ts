import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/batches(.*)",
  "/transactions(.*)",
  "/exceptions(.*)",
  "/ai-insights(.*)",
  "/reports(.*)",
  "/audit(.*)",
  "/copilot(.*)",
  "/upload(.*)",
  "/settings(.*)",
  "/api/dashboard(.*)",
  "/api/batches(.*)",
  "/api/reconcile(.*)",
  "/api/report(.*)",
  "/api/upload(.*)",
  "/api/search(.*)",
  "/api/notifications(.*)",
  "/api/audit(.*)",
  "/api/copilot(.*)",
  "/api/razorpay(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
