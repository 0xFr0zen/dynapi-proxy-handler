import m from 'mysql2/promise';
import Constants from '../Utils/constants';
import ProxyResult from '../Utils/Interfaces/ProxyResult';
export default class Database {
    private static _conn: m.Connection;

    private static Connection = async () => {
        if (!Database._conn) {
            const dbUser = await Constants.Database.user;
            const db = await Constants.Database.database;
            const to = await Constants.Database.timeout;
            Database._conn = await m.createConnection({
                host: db.host,
                port: db.port,
                user: dbUser.name,
                password: dbUser.password,
                database: db.name,
                connectTimeout: to,
            });
        }

        return Database._conn;
    };
    public static find = (proxy: string): Promise<ProxyResult | null> => {
        return new Promise(async (resolve, reject) => {
            try {
                const dbconn = await Database.Connection();
                const result = await dbconn.query('SELECT * FROM proxy_usecase where `name` = ? LIMIT 1', [proxy]);
                resolve(result[0][0] as ProxyResult);
            } catch (error) {
                reject(error);
            }
        });
    };
}
