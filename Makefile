GIT_MODIFIED_UPDATED = $(shell git status --porcelain | grep -E '.?[AM].+[.]js(on)?$$' | sed -e "s/^...//g")

SRC = $(wildcard lib/*.js)
DOC = $(SRC:lib/%.js=doc/%.md)

doc/%.md: lib/%.js
	@mkdir -p $(@D)
	@./node_modules/jsdox/bin/jsdox --output doc $<

doc: doc-clean $(DOC)

doc-clean:
	@rm -f $(DOC)

tidy:
	@./node_modules/js-beautify/js/bin/js-beautify.js -p -k -w120 -r -f $(GIT_MODIFIED_UPDATED)

lint:
	@./node_modules/jshint/bin/jshint --verbose $(GIT_MODIFIED_UPDATED)