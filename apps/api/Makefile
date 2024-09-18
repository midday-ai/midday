include .env
export

.PHONY: help start-docker stop-docker docker-status start-supabase stop-supabase stop-and-restart-supabase supabase-migrate supabase-diff supabase-restart supabase-dev precondition local

help: ## Display this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

# Docker commands
start-docker: ## Start Docker Desktop
	@echo "Starting Docker Desktop..."
	@open -a Docker

stop-docker: ## Stop Docker Desktop
	@echo "Stopping Docker Desktop..."
	@pkill Docker

docker-status: ## Get Docker Desktop status
	@echo "Docker Desktop status:"
	@docker system info

# Supabase commands
start-supabase: ## Start Supabase
	@echo "Starting Supabase..."
	@supabase start

stop-supabase: ## Stop Supabase
	@echo "Stopping Supabase..."
	@supabase stop

stop-and-restart-supabase: ## Stop and reset Supabase
	@echo "Stopping and resetting Supabase..."
	@supabase stop --no-backup

supabase-migrate: ## Migrate Supabase
	@echo "Migrating Supabase..."
	@supabase db reset

supabase-diff: ## Diff Supabase
	@echo "Diffing Supabase..."
	@supabase db diff --schema public

supabase-restart: ## Restart Supabase
	@echo "Restarting Supabase..."
	@supabase stop
	@supabase start

supabase-dev: start-docker supabase-restart supabase-migrate ## Run Supabase in dev mode
	@echo "Opening Supabase Studio..."
	@open http://127.0.0.1:54323

# Project-specific commands
precondition: ## Load environment variables
	@echo "Environment variables loaded from .env"

local: precondition supabase-restart supabase-migrate ## Run local development setup

setup: clean-supabase
	@echo "Starting Supabase and seeding data..."
	bun run supabase:start 
	bun run supabase:reset
	bun run seed:local
	supabase status

clean-supabase: ## Stop Supabase and clean volumes if running, started, or in an unhealthy state
	@echo "Checking Supabase status..."
	@supabase status
	@echo "Supabase status check complete."
	@echo "Evaluating condition..."
	@if supabase status | grep -q . ; then \
		echo "Condition is TRUE"; \
		echo "Detected Supabase running or in problematic state."; \
		echo "Stopping Supabase and cleaning volumes..."; \
		supabase stop || true; \
		echo "Stopping any remaining Supabase containers..."; \
		docker volume rm $$(docker volume ls -q --filter label=com.supabase.cli.project=trnlccdjeihaaxmcaddm) || true; \
		echo "Supabase stopped and volumes cleaned."; \
	else \
		echo "Condition is FALSE"; \
		echo "Supabase is not detected as running or in a problematic state. No action needed."; \
	fi

debug-supabase-status:
	@echo "Supabase Status Output:"
	@supabase status | tee /dev/tty | wc -l
	@echo "Grep test results:"
	@supabase status | grep -E "running|started|unhealthy|container is not ready" || echo "No match found"
	@supabase status | grep "supabase local development setup is running" || echo "No match found"
