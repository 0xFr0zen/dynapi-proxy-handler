import express, { Application, Router } from 'express';
import axios, { Method } from 'axios';
import Database from '../Database';

export default class Server {
    private static app: Application;
    private static router: Router;
    private static PORT: number = Number();
    public static init = async (): Promise<Application> => {
        return new Promise<Application>(async (resolve, reject) => {
            if (Server.app) {
                throw new Error('You can run the Server only once.');
            }
            Server.app = express();
            const router = await Server.routes();
            Server.app.use(router);
            Server.app.listen(Server.PORT, () => {
                console.log(`Server is running on port: ${Server.PORT}`);
            });
        });
    };
    private static routes = async (): Promise<Router> => {
        return new Promise((resolve, reject) => {
            try {
                const router = Router({
                    mergeParams: true,
                    strict: true,
                    caseSensitive: true,
                });
                router.use('/:proxy(\\w+)/:parameters(*)', async (request, response) => {
                    const rp = request.params;
                    const db = await Database.find(rp.proxy);
                    const REQ_PORT = db.port;
                    const REQ_IP = db.ip;
                    // console.log(request.method as Method);
                    // let r = await axios(
                    //     `http${request.secure ? 's' : ''}://${REQ_IP}:${REQ_PORT}/${rp.parameters}`,
                    //     {}
                    // );
                    // return response.json(r.data);
                    return response.json(db);
                });
                resolve(router);
            } catch (error) {
                reject(error);
            }
        });
    };
}
