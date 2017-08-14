# MySQL Stream demo

This repo is meant to demonstrate streaming data to mysql for indexing.


Prerequisites:
- Docker
- mysql


### Docker

Start docker:

```bash
$ docker-compose up -d
```

Access mysql interactive mode:

```bash
$ mysql -h 0.0.0.0 -u root -p

# Apply the permission for mysqld-exporter
$ source source/exporter-permission.sql
```


If you encountered this error with mysqld-exporter:

```bash
time="2017-08-14T16:06:05Z" level=error msg="Error pinging mysqld: dial tcp 172.27.0.3:3306: getsockopt: connection refused" source="mysqld_exporter.go:268"
time="2017-08-14T16:06:10Z" level=error msg="Error pinging mysqld: dial tcp 172.27.0.3:3306: getsockopt: connection refused" source="mysqld_exporter.go:268"

# change the ip to the same ip, restart mysqld-exporter
$ CREATE USER 'root'@'172.27.0.3' IDENTIFIED BY '123456' WITH MAX_USER_CONNECTIONS 300;
```

For the tests conducted below, the `MAX_USER_CONNECTIONS` is set to 300.


Device used:
```bash
$ sysctl -n machdep.cpu.brand_string
# Intel(R) Core(TM) i5-6267U CPU @ 2.90GHz
```

| Bulk Index | Concurrency | No. of rows | Time taken to complete |
|------|-------------|-------------|------------------------|
| 1 | 100 | 100k | 2 minutes 58 seconds |
| 1 | 300 | 100k | 1 minutes 46 seconds |
| 1 | 1000 | 100k | 3 minutes 2 seconds |
| 100 | 300 | 100k | 4.7 seconds |
| 100 | 300 | 1m | 55 seconds |
| 500 | 300 | 100k | 3.2 seconds |
| 1000 | 300 | 100k | 3.3 seconds |


TODO: 
- fix docker image version
- elaborate on the process
- monitor cpu/memory and network 
- compare against golang
- add stream example
- add query example