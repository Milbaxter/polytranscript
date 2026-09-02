.PHONY: install test build run docker-up clean

install:
	@echo "Installing Backend..."
	python3 -m venv backend/venv
	backend/venv/bin/pip install -r backend/requirements.txt
	@echo "Installing Frontend..."
	cd frontend && npm install

test:
	@echo "Running Pytest suite..."
	cd backend && PYTHONPATH=. venv/bin/pytest tests/

build:
	@echo "Building Next.js frontend..."
	cd frontend && npm run build

run:
	./start.sh

docker-up:
	docker compose up -d

clean:
	rm -rf backend/venv frontend/node_modules frontend/.next /tmp/omnitranscript
