/**
 * Hello greeting routes - simple and clean
 * @module @voilajsx/flux/features/hello
 * @file src/features/hello/routes/helloRoutes.ts
 */

import { router, type RequestType } from "@/flux";
import translationService from "../services/helloService";

export default router('hello', (routes) => {
  routes.get('/hello', async (req: RequestType) => {
    const greeting = translationService.getGreeting(req.query.lang);
    return { message: `${greeting}! Welcome to Flux Framework` };
  });

  routes.get('/hi', async (req: RequestType) => {
    const greeting = translationService.getGreeting(req.query.lang);
    return { message: `${greeting}! 👋 Nice to see you here!` };
  });

  routes.get('/hello/:name', async (req: RequestType) => {
    const greeting = translationService.getGreeting(req.query.lang);
    return { message: `${greeting}, ${req.params.name}! Welcome to Flux Framework` };
  });
});