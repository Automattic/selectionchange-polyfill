
# this dir
THIS_MAKEFILE_PATH:=$(word $(words $(MAKEFILE_LIST)),$(MAKEFILE_LIST))
THIS_DIR:=$(shell cd $(dir $(THIS_MAKEFILE_PATH));pwd)

# BIN directory
BIN := $(THIS_DIR)/node_modules/.bin

# applications
NODE ?= node
NPM ?= $(NODE) $(shell which npm)
BABEL ?= $(NODE) $(BIN)/babel

build: selectionchange.js

node_modules: package.json
	@$(NPM) install
	@touch node_modules

%.js: %.es6 node_modules
	@printf '\e[1;93m %-10s\e[m %s > %s\n' "babel" "$<" "$@"
	@$(BABEL) "$<" --optional selfContained --experimental > "$@"

clean:
	rm -f selectionchange.js

.PHONY: build clean
