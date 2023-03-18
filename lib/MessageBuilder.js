class MessageBuilder{
    /**
    * @param {Error} Err MongoDB error object.
    * @param {string} Message Success Message
    * @param {JSON} Data json object containing response data if successfull.
    */
    static createResponse(Err, Message, Data = undefined){
        return new Promise((resolve, reject) => { 
            var Response;
            if(Err){
                if(Err.code === 11000){
                    Response = {status: "Error", message: "E-Mail already registered skipping!", data: null};
                } else {
                    Response = {status: "Error", message: "A unknown error occured!", data: null};
                }
            } else {
                Response = {status: "OK", message: Message, data: Data};
            }
            resolve(Response);
        });
    }
}

module.exports = MessageBuilder;