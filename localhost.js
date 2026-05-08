import app from './app.js';
import config from './config.js';
import {connectDB} from './db.js';


connectDB();
const PORT = process.env.PORT || config.port;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

