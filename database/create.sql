create table user (id int not null auto_increment,
					name varchar(255) not null,
					email varchar(255) not null unique,
                    password varchar(255) not null,
                    constraint pk_user_id primary key (id));

create table greve (id int not null auto_increment,
					category varchar(255) not null,
                    start_date date not null,
                    end_date date not null,
                    constraint pk_greve_id primary key (id));
                    