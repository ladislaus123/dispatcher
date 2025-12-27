"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            const validated = schema.parse(req.body);
            req.body = validated;
            next();
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: error.errors?.map((e) => ({
                    path: e.path.join('.'),
                    message: e.message,
                })),
            });
        }
    };
};
exports.validateRequest = validateRequest;
//# sourceMappingURL=validation.js.map