.PHONY: start setup start_docker start_dev_instance stripe-listen

SHELL := /bin/bash

# Detect OS
ifeq ($(OS),Windows_NT)
    DETECTED_OS := Windows
else
    DETECTED_OS := $(shell uname -s)
endif

start: setup start_stripe_listener start_dev_instance

setup: start_docker
	@echo "Running setup..."
	@cd ../../apps/api/supabase && make setup

start_docker:
	@echo "Checking Docker status..."
	@if ! docker info > /dev/null 2>&1; then \
		echo "Docker is not running. Attempting to start Docker Desktop..."; \
		case "$(DETECTED_OS)" in \
			"Darwin") open -a Docker ;; \
			"Windows") start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe" ;; \
			"Linux") systemctl start docker || sudo systemctl start docker ;; \
			*) echo "Unsupported OS for automatic Docker start. Please start Docker manually." && exit 1 ;; \
		esac; \
		echo "Waiting for Docker to start..."; \
		for i in $$(seq 1 30); do \
			if docker info > /dev/null 2>&1; then \
				echo "Docker is now running."; \
				break; \
			fi; \
			if [ $$i -eq 30 ]; then \
				echo "Timeout: Docker did not start in time. Please start it manually."; \
				exit 1; \
			fi; \
			sleep 2; \
		done; \
	else \
		echo "Docker is already running."; \
	fi

start_stripe_listener:
	@echo "Opening new terminal for Stripe listener..."
	@case "$(DETECTED_OS)" in \
		"Darwin") osascript -e 'tell app "Terminal" to do script "cd $(PWD) && bun run stripe:listen"' ;; \
		"Windows") start cmd /c "cd $(PWD) && bun run stripe:listen" ;; \
		"Linux") if command -v gnome-terminal > /dev/null; then \
					gnome-terminal -- bash -c "cd $(PWD) && bun run stripe:listen; exec bash"; \
				elif command -v xterm > /dev/null; then \
					xterm -e "cd $(PWD) && bun run stripe:listen" & \
				else \
					echo "Unable to open a new terminal automatically. Please open a new terminal and run 'bun run stripe:listen' manually."; \
				fi ;; \
		*) echo "Unsupported OS. Please open a new terminal and run 'bun run stripe:listen' manually." ;; \
	esac

start_dev_instance:
	@echo "Starting dev instance..."
	@bun run dev