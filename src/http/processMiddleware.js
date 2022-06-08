const processMiddleware = (callback,options)=> {
	// if(typeof callback === 'function') return callback(req,res);
	return {"callback":callback,"options":options};
};
export default processMiddleware;