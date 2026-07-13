export const requestLogger = (req:any,_res:any,next:any)=>{ console.log(req.method, req.path); next(); };
