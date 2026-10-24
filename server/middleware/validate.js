const { z } = require('zod');

/**
 * 1. loginSchema:
 * - username: trimmed string, min 1, max 50 chars
 * - password: string, min 1, max 128 chars
 */
const loginSchema = z.object({
  username: z
    .string({ required_error: 'Username is required' })
    .trim()
    .min(1, 'Username is required')
    .max(50, 'Username must not exceed 50 characters'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required')
    .max(128, 'Password must not exceed 128 characters'),
});

/**
 * Reusable field schemas
 */
const destinationNameSchema = z
  .string({ required_error: 'Destination name is required' })
  .trim()
  .transform((val) => val.replace(/[<>]/g, '').trim())
  .pipe(
    z
      .string()
      .min(2, 'Destination name must be between 2 and 80 characters')
      .max(80, 'Destination name must be between 2 and 80 characters')
      .regex(
        /^[a-zA-Z0-9\s\-()]+$/,
        'Destination name can only contain alphanumeric characters, spaces, hyphens, and parentheses'
      )
  );

const fareSchema = z.coerce
  .number({ required_error: 'Fare is required' })
  .positive('Fare must be a positive number')
  .max(1000, 'Fare cannot exceed 1000');

/**
 * 2. createRouteSchema:
 * - originId: coerced positive integer
 * - destinationName: trimmed string, 2 to 80 chars, sanitized with a regex transform
 *   that strips '<' and '>' characters to prevent Stored XSS, allowing only alphanumeric
 *   characters, spaces, hyphens, and parentheses
 * - fare: coerced number, positive, max 1000
 */
const createRouteSchema = z.object({
  originId: z.coerce
    .number({ required_error: 'Origin terminal ID is required' })
    .int('Origin terminal ID must be an integer')
    .positive('Origin terminal ID must be a positive integer'),
  destinationName: destinationNameSchema,
  fare: fareSchema,
});

/**
 * 3. updateStatusSchema:
 * - req.params.id: coerced positive integer
 * - req.body.status: strictly z.enum(['APPROVED', 'REJECTED'])
 * - req.body.destinationName: optional sanitized string (2-80 chars)
 * - req.body.fare: optional coerced positive number (<= 1000)
 */
const baseUpdateStatusSchema = z.object({
  params: z.object({
    id: z.coerce
      .number({ required_error: 'Route ID is required' })
      .int('Route ID must be an integer')
      .positive('Route ID must be a positive integer'),
  }),
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED'], {
      message: "Status must be either 'APPROVED' or 'REJECTED'",
    }),
    destinationName: destinationNameSchema.optional(),
    fare: fareSchema.optional(),
  }),
});

// Preprocess allows validating either structured request ({ params, body }) or flat object ({ id, status, destinationName, fare })
const updateStatusSchema = z.preprocess((input) => {
  if (input && typeof input === 'object' && !('params' in input) && !('body' in input)) {
    const { id, status, destinationName, fare } = input;
    const body = { status };
    if (destinationName !== undefined) body.destinationName = destinationName;
    if (fare !== undefined) body.fare = fare;
    return {
      params: { id },
      body,
    };
  }
  return input;
}, baseUpdateStatusSchema);

// Expose schema shape and sub-schemas for inspection
updateStatusSchema.shape = baseUpdateStatusSchema.shape;
updateStatusSchema.params = baseUpdateStatusSchema.shape.params;
updateStatusSchema.body = baseUpdateStatusSchema.shape.body;

/**
 * Reusable validation middleware:
 * Validates request data against the provided Zod schema.
 * Automatically checks req.body, or structured { params, body, query } if the schema defines them.
 * Returns a 400 Bad Request with field errors if validation fails.
 */
const validate = (schema, source) => (req, res, next) => {
  try {
    const isRequestSchema =
      !source &&
      schema.shape &&
      ('params' in schema.shape || 'body' in schema.shape || 'query' in schema.shape);

    if (source) {
      const parsed = schema.parse(req[source]);
      if (source === 'body') req.validatedBody = parsed;
      if (source === 'params') req.validatedParams = parsed;
      if (source === 'query') req.validatedQuery = parsed;

      if (parsed && typeof parsed === 'object') {
        Object.assign(req[source], parsed);
      } else {
        req[source] = parsed;
      }
    } else if (isRequestSchema) {
      const parsed = schema.parse({
        params: req.params,
        body: req.body,
        query: req.query,
      });

      if (parsed.params) {
        req.validatedParams = parsed.params;
        Object.assign(req.params, parsed.params);
      }
      if (parsed.body) {
        req.validatedBody = parsed.body;
        req.body = parsed.body;
      }
      if (parsed.query) {
        req.validatedQuery = parsed.query;
        Object.assign(req.query, parsed.query);
      }
    } else {
      const parsed = schema.parse(req.body);
      req.validatedBody = parsed;
      req.body = parsed;
    }

    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = {};
      const errors = [];

      for (const issue of error.issues) {
        const fullPath = issue.path.join('.');
        const lastField = issue.path.length > 0 ? issue.path[issue.path.length - 1] : 'root';

        if (!fieldErrors[lastField]) {
          fieldErrors[lastField] = [];
        }
        fieldErrors[lastField].push(issue.message);

        if (fullPath && fullPath !== lastField) {
          if (!fieldErrors[fullPath]) {
            fieldErrors[fullPath] = [];
          }
          fieldErrors[fullPath].push(issue.message);
        }

        errors.push({
          field: fullPath || String(lastField),
          message: issue.message,
        });
      }

      return res.status(400).json({
        error: 'Validation failed',
        errors,
        details: fieldErrors,
        fieldErrors,
      });
    }
    next(error);
  }
};

module.exports = {
  validate,
  loginSchema,
  createRouteSchema,
  updateStatusSchema,
};
