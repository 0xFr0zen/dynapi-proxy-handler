import { AxiosProxyConfig } from 'axios';
import docker from '../../docker.json';

export default class Constants {
    public static Docker = docker as AxiosProxyConfig;
}
