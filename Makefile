build: node_modules
	docker build --pull -t rolehaven .
node_modules:
	docker run --rm -v "$(PWD):/usr/src/app" -w "/usr/src/app" node:7.1.0 npm install
rmi:
	docker rmi rolehaven
compose:
	docker-compose up --build
open:
	open http://localhost:8888
logs:
	docker-compose logs
clean:
	docker-compose rm --all

.PHONY: build node_modules rmi compose open logs
