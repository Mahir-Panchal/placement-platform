up:
	docker-compose up --build

down:
	docker-compose down

shell:
	docker-compose exec backend python manage.py shell

migrate:
	docker-compose exec backend python manage.py migrate

test:
	docker-compose exec backend pytest apps/ -v

logs:
	docker-compose logs -f backend