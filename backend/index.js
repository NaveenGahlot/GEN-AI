import {app} from './src/app.js';
// import dotenv from 'dotenv';
import { main } from './src/config/database.js'; 

// dotenv.config();
// this will connect to the database before starting the server to ensure that the app only starts if the database connection is successful
main();


app.listen(8080, () => {
    console.log('app listening on port 8080');
});