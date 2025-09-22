module "required_api" {
  source = "./modules/required-api"
}

module "storage" {
  source = "./modules/storage"
  gcp_project_id = var.gcp_project_id
  gcp_project_number = var.gcp_project_number
  primary_region = var.primary_region
  bucket_name = var.bucket_name
  required_apis = module.required_api.required_apis
}

module "cloud_tasks" {
  source = "./modules/cloud-tasks"
  gcp_project_id = var.gcp_project_id
  primary_region = var.primary_region
  queue_name = var.queue_name
  required_apis = module.required_api.required_apis
}

module "secrets_manager" {
  source = "./modules/secrets-manager"
  gcp_project_id = var.gcp_project_id
  secrets_file = var.secrets_file
  required_apis = module.required_api.required_apis
}

module "cloud_sql" {
  source = "./modules/cloud-sql"
  gcp_project_id = var.gcp_project_id
  primary_region = var.primary_region
  cloud_sql_instance_name = var.cloud_sql_instance_name
  db_name = var.db_name
  required_apis = module.required_api.required_apis
  google_secret_manager_secret_version = module.secrets_manager.google_secret_manager_secret_version
}

module "artifact_registry" {
  source = "./modules/artifact-registry"
  gcp_project_id = var.gcp_project_id
  primary_region = var.primary_region
  repository_id = var.repository_id
  required_apis = module.required_api.required_apis
}

module "service_accounts" {
  source = "./modules/service-accounts"
  gcp_project_id = var.gcp_project_id
  required_apis = module.required_api.required_apis
}

module "cloud_run_app" {
  source                 = "./modules/cloud-run"
  gcp_project_id         = var.gcp_project_id
  name                   = "haremovie-app"
  primary_region         = var.primary_region
  repository_url         = module.artifact_registry.repository_url
  service_account_email  = module.service_accounts.app_sa_email
  command                = "fastapi"
  args                   = ["run", "src/haremovie_api/server.py", "--port", "8080"]
  env                    = {
    GOOGLE_STORAGE_BUCKET_NAME = var.bucket_name
    GOOGLE_CLOUD_PROJECT       = var.gcp_project_id
    GOOGLE_CLOUD_LOCATION      = var.primary_region
    HAREMOVIE_WORKER_URL           = module.cloud_run_worker.url
    CORS_ALLOWED_ORIGINS       = var.cors_allowed_origins
    INSTANCE_CONNECTION_NAME   = module.cloud_sql.instance_connection_name
  }
  secret_env = {
    "DB_PASSWORD" = module.secrets_manager.secrets["DB_PASSWORD"].version
  }
  public_access = true
  required_apis = module.required_api.required_apis
}

module "cloud_run_worker" {
  source                 = "./modules/cloud-run"
  gcp_project_id         = var.gcp_project_id
  name                   = "haremovie-worker"
  primary_region         = var.primary_region
  repository_url         = module.artifact_registry.repository_url
  service_account_email  = module.service_accounts.worker_sa_email
  command                = "fastapi"
  args                   = ["run", "src/haremovie_api/worker.py", "--port", "8080"]
  env                    = {
    GOOGLE_STORAGE_BUCKET_NAME        = var.bucket_name
    GOOGLE_CLOUD_PROJECT              = var.gcp_project_id
    GOOGLE_CLOUD_LOCATION             = var.primary_region
    GOOGLE_AGENT_ENGINE_RESOURCE_NAME = var.google_agent_engine_resource_name
    INSTANCE_CONNECTION_NAME          = module.cloud_sql.instance_connection_name
  }
  secret_env = {
    "DB_PASSWORD" = module.secrets_manager.secrets["DB_PASSWORD"].version
  }
  public_access = true
  required_apis = module.required_api.required_apis
}
