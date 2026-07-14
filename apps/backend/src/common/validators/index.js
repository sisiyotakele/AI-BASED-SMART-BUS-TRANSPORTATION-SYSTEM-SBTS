export const validateRequest = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync(req.body);
            next();
        }
        catch (error) {
            const details = error instanceof Error ? error.message : 'Validation error';
            res.status(400).json({
                status: 'fail',
                error: details,
            });
        }
    };
};
