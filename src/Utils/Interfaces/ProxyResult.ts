export default interface ProxyResult {
    port: number;
    ip: string;
    name: string;
    [name: string]: any;
}
