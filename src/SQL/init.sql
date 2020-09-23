use dynapi_proxy;

create table usecase(
	id int primary key auto_increment,
    proxy_name varchar(200) not null,
    proxy_port int not null,
    proxy_ip varchar(200) not null
);