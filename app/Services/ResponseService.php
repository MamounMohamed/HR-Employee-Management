<?php

namespace App\Services;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class ResponseService
{
    /**
     * Return a success response.
     * handles JsonResource and ResourceCollection automatically.
     */
    public function success(mixed $data, string $message = 'Success', int $code = Response::HTTP_OK): JsonResponse
    {
        if ($data instanceof JsonResource || $data instanceof ResourceCollection) {
            return $data->response()->setStatusCode($code);
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data
        ], $code);
    }

    /**
     * Return a created response (HTTP 201).
     */
    public function created(mixed $data, string $message = 'Resource created successfully'): JsonResponse
    {
        return $this->success($data, $message, Response::HTTP_CREATED);
    }

    /**
     * Return a no content response (HTTP 204).
     */
    public function noContent(): JsonResponse
    {
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * Return an error response.
     */
    public function error(string $message, int $code = Response::HTTP_BAD_REQUEST, array $errors = []): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors
        ], $code);
    }

    /**
     * Return a not found response (HTTP 404).
     */
    public function notFound(string $message = 'Resource not found'): JsonResponse
    {
        return $this->error($message, Response::HTTP_NOT_FOUND);
    }

    /**
     * Return a raw JSON response (for custom structures like Auth).
     */
    public function json(array $data, int $code = Response::HTTP_OK): JsonResponse
    {
        return response()->json($data, $code);
    }
}
