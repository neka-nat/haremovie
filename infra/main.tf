module "required_api" {
  source = "./modules/required-api"
}

module "storage" {
  source = "./modules/storage"
  gcp_project_id = var.gcp_project_id
  primary_region = var.primary_region
  bucket_name = var.bucket_name
  required_apis = module.required_api.required_apis
}