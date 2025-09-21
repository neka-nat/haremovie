variable "gcp_project_id" {}
variable "secrets_file" {}
variable "required_apis" {}

locals {
  secrets_content = yamldecode(file(var.secrets_file))

  secrets = {
    for key, value in local.secrets_content :
    "${key}" => value
  }
}

resource "google_secret_manager_secret" "this" {
  for_each  = local.secrets
  project   = var.gcp_project_id
  secret_id = each.key
  replication {
    auto {}
  }
  depends_on = [var.required_apis]
}

resource "google_secret_manager_secret_version" "this" {
  for_each    = local.secrets
  secret      = google_secret_manager_secret.this[each.key].id
  secret_data = each.value
}

output "google_secret_manager_secret_version" {
  value = google_secret_manager_secret_version.this
}
