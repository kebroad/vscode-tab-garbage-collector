# VS Code Tab Garbage Collector Extension Makefile

# Variables
EXTENSION_NAME := vscode-tab-garbage-collector
VERSION := $(shell node -p "require('./package.json').version")
VSIX_NAME := $(EXTENSION_NAME)-$(VERSION).vsix

# Default target
.PHONY: all
all: clean build package

# Install dependencies
.PHONY: install
install:
	npm install

# Clean build artifacts
.PHONY: clean
clean:
	rm -rf out/
	rm -rf dist/
	rm -f *.vsix
	rm -f *.vsixmanifest

# Build the extension
.PHONY: build
build: install
	npm run compile

# Package the extension
.PHONY: package
package: build
	npm run package

# Create VSIX package
.PHONY: vsix
vsix: clean build
	vsce package

# Install vsce globally if not present
.PHONY: install-vsce
install-vsce:
	npm install -g @vscode/vsce

# Publish to VS Code Marketplace (requires vsce and publisher token)
.PHONY: publish
publish: install-vsce vsix
	vsce publish

# Publish with specific version
.PHONY: publish-patch
publish-patch: install-vsce
	vsce publish patch

.PHONY: publish-minor
publish-minor: install-vsce
	vsce publish minor

.PHONY: publish-major
publish-major: install-vsce
	vsce publish major

# Test the extension
.PHONY: test
test:
	npm test

# Lint the code
.PHONY: lint
lint:
	npm run lint

# Run all checks (lint, test, build)
.PHONY: check
check: lint test build

# Development mode with watch
.PHONY: dev
dev: install
	npm run watch

# Show help
.PHONY: help
help:
	@echo "Available targets:"
	@echo "  install      - Install dependencies"
	@echo "  clean        - Clean build artifacts"
	@echo "  build        - Build the extension"
	@echo "  package      - Package the extension"
	@echo "  vsix         - Create VSIX package"
	@echo "  publish      - Publish to VS Code Marketplace"
	@echo "  publish-patch- Publish with patch version bump"
	@echo "  publish-minor- Publish with minor version bump"
	@echo "  publish-major- Publish with major version bump"
	@echo "  test         - Run tests"
	@echo "  lint         - Lint the code"
	@echo "  check        - Run all checks (lint, test, build)"
	@echo "  dev          - Development mode with watch"
	@echo "  help         - Show this help message" 