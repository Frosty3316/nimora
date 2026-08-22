export function notFound(_req, res) {
  res.status(404).json({ error: { message: "Route not found." } });
}

export function errorHandler(err, _req, res, _next) {
  if (err?.name === "ZodError") {
    return res.status(400).json({
      error: {
        message: "Validation failed.",
        details: err.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
  }

  if (err?.code === "P2002") {
    return res.status(409).json({ error: { message: "A record with that value already exists." } });
  }

  console.error(err);
  const expose = process.env.NODE_ENV !== "production" && err.message;
  res.status(err.status || 500).json({
    error: { message: expose || "Unexpected server error." },
  });
}

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
