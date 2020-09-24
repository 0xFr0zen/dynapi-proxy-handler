import express, { Application, Router, Request, Response, NextFunction } from 'express';
import axios, { AxiosRequestConfig, Method } from 'axios';
import proxy from 'express-http-proxy';
import { DockerImage } from '../Utils/Interfaces/IDocker';
import DockerProxy from '../Utils/Interfaces/DockerProxy';
import Constants from '../Utils/constants';

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
    private static RequestResponseHandler = async (request: Request, response: Response): Promise<any> => {
        const rp = request.params;
        const dockerProxy = await axios('/containers/json', {
            method: 'GET',
            proxy: Constants.Docker,
        });

        const foundProxySettings = (dockerProxy.data as DockerImage[])
            .filter((di) => {
                return di.Names.filter((name) => name === `/${rp.proxy}`).length === 1;
            })
            .map((di) => {
                return {
                    ip: di.NetworkSettings.Networks.bridge.Gateway,
                    ports: {
                        external: di.Ports.filter((p) => typeof p.PublicPort !== 'undefined').map((p) => p.PublicPort),
                    },
                } as DockerProxy;
            });
        if (foundProxySettings.length < 1) {
            throw Error('This proxy couldnt be found');
        }
        const { ports } = foundProxySettings[0];
        const res = await axios({
            url: `0.0.0.0:${ports.external[0]}/${rp.parameters ? rp.parameters : ''}`,
            data: request.body ? request.body : {},
        });
        return response.send(res.data);
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
                mainR.use(
                    '/:parameters(*)$',
                    async (req: Request, res: Response) => await Server.RequestResponseHandler(req, res)
                );
                router.use('/:proxy([a-zA-Z0-9_\\-]+)', mainR);
                resolve(router);
            } catch (error) {
                reject(error);
            }
        });
    };
}
