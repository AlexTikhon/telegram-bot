declare module "better-sqlite3" {
  class Database {
    constructor(filename: string);
    pragma(value: string): void;
    exec(sql: string): void;
    prepare(sql: string): any;
    transaction<T extends (...args: any[]) => any>(fn: T): T;
  }

  namespace Database {
    type Database = any;
  }

  export default Database;
}
