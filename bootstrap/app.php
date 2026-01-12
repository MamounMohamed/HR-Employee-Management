<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Throwable $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*')) {
                $response = app(\App\Services\ResponseService::class);

                if ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
                    return $response->notFound('Resource not found');
                }

                if ($e instanceof NotFoundHttpException) {
                    return $response->notFound('Route Not Found');
                }

                if ($e instanceof \Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException) {
                    return $response->error($e->getMessage() ?? 'Unauthorized Access', Response::HTTP_FORBIDDEN);
                }
            }
        });
    })->create();
