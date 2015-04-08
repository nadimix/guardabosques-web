REPORTER = spec

lint:
	./node_modules/.bin/jshint ./app.js

start:
	@NODE_ENV=production ./bin/www

test:
	$(MAKE) lint
	@NODE_ENV=development DEBUG=server:* ./bin/www
