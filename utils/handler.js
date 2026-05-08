import status from 'http-status';

class ResponseHandler {
    static handleOne(property, res, error, result) {
        if (error) {
            return res
                .status(status.INTERNAL_SERVER_ERROR)
                .json({ error: error.toString() });
        }

        let prop, msg;
        if (typeof property !== 'string') {
            ({ prop, msg } = property);
        }

        if (!result) {
            return res
                .status(status.NOT_FOUND)
                .json({ error: (msg ? msg : property) + ' not found' });
        }

        const json = {};
        json[prop ? prop : property] = result;
        res.json(json);
    }

    static handleMany(property, res, error, result) {
        if (error) {
            return res
                .status(status.INTERNAL_SERVER_ERROR)
                .json({ error: error.toString() });
        }
        
        const json = {};
        json[property] = result;
        res.json(json);
    }

    static handleError(res, _status, err) {
        return res.status(_status).json({
            status: _status,
            message: err.message.toString()
        });
    }
}

export default ResponseHandler;
