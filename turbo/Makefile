# Define the default shell
SHELL := /bin/bash

# Default target directory (can be overridden from command line)
TARGET_DIR ?= .

# Function to add .hbs extension
define add_hbs_extension
	@if [[ "$$(basename "$(1)")" != *.hbs ]]; then \
		mv "$(1)" "$(1).hbs"; \
		echo "Renamed: $(1) -> $(1).hbs"; \
	else \
		echo "Skipped (already .hbs): $(1)"; \
	fi
endef

# Target to convert files to .hbs
convert-to-hbs:
	@echo "Converting files to .hbs in directory: $(TARGET_DIR)"
	@if [ ! -d "$(TARGET_DIR)" ]; then \
		echo "Error: '$(TARGET_DIR)' is not a valid directory."; \
		exit 1; \
	fi
	@find "$(TARGET_DIR)" -type f | while read -r file; do \
		$(call add_hbs_extension,$$file); \
	done
	@echo "Conversion complete in directory: $(TARGET_DIR)"

# Target to start development server
start_dev_instance:
	@echo "Starting dev instance..."
	@bun run dev


# New target to generate a project
generate:
	@echo "Generating a new project..."
	@./generate-app.sh

# Help target
help:
	@echo "Usage:"
	@echo "  make <target> [options]"
	@echo ""
	@echo "Targets:"
	@echo "  convert-to-hbs    Convert files to .hbs format"
	@echo "  start_dev_instance Start the development server"
	@echo "  start_jobs        Start jobs in a new terminal"
	@echo "  generate          Generate a new project"
	@echo "  help              Display this help message"
	@echo ""
	@echo "Options:"
	@echo "  TARGET_DIR=<directory>  Specify the directory for convert-to-hbs (default: current directory)"
	@echo ""
	@echo "Examples:"
	@echo "  make convert-to-hbs TARGET_DIR=./templates"
	@echo "  make start_dev_instance"
	@echo "  make start_jobs"
	@echo "  make generate"

# Set the default target to help
.DEFAULT_GOAL := help