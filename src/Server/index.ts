import express, { Application, Router, Request, Response } from 'express';
import axios, { Method } from 'axios';
import createDockerProxy from '../Utils/Interfaces/DockerProxy';
import { DockerImage } from '../Utils/Interfaces/IDocker';
import DockerProxy from '../Utils/Interfaces/DockerProxy';

export default class Server {
    private static app: Application;
    private static router: Router;
    private static PORT: number = Number(3_001);
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
    private static RequestResponseHandler = async (request: Request, response: Response) => {
        const rp = request.params;
        const dockerProxy = await axios('/containers/json', {
            method: 'GET',
            proxy: { port: 7805, host: '127.0.0.1' }, //localhost
        });

        const dockerImages = dockerProxy.data as DockerImage[];
        const foundProxySettings = dockerImages
            .filter((di) => {
                return di.Names.filter((name) => name === `/${rp.proxy}`).length === 1;
            })
            .map((di) => {
                return {
                    ip: di.NetworkSettings.Networks.bridge.IPAddress,
                    ports: {
                        external: di.Ports.filter((p) => typeof p.PublicPort !== 'undefined').map((p) => p.PublicPort),
                        internal: di.Ports.filter((p) => typeof p.PrivatePort !== 'undefined').map(
                            (p) => p.PrivatePort
                        ),
                    },
                } as DockerProxy;
            });
        if (foundProxySettings.length < 1) {
            return response.status(404).send('This proxy couldnt be found');
        }
        const proxySetting = foundProxySettings[0];

        delete rp.proxy;
        delete rp[0];

        let result: any;
        let url = `${request.protocol}://${rp.parameters}`;
        console.log(`Trying to request '${url}' via ${proxySetting.ip}:${proxySetting.ports.external[0]}`);
        try {
            let s = await axios({
                url,
                params: rp,
                method: request.method.toLowerCase() as Method,
                data: request.body,
                proxy: { port: proxySetting.ports.external[0], host: proxySetting.ip },
            });
            result = s.data;
        } catch (error) {
            console.log(error);
            result = { error: { message: error } };
        }

        return response.send(result);
    };
    private static routes = async (): Promise<Router> => {
        return new Promise((resolve, reject) => {
            try {
                const router = Router({
                    mergeParams: true,
                    strict: true,
                    caseSensitive: true,
                });
                let mainR = Router({
                    mergeParams: true,
                    strict: true,
                    caseSensitive: true,
                });
                mainR.use('/:parameters(*)$', (request: Request, response: Response) =>
                    Server.RequestResponseHandler(request, response)
                );
                router.use('/:proxy([a-zA-Z0-9_\\-]+)', mainR);
                resolve(router);
            } catch (error) {
                reject(error);
            }
        });
    };
}
