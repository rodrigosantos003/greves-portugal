# pis-project

## To run this project please follow the instructions below

1. Create a MySQL database on your root user, using the "create.sql" file, located on the [database](./database/) folder
2. Create a "connection-options.json" file on the [scripts](./scripts/) folder with the following content:

```
{
  "host": "localhost",
  "user": "root",
  "password": <YOUR ROOT PASSWORD>,
  "database": <DATABASE NAME>,
  "port": 3306
}
```

3. Run the commands:

- npm install
- npm run dev OR npm start
