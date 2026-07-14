export const requestLogger = (req, _res, next) => { console.log(req.method, req.path); next(); };
