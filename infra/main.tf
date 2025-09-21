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
