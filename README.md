# MySQL Stream demo

This repo is meant to demonstrate streaming data to mysql for indexing.


Prerequisites:
- Docker
- mysql


### Docker

Setup environment:

```bash
$ docker-compose up -d
```


Access mysql interactive mode:

```bash
$ mysql -h 0.0.0.0 -u root -p

# List the commands available
$ help
$ help COMMAND

# Create database with the name demo
$ source source/create-db.sql


# Use the demo database;
$ USE demo;



$ CREATE TABLE pet (name VARCHAR(20), owner VARCHAR(20),
    -> species VARCHAR(20), sex CHAR(1), birth DATE, death DATE)

# Show the tables. By default no tables are created.
$ SHOW TABLES;

$ DESCRIBE address;
```
DROP USER 'jeffrey'@'localhost';

source source/exporter-permission.sql

error:

time="2017-08-14T16:06:05Z" level=error msg="Error pinging mysqld: dial tcp 172.27.0.3:3306: getsockopt: connection refused" source="mysqld_exporter.go:268"
time="2017-08-14T16:06:10Z" level=error msg="Error pinging mysqld: dial tcp 172.27.0.3:3306: getsockopt: connection refused" source="mysqld_exporter.go:268"

change the ip to the same ip, restart mysqld-exporter
CREATE USER 'root'@'172.27.0.3' IDENTIFIED BY '123456' WITH MAX_USER_CONNECTIONS 300;


MAX_USER_CONNECTIONS 300;

BULK: 1
100 concurrency
100k - 2 minutes 58 seconds


BULK: 1
300 concurrency
100k - 1 minutes 46 seconds


BULK: 1
1000 concurrency
100k - 3 minutes 2 seconds


BULK: 100
300 concurrency
100k - 4694.539ms

BULK: 100
300 concurrency
1Million - 0.55 minutes

BULK: 500
300 concurrency
100k - 3215.159ms

BULK: 1000
300 concurrency
100k - 3373.087ms