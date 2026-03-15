import dotenv from 'dotenv';
dotenv.config(); // must be called before anything else so env vars are available

import {app} from './src/app.js';
import { main } from './src/config/database.js';

// this will connect to the database before starting the server to ensure that the app only starts if the database connection is successful
main();


app.listen(8080, () => {
    console.log('app listening on port 8080');
});