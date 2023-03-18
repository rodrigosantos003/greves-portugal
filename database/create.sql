CREATE TABLE user (id INT NOT NULL AUTO_INCREMENT,
						name VARCHAR(255) NOT NULL,
						email VARCHAR(255) NOT NULL,
                  password VARCHAR(255) NOT NULL,
                  CONSTRAINT pk_user_id PRIMARY KEY (id));

CREATE TABLE strike (id INT NOT NULL AUTO_INCREMENT,
						category VARCHAR (255) NOT NULL,
                  start_date DATETIME NOT NULL,
                  end_date DATETIME NOT NULL,
                  description VARCHAR(255) NOT NULL,
                  CONSTRAINT pk_greve_id PRIMARY KEY (id));
                    