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
        if (rp.proxy.includes(':')) {
            let [image, portindex] = rp.proxy.split(':');
            const foundProxySettings = (dockerProxy.data as DockerImage[])
                .filter((di) => {
                    return di.Names.filter((name) => name === `/${image}`).length === 1;
                })
                .map((di) => {
                    return {
                        ip: di.Ports.filter((p) => typeof p.IP !== 'undefined').map((p) => p.IP)[portindex],
                        ports: {
                            external: di.Ports.filter((p) => typeof p.PublicPort !== 'undefined').map(
                                (p) => p.PublicPort
                            ),
                        },
                    } as DockerProxy;
                });
            if (foundProxySettings.length < 1) {
                throw Error('This proxy couldnt be found');
            }
            const { ip, ports } = foundProxySettings[0];
            let url = `${ip}:${ports.external[0]}/${rp.parameters ? rp.parameters : ''}`;
            console.log(`created url: ${url}`);
            const res = await axios({
                url,
                data: request.body ? request.body : {},
                method: request.method as Method,
                onUploadProgress: (progress) => {
                    console.log(progress);
                },
                onDownloadProgress: (progress) => {
                    console.log(progress);
                },
                proxy: false,
            });
            // those requests wont work properly, need to check why, image ip and port is alright

            return response.send(res.data);
        } else {
            return response.status(404).json({ error: { message: 'Couldnt find this endpoint' } });
        }
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
