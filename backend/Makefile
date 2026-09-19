PYTHON ?= python
MANAGE ?= $(PYTHON) manage.py

.PHONY: install migrate test lint seed docs run shell

install:
	$(PYTHON) -m pip install -r requirements.txt

migrate:
	$(MANAGE) migrate

test:
	$(PYTHON) -m pytest

seed:
	$(MANAGE) seed_demo --flush

run:
	$(MANAGE) runserver 0.0.0.0:8000

shell:
	$(MANAGE) shell_plus

docs:
	$(MANAGE) spectacular --file schema.json
