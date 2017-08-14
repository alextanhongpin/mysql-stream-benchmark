CREATE USER 'root'@'172.27.0.3' IDENTIFIED BY '123456' WITH MAX_USER_CONNECTIONS 300;
GRANT PROCESS, REPLICATION CLIENT, SELECT ON *.* TO 'root'@'%';

# GRANT ALL PRIVILEGES on *.* TO prometheus@127.0.0.1 IDENTIFIED BY 123456;
-- GRANT PROCESS, REPLICATION CLIENT ON *.* TO 'prometheus'@'localhost' IDENTIFIED BY 'prometheus';
-- GRANT SELECT ON performance_schema.* TO 'prometheus'@'localhost';
-- GRANT FILE ON *.* TO 'prometheus'@'localhost';

# GRANT PROCESS, REPLICATION CLIENT ON *.* TO 'john'@'%' IDENTIFIED BY '123456';
# GRANT SELECT ON performance_schema.* TO 'root'@'%';
# GRANT ALL PRIVILEGES ON sbtest.* TO 'sysbench'@'%' IDENTIFIED BY 'sysbench';