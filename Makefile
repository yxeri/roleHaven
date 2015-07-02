build:
	docker build --force-rm -t rolehaven .
rmi:
	docker rmi rolehaven
compose:
	docker-compose build && docker-compose up -d
boot2open:
	open http://$(shell boot2docker ip):8888
boot2logs:
	docker logs rolehaven_rolehaven_1
