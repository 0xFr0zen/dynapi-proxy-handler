import { response } from 'express';
export default interface DockerProxy {
    ip: string;
    ports: DockerProxyPortConfig;
}
export interface DockerProxyPortConfig {
    internal?: Array<number | null>;
    external: Array<number | null>;
}
