
# Document Management System

This is our project for "Wep application Document Management System" (Code subject: SWP391)


## Tech Stack

**Client:** Vite, Material UI, Firebase, Vercel

**Server:** Node, Express, TypeORM, PostgreSQL, Firebase, Google Cloud Platform


## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`PORT`

`DB_HOST`

`DB_PORT`

`DB_USERNAME`

`DB_PASSWORD`

`DB_NAME`


## Run Locally

1. Clone the project

```bash
  git clone https://github.com/DaiNghia0212/DocManagementSystemServer.git
```

2. Go to the project directory

```bash
  cd DocManagementSystemServer
```

3. Put into the project directory **adminSDK service account file of Firebase** and **service account file of Google Cloud**

4. Install Cloud SQL Proxy

```bash
  curl https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.1.1/cloud-sql-proxy.x64.exe -o cloud-sql-proxy.exe
```

5. Run Cloud SQL Proxy

```bash
  ./cloud-sql-proxy --credentials-file PATH_TO_GOOGLE_CLOUD_SERVICE_ACOUNT_FILE INSTANCE_CONNECTION_NAME & 
```

6. Set up Environment Variables

7. Install dependencies

```bash
  npm install
```

8. Build the project

```bash
  npm run build
```

9. Start the server

- Development mode

```bash
  npm run dev
```

- Production mode

```bash
  npm run start
```


## API Reference

http://locahost:{PORT}/docs


## Authors

- [Vo Minh Tien](https://www.github.com/MinhhTien)
- [Nguyen Hoai Phong](https://www.github.com/hideonbush106)
- [Vo Huynh Dai Nghia](https://www.github.com/DaiNghia0212)
- [Le Do Duc Anh](https://www.github.com/Ddwcsanh)
- [Nguyen Thi Thanh Hao](https://www.github.com/sarahnguyenS2)

