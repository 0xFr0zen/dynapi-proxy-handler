import credentials from '../../database_credentials.json';

export default class Constants {
    public static Database: IDatabaseConfig = {
        user: new Promise((resolve, reject) => {
            try {
                const user: UserCredentials = {
                    name: credentials.user.name,
                    password: credentials.user.password,
                };
                return resolve(user);
            } catch (error) {
                return reject(error);
            }
        }),
        database: new Promise((resolve, reject) => {
            try {
                const db: DatabaseCredentials = credentials.database;
                return resolve(db);
            } catch (error) {
                return reject(error);
            }
        }),
        timeout: new Promise((resolve) => {
            return resolve(credentials.timeout || 60_000);
        }),
    };
}

export interface IDatabaseConfig {
    user: Promise<UserCredentials>;
    database: Promise<DatabaseCredentials>;
    timeout: Promise<number>;
}
export interface UserCredentials {
    name: string;
    password: string;
}

export interface DatabaseCredentials {
    name: string;
    port: number;
    host: string;
}
